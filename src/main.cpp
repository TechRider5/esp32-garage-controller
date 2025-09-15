#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <WiFiManager.h>

// ========= FILL THESE =========
const char* TOKEN_SERVER_URL = "https://quincy-garage.vercel.app/api/iot-token";  // your Vercel route
const char* IOT_API_KEY      = "7f9c2ba4e88f827d616045507605853ed73b8093f6b0f7f0a5b1c2d3e4f50617"; // same as Vercel env
const char* WEB_API_KEY      = "AIzaSyARbvYIFIRMZsHjk4E6UoWN7FKmAagO0yU"; // from firebaseConfig in index.html
const char* DEVICE_ID        = "esp32-1"; // label for this device

// ========= CONSTANTS =========
const char* RTDB_URL = "https://esp32-garage-controller-default-rtdb.firebaseio.com"; // no trailing slash

// GPIOs
const int LED_PIN   = 2;   // ESP32 onboard LED
const int DOOR1_PIN = 18;  // garage door trigger 1 (active LOW)
const int DOOR2_PIN = 33;  // garage door trigger 2 (active LOW)

// Polling
unsigned long lastPollMs = 0;
const unsigned long POLL_MS = 500;

// Pulse state
bool isPulsing = false;
int  pulseCount = 0;
unsigned long pulseTimer = 0;
const int PULSE_INTERVAL_MS = 300; // toggle every 300ms → 3 blinks (6 toggles)

// Edge-trigger memory
String lastDoorCmd = "none";
String lastLedCmd  = "init";

// Auth state
String g_idToken;
String g_refreshToken;
unsigned long g_tokenExpiryMs = 0;

// ===== Utilities =====
bool waitForTime(unsigned long timeoutMs = 10000) {
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  unsigned long start = millis();
  time_t now;
  while (millis() - start < timeoutMs) {
    time(&now);
    if (now > 1700000000) return true; // ~2023+
    delay(200);
  }
  return false;
}

bool httpsPOSTJson(WiFiClientSecure& client, const String& url, const String& body, const String* hName, const String* hVal, String& out) {
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  if (hName && hVal) http.addHeader(*hName, *hVal);
  int code = http.POST(body);
  if (code > 0) out = http.getString();
  else Serial.printf("HTTP POST failed: %s\n", http.errorToString(code).c_str());
  http.end();
  return code >= 200 && code < 300;
}

bool httpsPOSTForm(WiFiClientSecure& client, const String& url, const String& form, String& out) {
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");
  int code = http.POST(form);
  if (code > 0) out = http.getString();
  else Serial.printf("HTTP POST failed: %s\n", http.errorToString(code).c_str());
  http.end();
  return code >= 200 && code < 300;
}

bool httpsGET(WiFiClientSecure& client, const String& url, String& out) {
  HTTPClient http;
  http.begin(client, url);
  int code = http.GET();
  if (code > 0) out = http.getString();
  else Serial.printf("HTTP GET failed: %s\n", http.errorToString(code).c_str());
  http.end();
  return code >= 200 && code < 300;
}

bool httpsPATCHJson(WiFiClientSecure& client, const String& url, const String& body, String* out = nullptr) {
  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  int code = http.PATCH(body);
  if (out && code > 0) *out = http.getString();
  else if (code <= 0) Serial.printf("HTTP PATCH failed: %s\n", http.errorToString(code).c_str());
  http.end();
  return code >= 200 && code < 300;
}

