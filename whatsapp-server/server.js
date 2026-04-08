require("dotenv").config();
const express = require("express");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
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
  webVersionCache: {
    type: "remote",
    remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-js/main/dist/wppconnect-wa.js",
  },
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--no-first-run",
      "--no-zygote",
      "--disable-features=IsolateOrigins,site-per-process"
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
  startWorkers(); // Start polling Supabase
});

client.on("auth_failure", (msg) => {
  console.error("❌ AUTH FAILURE:", msg);
  isReady = false;
});

client.on("disconnected", (reason) => {
  isReady = false;
  console.error("🚨 CRITICAL: WhatsApp disconnected!", reason);
});

client.initialize();

// ── OTP Rate Limiter ────────────────────────────────────────────────────────
const otpRateLimiter = new Map();
const campaignPhones = new Set();

function isRateLimited(phone) {
  const last = otpRateLimiter.get(phone);
  if (!last) return false;
  return Date.now() - last < 5 * 1000; // 5 seconds
}

function setRateLimit(phone) {
  otpRateLimiter.set(phone, Date.now());
}

function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  const tenDigit = digits.slice(-10);
  return `91${tenDigit}@c.us`;
}

// ── Express App ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

function authenticate(req, res, next) {
  const secret = req.headers["x-server-secret"] || 
                 req.body?.secret || 
                 req.headers["authorization"]?.replace("Bearer ", "");

  if (secret !== SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/health", (req, res) => {
  res.json({ 
    status: isReady ? "ready" : "not_ready",
    message: isReady ? "WhatsApp is connected" : "WhatsApp is not connected yet"
  });
});

app.post("/api/send-otp", authenticate, async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "phoneNumber and otp are required" });
  }

  if (!isReady) {
    return res.status(503).json({ error: "WhatsApp client not ready yet" });
  }

  if (isRateLimited(phoneNumber)) {
    return res.status(429).json({ error: "Rate limited. Wait 5 seconds." });
  }

  try {
    const formattedPhone = formatPhone(phoneNumber);

    const isRegistered = await client.isRegisteredUser(formattedPhone);
    if (!isRegistered) {
      return res.status(404).json({ error: "Phone number is not registered on WhatsApp" });
    }

    const brandName = process.env.BRAND_NAME || "PG Buddy";
    const message = `🔐 *${brandName} Login Code*\n\nYour one-time password is: *${otp}*\n\nDo not share this with anyone. Valid for 10 minutes.\n\n_${brandName} App_`;

    await client.sendMessage(formattedPhone, message);
    setRateLimit(phoneNumber);

    console.log(`✅ OTP sent to ${phoneNumber}`);
    return res.json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
    console.error(`❌ Failed to send OTP to ${phoneNumber}:`, err.message);
    return res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});

app.post("/api/send-instant", authenticate, async (req, res) => {
  const { phoneNumber, message, isCampaign, imagePath, imagePaths } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: "phoneNumber and message are required" });
  }

  if (!isReady) {
    return res.status(503).json({ error: "WhatsApp client not ready yet" });
  }

  try {
    const formattedPhone = formatPhone(phoneNumber);
    const isRegistered = await client.isRegisteredUser(formattedPhone);
    if (!isRegistered) {
      return res.status(404).json({ error: "Phone number is not registered on WhatsApp" });
    }

    const fs = require("fs");

    // Handle multiple images
    if (imagePaths && Array.isArray(imagePaths)) {
      // 1. Send all images first
      for (const path of imagePaths) {
        if (fs.existsSync(path)) {
          const media = MessageMedia.fromFilePath(path);
          await client.sendMessage(formattedPhone, media);
          await new Promise(r => setTimeout(r, 500)); // Quick delay
        }
      }
      // 2. Send the message text separately afterward
      await client.sendMessage(formattedPhone, message);
    } 
    // Handle single video
    else if (req.body.videoPath && fs.existsSync(req.body.videoPath)) {
      const media = MessageMedia.fromFilePath(req.body.videoPath);
      await client.sendMessage(formattedPhone, media, { caption: message });
    }
    // Handle single image
    else if (imagePath && fs.existsSync(imagePath)) {
      const media = MessageMedia.fromFilePath(imagePath);
      await client.sendMessage(formattedPhone, media, { caption: message });
    } 
    // Handle text only
    else {
      await client.sendMessage(formattedPhone, message);
    }

    if (isCampaign) {
      campaignPhones.add(phoneNumber.replace(/\D/g, "").slice(-10));
      console.log(`📨 Campaign: Pitch sent to ${phoneNumber} (via Worker)`);
    } else {
      console.log(`✅ Instant message sent to ${phoneNumber}`);
    }

    return res.json({ success: true, message: "Message sent" });

  } catch (err) {
    console.error(`❌ Failed to send message to ${phoneNumber}:`, err);
    return res.status(500).json({ error: "Failed to send message", detail: err.message });
  }
});

