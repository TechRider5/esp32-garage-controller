// api/iot-token.js
// POST /api/iot-token
// Headers: x-api-key: <IOT_API_KEY>
// Body: { "deviceId": "esp32-1" }
// Returns: { customToken: "<CUSTOM_TOKEN>" }

const admin = require("firebase-admin");

function initAdmin() {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var");

  // Handle escaped newlines in private_key
  const creds = JSON.parse(raw);
  if (typeof creds.private_key === "string") {
    creds.private_key = creds.private_key.replace(/\\n/g, "\n");
  }

  admin.initializeApp({
    credential: admin.credential.cert(creds),
    databaseURL: "https://esp32-garage-controller-default-rtdb.firebaseio.com"
  });
}
initAdmin();

module.exports = async (req, res) => {
  // CORS (optional)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.IOT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { deviceId } = req.body || {};
    if (!deviceId || typeof deviceId !== "string") {
      return res.status(400).json({ error: "Missing deviceId" });
    }

    const uid = `device:${deviceId}`;
    const claims = { role: "device", deviceId };
    const customToken = await admin.auth().createCustomToken(uid, claims);
    return res.status(200).json({ customToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