// ===== Auth flow =====
bool getCustomToken(String& customToken) {
  WiFiClientSecure client; 
  client.setInsecure(); // TODO: install real CA certs for prod

  // Send deviceId via query string to avoid server body parsing issues
  String url = String(TOKEN_SERVER_URL) + "?deviceId=" + DEVICE_ID;

  HTTPClient http;
  http.begin(client, url);
  http.addHeader("x-api-key", IOT_API_KEY);
  http.addHeader("Content-Type", "application/json");

  // Empty JSON body is fine since deviceId is in the query string
  int code = http.POST("{}");
  String payload = http.getString();
  http.end();

  Serial.printf("iot-token HTTP %d\n", code);
  if (payload.length()) {
    Serial.println("iot-token resp:");
    Serial.println(payload);
  }
  if (code < 200 || code >= 300) {
    Serial.println("Custom token request failed");
    return false;
  }

  DynamicJsonDocument resp(2048);
  DeserializationError err = deserializeJson(resp, payload);
  if (err) {
    Serial.println("Failed to parse custom token response");
    Serial.println(payload);
    return false;
  }
  customToken = resp["customToken"] | "";
  Serial.printf("customToken len = %d\n", customToken.length());

  return customToken.length() > 0;
}

bool exchangeCustomForIdToken(const String& customToken) {
  WiFiClientSecure client; 
  client.setInsecure(); // TODO: use real CA in prod

  String url = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=" + String(WEB_API_KEY);

  // Build JSON manually to avoid ArduinoJson buffer limits
  String body = "{\"token\":\"" + customToken + "\",\"returnSecureToken\":true}";

  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000);

  int code = http.POST(body);
  String resp = http.getString();
  http.end();

  Serial.printf("signInWithCustomToken HTTP %d\n", code);
  Serial.printf("body len=%d, token len=%d\n", body.length(), customToken.length());
  if (resp.length()) {
    Serial.println("signInWithCustomToken resp:");
    Serial.println(resp);
  }

  if (code < 200 || code >= 300) return false;

  DynamicJsonDocument json(4096);
  if (deserializeJson(json, resp)) return false;

  g_idToken      = json["idToken"].as<String>();
  g_refreshToken = json["refreshToken"].as<String>();
  int expiresIn  = atoi(json["expiresIn"] | "3600");
  g_tokenExpiryMs = millis() + (unsigned long)(max(0, expiresIn - 60)) * 1000UL;

  Serial.println("ID token obtained.");
  return g_idToken.length() > 0;
}

bool refreshIdToken() {
  if (g_refreshToken.isEmpty()) return false;
  WiFiClientSecure client; client.setInsecure();
  String url = "https://securetoken.googleapis.com/v1/token?key=" + String(WEB_API_KEY);
  String form = "grant_type=refresh_token&refresh_token=" + g_refreshToken;

  String out;
  if (!httpsPOSTForm(client, url, form, out)) {
    Serial.println("Refresh token request failed");
    return false;
  }

  DynamicJsonDocument resp(2048);
  if (deserializeJson(resp, out)) {
    Serial.println("Refresh parse failed");
    Serial.println(out);
    return false;
  }

  g_idToken      = resp["id_token"].as<String>();
  g_refreshToken = resp["refresh_token"].as<String>();
  int expiresIn  = atoi(resp["expires_in"] | "3600");
  g_tokenExpiryMs = millis() + (unsigned long)(max(0, expiresIn - 60)) * 1000UL;

  Serial.println("ID token refreshed.");
  return g_idToken.length() > 0;
}

bool ensureIdToken() {
  if (g_idToken.length() > 0 && (long)(g_tokenExpiryMs - millis()) > 0) return true;
  if (!g_refreshToken.isEmpty()) return refreshIdToken();
  String customToken;
  if (!getCustomToken(customToken)) return false;
  return exchangeCustomForIdToken(customToken);
}

// ===== App logic =====
void writeField(const char* key, const String& valueJson) {
  if (!ensureIdToken()) return;
  WiFiClientSecure client; client.setInsecure();
  String url = String(RTDB_URL) + "/" + key + ".json?auth=" + g_idToken;

  HTTPClient http;
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  http.PUT(valueJson);
  http.end();
}

void updateStatus(const String& s) { writeField("ledStatus", "\"" + s + "\""); }

void updateTimestamp() {
  if (!ensureIdToken()) return;
  time_t now = time(nullptr);
  char buf[32];
  snprintf(buf, sizeof(buf), "%lu", (unsigned long)now);
  writeField("lastUpdated", String(buf));
}