app.post("/api/bulk-message", authenticate, async (req, res) => {
  const { phoneNumbers, message, templateType } = req.body;

  if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    return res.status(400).json({ error: "phoneNumbers array is required" });
  }

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const rows = phoneNumbers.map((phone) => ({
    phone_number: phone,
    message: message,
    template_type: templateType || "announcement",
    status: "pending",
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("whatsapp_message_queue").insert(rows);

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

app.listen(PORT, () => {
  console.log(`🚀 PG Buddy WhatsApp Server running on port ${PORT}`);
});

// ── Background Workers ───────────────────────────────────────────────────────
async function processQueue() {
  if (!isReady) return;

  try {
    const { data: rows, error } = await supabase
      .from("whatsapp_message_queue")
      .select("*")
      .eq("status", "pending")
      .neq("template_type", "b2b_pitch") // Avoid b2b pitches
      .order("created_at", { ascending: true })
      .limit(1);

    if (error || !rows?.length) return;

    const row = rows[0];
    const formattedPhone = formatPhone(row.phone_number);

    try {
      const isRegistered = await client.isRegisteredUser(formattedPhone);
      if (!isRegistered) {
        await supabase.from("whatsapp_message_queue")
          .update({ status: "failed", error: "not_on_whatsapp", sent_at: new Date().toISOString() })
          .eq("id", row.id);
        console.log(`⚠️ Worker: ${row.phone_number} not on WhatsApp`);
        return;
      }

      await client.sendMessage(formattedPhone, row.message);
      await supabase.from("whatsapp_message_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      console.log(`✅ Worker: Sent to ${row.phone_number}`);

    } catch (sendErr) {
      await supabase.from("whatsapp_message_queue")
        .update({ status: "failed", error: sendErr.message, sent_at: new Date().toISOString() })
        .eq("id", row.id);
      console.error(`❌ Worker: Failed ${row.phone_number}:`, sendErr.message);
    }
  } catch (e) {
    console.error("❌ Worker error:", e.message);
  }
}

function startWorkers() {
  setInterval(processQueue, 30 * 1000); // Check normal queue (rent reminders) every 30s
  // setInterval(processMarketingQueue, 90 * 1000); // Send marketing pitch every 90s -> DISABLED FOR OTP SAFETY
  
  console.log("🔁 Background worker started (Rent Reminders & App Notifications).");
  console.log("🛑 Marketing Campaign Worker is DISABLED (OTP Safemode).");
}

async function processMarketingQueue() {
  if (!isReady) return;

  try {
    const { data: rows, error } = await supabase
      .from("whatsapp_message_queue")
      .select("*")
      .eq("status", "pending")
      .eq("template_type", "b2b_pitch") // ONLY b2b pitches
      .order("created_at", { ascending: true })
      .limit(1);

    if (error || !rows?.length) return;

    const row = rows[0];
    const formattedPhone = formatPhone(row.phone_number);

    try {
      const isRegistered = await client.isRegisteredUser(formattedPhone);
      if (!isRegistered) {
        await supabase.from("whatsapp_message_queue")
          .update({ status: "failed", error: "not_on_whatsapp", sent_at: new Date().toISOString() })
          .eq("id", row.id);
        console.log(`⚠️ Marketing: ${row.phone_number} not on WhatsApp`);
        return;
      }

      await client.sendMessage(formattedPhone, row.message);
      await supabase.from("whatsapp_message_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", row.id);
      console.log(`✅ Marketing: Pitch sent to ${row.phone_number}`);

    } catch (sendErr) {
      await supabase.from("whatsapp_message_queue")
        .update({ status: "failed", error: sendErr.message, sent_at: new Date().toISOString() })
        .eq("id", row.id);
      console.error(`❌ Marketing: Failed ${row.phone_number}:`, sendErr.message);
    }
  } catch (e) {
    console.error("❌ Marketing worker error:", e.message);
  }
}
