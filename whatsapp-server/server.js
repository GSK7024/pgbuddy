require("dotenv").config();
const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { createClient } = require("@supabase/supabase-js");

// ── Config ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const SERVER_SECRET = process.env.SERVER_SECRET || "pg_buddy_whatsapp_secret_2024";
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── WhatsApp Client ──────────────────────────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./whatsapp_session" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
    ],
  },
});

let isReady = false;

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with your WhatsApp:\n");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  isReady = true;
  console.log("✅ WhatsApp Client is READY! Session saved.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ AUTH FAILURE:", msg);
  isReady = false;
});

client.on("disconnected", (reason) => {
  isReady = false;
  console.error("🚨 CRITICAL: WhatsApp disconnected!", reason);
  console.error("🚨 Please restart the server and re-scan the QR code.");
});

client.initialize();

// ── OTP Rate Limiter (in-memory, 60s per number) ────────────────────────────
const otpRateLimiter = new Map(); // phone -> timestamp

function isRateLimited(phone) {
  const last = otpRateLimiter.get(phone);
  if (!last) return false;
  return Date.now() - last < 5 * 1000; // 5 seconds
}

function setRateLimit(phone) {
  otpRateLimiter.set(phone, Date.now());
}

// ── Helper: format phone for WhatsApp ───────────────────────────────────────
function formatPhone(phone) {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");
  // Ensure Indian number with country code
  const tenDigit = digits.slice(-10);
  return `91${tenDigit}@c.us`;
}

// ── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Simple secret-based auth middleware
function authenticate(req, res, next) {
  const secret = req.headers["x-server-secret"] || req.body?.secret;
  if (secret !== SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ 
    status: isReady ? "ready" : "not_ready",
    message: isReady ? "WhatsApp is connected" : "WhatsApp is not connected yet"
  });
});

// ── TRACK 1: Fast Lane — Instant OTP ─────────────────────────────────────────
app.post("/api/send-otp", authenticate, async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "phoneNumber and otp are required" });
  }

  if (!isReady) {
    return res.status(503).json({ error: "WhatsApp client not ready yet" });
  }

  // Rate limiting
  if (isRateLimited(phoneNumber)) {
    return res.status(429).json({ error: "Rate limited. Wait 5 seconds before requesting another OTP." });
  }

  try {
    const formattedPhone = formatPhone(phoneNumber);

    // Check if number exists on WhatsApp
    const isRegistered = await client.isRegisteredUser(formattedPhone);
    if (!isRegistered) {
      return res.status(404).json({ error: "Phone number is not registered on WhatsApp" });
    }

    const message = `🔐 *PG Buddy Login Code*\n\nYour one-time password is: *${otp}*\n\nDo not share this with anyone. Valid for 10 minutes.\n\n_PG Buddy App_`;

    await client.sendMessage(formattedPhone, message);
    setRateLimit(phoneNumber);

    console.log(`✅ OTP sent to ${phoneNumber}`);
    return res.json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error(`❌ Failed to send OTP to ${phoneNumber}:`, err.message);
    return res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});

// ── TRACK 1.5: Instant Message — Single Non-OTP Messages (Complaints, Alerts) ─
app.post("/api/send-instant", authenticate, async (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "phoneNumber and message are required" });
  }

  if (!isReady) {
    return res.status(503).json({ error: "WhatsApp client not ready yet" });
  }

  try {
    const formattedPhone = formatPhone(phoneNumber);

    // Check if number exists on WhatsApp
    const isRegistered = await client.isRegisteredUser(formattedPhone);
    if (!isRegistered) {
      return res.status(404).json({ error: "Phone number is not registered on WhatsApp" });
    }

    await client.sendMessage(formattedPhone, message);
    console.log(`✅ Instant message sent to ${phoneNumber}`);
    return res.json({ success: true, message: "Message sent instantly" });

  } catch (err) {
    console.error(`❌ Failed to send instant message to ${phoneNumber}:`, err.message);
    return res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});

// ── TRACK 2: Bulletproof Queue — Bulk Messages ───────────────────────────────
app.post("/api/bulk-message", authenticate, async (req, res) => {
  const { phoneNumbers, message, templateType } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return res.status(400).json({ error: "phoneNumbers array is required" });
  }

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  // Insert all messages into queue
  const rows = phoneNumbers.map((phone) => ({
    phone_number: phone,
    message: message,
    template_type: templateType || "announcement",
    status: "pending",
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("whatsapp_message_queue")
    .insert(rows);

  if (error) {
    console.error("❌ Failed to queue messages:", error);
    return res.status(500).json({ error: "Failed to queue messages", detail: error.message });
  }

  console.log(`📋 Queued ${phoneNumbers.length} messages for bulk send`);
  return res.json({ 
    success: true, 
    queued: phoneNumbers.length,
    message: `${phoneNumbers.length} messages queued. Will be sent ~1 per 45 seconds.`
  });
});

// ── Background Worker: Process Queue ─────────────────────────────────────────
async function processQueue() {
  if (!isReady) {
    console.log("⏳ Worker: WhatsApp not ready, skipping cycle...");
    return;
  }

  try {
    // Pick ONE pending message
    const { data: rows, error } = await supabase
      .from("whatsapp_message_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      console.error("❌ Worker: DB query failed:", error.message);
      return;
    }

    if (!rows || rows.length === 0) return; // Nothing to send

    const row = rows[0];
    const formattedPhone = formatPhone(row.phone_number);

    try {
      // Check if number is on WhatsApp
      const isRegistered = await client.isRegisteredUser(formattedPhone);
      if (!isRegistered) {
        await supabase
          .from("whatsapp_message_queue")
          .update({ status: "failed", error: "not_on_whatsapp", sent_at: new Date().toISOString() })
          .eq("id", row.id);
        console.log(`⚠️ Worker: ${row.phone_number} is not on WhatsApp, marked as failed.`);
        return;
      }

      await client.sendMessage(formattedPhone, row.message);

      // Mark as sent
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);

      console.log(`✅ Worker: Sent bulk message to ${row.phone_number}`);

    } catch (sendErr) {
      // Mark as failed
      await supabase
        .from("whatsapp_message_queue")
        .update({ status: "failed", error: sendErr.message, sent_at: new Date().toISOString() })
        .eq("id", row.id);
      console.error(`❌ Worker: Failed to send to ${row.phone_number}:`, sendErr.message);
    }

  } catch (workerErr) {
    console.error("❌ Worker crashed:", workerErr.message);
  }
}

// Run worker every 45 seconds
setInterval(processQueue, 45 * 1000);
console.log("🔁 Bulk message worker started (every 45 seconds)");

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PG Buddy WhatsApp Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});