void triggerDoor(int pin) {
  digitalWrite(pin, LOW);   // active LOW pulse
  delay(300);
  digitalWrite(pin, HIGH);
  Serial.printf("Triggered door pin %d\n", pin);
}

void finishPulse() {
  isPulsing = false;
  digitalWrite(LED_PIN, LOW);
  updateStatus("off");
}

void setup() {
  Serial.begin(115200);
  Serial.printf("WEB_API_KEY len = %d\n", strlen(WEB_API_KEY));

  pinMode(LED_PIN, OUTPUT);
  pinMode(DOOR1_PIN, OUTPUT);
  pinMode(DOOR2_PIN, OUTPUT);
  digitalWrite(DOOR1_PIN, HIGH); // idle HIGH
  digitalWrite(DOOR2_PIN, HIGH);

  WiFiManager wm;
  if (!wm.autoConnect("ESP32-Setup", "esp32pass")) {
    Serial.println("WiFi failed. Rebooting...");
    delay(2000);
    ESP.restart();
  }
  Serial.print("WiFi OK. IP: "); Serial.println(WiFi.localIP());
  waitForTime(); // TLS sanity (still using setInsecure for now)
}

void loop() {
  unsigned long nowMs = millis();

  // Handle LED pulse
  if (isPulsing && nowMs - pulseTimer >= (unsigned long)PULSE_INTERVAL_MS) {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    pulseTimer = nowMs;
    pulseCount++;
    if (pulseCount >= 6) finishPulse(); // 3 full blinks
  }

  if (!isPulsing && nowMs - lastPollMs >= POLL_MS) {
    lastPollMs = nowMs;

    if (!ensureIdToken()) {
      Serial.println("Auth not ready; retrying…");
      return;
    }

    WiFiClientSecure client; client.setInsecure();
    String url = String(RTDB_URL) + "/.json?auth=" + g_idToken;

    HTTPClient http;
    if (!http.begin(client, url)) {
      Serial.println("[HTTP] begin() failed");
      return;
    }

    int code = http.GET();
    if (code == 200) {
      String payload = http.getString();
      DynamicJsonDocument doc(1024);
      if (!deserializeJson(doc, payload)) {

        String ledCmd  = doc["ledCommand"]  | "off";
        String doorCmd = doc["doorCommand"] | "none";

        // ---- LED: act only when it CHANGES ----
        if (ledCmd != lastLedCmd) {
          if (ledCmd == "on") {
            digitalWrite(LED_PIN, HIGH);
            updateStatus("on");
          } else if (ledCmd == "off") {
            digitalWrite(LED_PIN, LOW);
            updateStatus("off");
          } else if (ledCmd == "pulse") {
            isPulsing = true; pulseCount = 0; pulseTimer = nowMs;
            digitalWrite(LED_PIN, HIGH);
            updateStatus("pulsing");
          }
          lastLedCmd = ledCmd;
        }

        // ---- DOOR: fire once on CHANGE, then clear to "none" ----
        if (doorCmd != lastDoorCmd) {
          if (doorCmd == "door1")      triggerDoor(DOOR1_PIN);
          else if (doorCmd == "door2") triggerDoor(DOOR2_PIN);

          // ACK + clear (allowed by Step A rule)
          String patchUrl = String(RTDB_URL) + "/.json?auth=" + g_idToken;
          bool ok = httpsPATCHJson(client, patchUrl, "{\"doorCommand\":\"none\",\"ledReceived\":true}");
          if (ok) lastDoorCmd = "none";    // cleared successfully
          else    lastDoorCmd = doorCmd;   // retry next loop if PATCH failed

          updateTimestamp();
        }

      } else {
        Serial.println("JSON parse error");
      }
    } else {
      Serial.printf("[HTTP] GET failed: %s\n", http.errorToString(code).c_str());
    }
    http.end();
  }
}
