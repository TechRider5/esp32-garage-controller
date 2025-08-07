#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <WiFiManager.h>

const int ledPin = 2;
const int door1Pin = 33;
const int door2Pin = 18;

const char* baseURL = "https://esp32-garage-controller-default-rtdb.firebaseio.com/";

unsigned long lastCheck = 0;
unsigned long checkInterval = 250;

bool isPulsing = false;
int pulseCount = 0;
unsigned long pulseTimer = 0;
int pulseInterval = 300;
String lastCommand = "";

void updateStatus(const String& status);
void updateTimestamp();
void finishPulse();
void triggerDoor(int pin);

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(door1Pin, OUTPUT);
  pinMode(door2Pin, OUTPUT);
  digitalWrite(door1Pin, HIGH);
  digitalWrite(door2Pin, HIGH);

  // Blink LED while connecting to Wi-Fi
  WiFiManager wm;
  int blinkCount = 0;
  while (!wm.autoConnect("ESP32-Setup", "esp32pass")) {
    digitalWrite(ledPin, blinkCount % 2 == 0 ? HIGH : LOW);
    delay(300);
    blinkCount++;
    if (blinkCount > 20) {
      Serial.println("WiFi connect failed. Restarting...");
      ESP.restart();
    }
  }

  digitalWrite(ledPin, HIGH); // Solid when connected
  Serial.println("WiFi connected to: " + WiFi.SSID());
  configTime(0, 0, "pool.ntp.org");
}

void loop() {
  Serial.println("loop running"); // DEBUG

  unsigned long now = millis();

  if (isPulsing && now - pulseTimer >= pulseInterval) {
    digitalWrite(ledPin, !digitalRead(ledPin));
    pulseTimer = now;
    pulseCount++;
    if (pulseCount >= 6) finishPulse();
  }

  if (!isPulsing && now - lastCheck >= checkInterval) {
    lastCheck = now;

    HTTPClient http;
    http.begin(String(baseURL) + ".json");
    int code = http.GET();

    if (code == 200) {
      String payload = http.getString();
      DynamicJsonDocument doc(1024);
      DeserializationError err = deserializeJson(doc, payload);
      if (err) {
        Serial.println("Failed to parse JSON");
        http.end();
        return;
      }

      String command = doc["ledCommand"] | "off";
      String doorCommand = doc["doorCommand"] | "none";
      bool received = doc["ledReceived"] | false;

      Serial.print("Command: "); Serial.println(command);
      Serial.print("Firebase doorCommand: "); Serial.println(doorCommand); // DEBUG

      if (!received || command != lastCommand || doorCommand != "none") {

        if (command == "on") {
          digitalWrite(ledPin, HIGH);
          updateStatus("on");
        } else if (command == "off") {
          digitalWrite(ledPin, LOW);
          updateStatus("off");
        } else if (command == "pulse") {
          pulseCount = 0;
          isPulsing = true;
          pulseTimer = now;
          digitalWrite(ledPin, HIGH);
        }

        if (doorCommand == "door1") {
          triggerDoor(door1Pin);
        } else if (doorCommand == "door2") {
          triggerDoor(door2Pin);
        }

        lastCommand = command;

        HTTPClient patch;
        patch.begin(String(baseURL) + ".json");
        patch.addHeader("Content-Type", "application/json");
        patch.PATCH("{\"ledReceived\":true, \"doorCommand\":\"none\"}");
        patch.end();

        updateTimestamp();
      }
    }
    http.end();
  }
}

void updateStatus(const String& state) {
  HTTPClient http;
  http.begin(String(baseURL) + "ledStatus.json");
  http.addHeader("Content-Type", "application/json");
  http.PUT("\"" + state + "\"");
  http.end();
}

void updateTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) return;

  char buffer[64];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);

  HTTPClient http;
  http.begin(String(baseURL) + "lastUpdated.json");
  http.addHeader("Content-Type", "application/json");
  http.PUT("\"" + String(buffer) + "\"");
  http.end();
}

void finishPulse() {
  isPulsing = false;
  digitalWrite(ledPin, LOW);
  updateStatus("off");
}

void triggerDoor(int pin) {
  digitalWrite(pin, LOW);
  delay(300);
  digitalWrite(pin, HIGH);
  Serial.print("Triggered pin: ");
  Serial.println(pin);
}
