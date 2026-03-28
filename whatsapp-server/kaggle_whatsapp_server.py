"""
🚀 PG Buddy WhatsApp Server — Kaggle Edition
==============================================
Paste this entire script into a Kaggle notebook cell and run it.
It will:
1. Install Node.js 18 + npm packages
2. Install Cloudflared tunnel (free, no account)
3. Start the WhatsApp server
4. Display QR code for scanning
5. Print the public tunnel URL to set in Supabase
6. Keep running for up to 12 hours

INSTRUCTIONS:
- Create a new Kaggle Notebook (Python, no GPU needed — use CPU)
- Turn ON "Internet" in sidebar settings
- Paste this into a cell and Run
- Scan the QR code with WhatsApp when it appears
- Copy the tunnel URL and set it in Supabase secrets
"""

import subprocess
import os
import time
import threading
import json
import re

# ── CONFIG (edit these) ──────────────────────────────────────────────────────
SUPABASE_URL = "https://vcpohetbsyyjqqkzuzxj.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcG9oZXRic3l5anFxa3p1enhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzcxNzk0NSwiZXhwIjoyMDg5MjkzOTQ1fQ.p96BgDmdWhjuP4U_6KFPwYjnUBgAiOe88nKtia3hIoA"
SERVER_SECRET = "pg_buddy_whatsapp_secret_2024"
PORT = 3001

# ── STEP 1: Install Node.js 18 ──────────────────────────────────────────────
print("=" * 60)
print("📦 STEP 1: Installing Node.js 18...")
print("=" * 60)

subprocess.run([
    "bash", "-c",
    "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
], check=True)

# Verify
result = subprocess.run(["node", "--version"], capture_output=True, text=True)
print(f"✅ Node.js installed: {result.stdout.strip()}")
result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
print(f"✅ npm installed: {result.stdout.strip()}")

# ── STEP 2: Install Google Chrome for Puppeteer ─────────────────────────────
print("\n" + "=" * 60)
print("🌐 STEP 2: Installing Google Chrome...")
print("=" * 60)

# Check if any browser already exists
import shutil
BROWSER_PATH = None
for path in ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/usr/bin/chromium-browser", "/usr/bin/chromium"]:
    if os.path.exists(path):
        BROWSER_PATH = path
        break

if not BROWSER_PATH:
    # Install Google Chrome (fast, single deb ~90MB)
    subprocess.run([
        "bash", "-c",
        "wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && "
        "sudo apt-get install -y ./google-chrome-stable_current_amd64.deb 2>/dev/null || "
        "sudo dpkg -i google-chrome-stable_current_amd64.deb 2>/dev/null; "
        "sudo apt-get install -f -y 2>/dev/null"
    ], check=False)
    # Find it again
    for path in ["/usr/bin/google-chrome-stable", "/usr/bin/google-chrome", "/opt/google/chrome/google-chrome"]:
        if os.path.exists(path):
            BROWSER_PATH = path
            break

if BROWSER_PATH:
    print(f"✅ Browser found: {BROWSER_PATH}")
else:
    print("❌ No browser found! WhatsApp client will fail.")
    BROWSER_PATH = "/usr/bin/google-chrome-stable"  # fallback, hope for the best

# ── STEP 3: Install Cloudflared ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("🔗 STEP 3: Installing Cloudflared tunnel...")
print("=" * 60)

subprocess.run([
    "bash", "-c",
    "wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared-linux-amd64.deb"
], check=True)
print("✅ Cloudflared installed")

# ── STEP 4: Create the WhatsApp server ───────────────────────────────────────
print("\n" + "=" * 60)
print("📝 STEP 4: Setting up WhatsApp server...")
print("=" * 60)

SERVER_DIR = "/kaggle/working/wa-server"
os.makedirs(SERVER_DIR, exist_ok=True)

# package.json
with open(f"{SERVER_DIR}/package.json", "w") as f:
    json.dump({
        "name": "pg-buddy-wa-kaggle",
        "version": "1.0.0",
        "dependencies": {
            "express": "^4.18.2",
            "whatsapp-web.js": "^1.26.1-alpha.3",
            "qrcode-terminal": "^0.12.0",
            "puppeteer-core": "^21.0.0",
            "@supabase/supabase-js": "^2.39.0"
        }
    }, f, indent=2)

# server.js (Kaggle-optimized version)
SERVER_CODE = r'''
const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 3001;
const SERVER_SECRET = process.env.SERVER_SECRET || "pg_buddy_whatsapp_secret_2024";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Puppeteer path — auto-detected by Python script
const CHROMIUM_PATH = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable";

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./whatsapp_session" }),
  puppeteer: {
    headless: true,
    executablePath: CHROMIUM_PATH,
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
  console.log("\n📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:\n");
  qrcode.generate(qr, { small: true });
  console.log("\n⏳ Waiting for you to scan...\n");
});

client.on("ready", () => {
  isReady = true;
  console.log("✅ WhatsApp Client is READY! Session active.");
});

client.on("auth_failure", (msg) => {
  console.error("❌ AUTH FAILURE:", msg);
  isReady = false;
});

client.on("disconnected", (reason) => {
  isReady = false;
  console.error("🚨 WhatsApp disconnected:", reason);
});

client.initialize();

// Format phone for WhatsApp
function formatPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  const tenDigit = digits.slice(-10);
  return `91${tenDigit}@c.us`;
}

// Rate limiter
const otpRateLimiter = new Map();
function isRateLimited(phone) {
  const last = otpRateLimiter.get(phone);
  if (!last) return false;
  return Date.now() - last < 5000;
}
function setRateLimit(phone) {
  otpRateLimiter.set(phone, Date.now());
}

// Auth middleware
function authenticate(req, res, next) {
  const secret = req.headers["x-server-secret"] || req.body?.secret;
  if (secret !== SERVER_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const app = express();
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: isReady ? "ready" : "not_ready",
    uptime: process.uptime(),
    message: isReady ? "WhatsApp connected" : "Waiting for QR scan"
  });
});

// OTP endpoint
app.post("/api/send-otp", authenticate, async (req, res) => {
  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) return res.status(400).json({ error: "phoneNumber and otp required" });
  if (!isReady) return res.status(503).json({ error: "WhatsApp not ready" });
  if (isRateLimited(phoneNumber)) return res.status(429).json({ error: "Rate limited" });

  try {
    const formattedPhone = formatPhone(phoneNumber);
    const isRegistered = await client.isRegisteredUser(formattedPhone);
    if (!isRegistered) return res.status(404).json({ error: "Not on WhatsApp" });

    const message = `🔐 *PG Buddy Login Code*\n\nYour one-time password is: *${otp}*\n\nDo not share this with anyone. Valid for 10 minutes.\n\n_PG Buddy App_`;
    await client.sendMessage(formattedPhone, message);
    setRateLimit(phoneNumber);
    console.log(`✅ OTP sent to ${phoneNumber}`);
    return res.json({ success: true });
  } catch (err) {
    console.error(`❌ OTP failed for ${phoneNumber}:`, err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Bulk message endpoint
app.post("/api/bulk-message", authenticate, async (req, res) => {
  const { phoneNumbers, message, templateType } = req.body;
  if (!phoneNumbers?.length || !message) return res.status(400).json({ error: "Missing data" });

  const rows = phoneNumbers.map((phone) => ({
    phone_number: phone,
    message: message,
    template_type: templateType || "announcement",
    status: "pending",
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("whatsapp_message_queue").insert(rows);
  if (error) return res.status(500).json({ error: error.message });

  console.log(`📋 Queued ${phoneNumbers.length} bulk messages`);
  return res.json({ success: true, queued: phoneNumbers.length });
});

// Background worker for bulk messages
async function processQueue() {
  if (!isReady) return;
  try {
    const { data: rows, error } = await supabase
      .from("whatsapp_message_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error || !rows?.length) return;
    const row = rows[0];
    const formattedPhone = formatPhone(row.phone_number);

    try {
      const isRegistered = await client.isRegisteredUser(formattedPhone);
      if (!isRegistered) {
        await supabase.from("whatsapp_message_queue").update({ status: "failed", error: "not_on_whatsapp" }).eq("id", row.id);
        return;
      }
      await client.sendMessage(formattedPhone, row.message);
      await supabase.from("whatsapp_message_queue").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id);
      console.log(`✅ Bulk: sent to ${row.phone_number}`);
    } catch (e) {
      await supabase.from("whatsapp_message_queue").update({ status: "failed", error: e.message }).eq("id", row.id);
    }
  } catch (e) {
    console.error("Worker error:", e.message);
  }
}

setInterval(processQueue, 45000);

// Keep-alive heartbeat (prevents Kaggle timeout)
setInterval(() => {
  console.log(`💓 Heartbeat — ${new Date().toLocaleString()} — WA: ${isReady ? "CONNECTED" : "DISCONNECTED"}`);
}, 300000); // Every 5 minutes

app.listen(PORT, () => {
  console.log(`🚀 PG Buddy WhatsApp Server on port ${PORT}`);
});
'''

with open(f"{SERVER_DIR}/server.js", "w") as f:
    f.write(SERVER_CODE)

# Install npm packages (PUPPETEER_SKIP_DOWNLOAD prevents re-downloading Chromium)
print("📦 Installing npm packages (~1 minute, no Chromium download)...")
npm_env = os.environ.copy()
npm_env["PUPPETEER_SKIP_DOWNLOAD"] = "true"
npm_env["PUPPETEER_SKIP_CHROMIUM_DOWNLOAD"] = "true"
subprocess.run(["npm", "install"], cwd=SERVER_DIR, env=npm_env, check=True)
print("✅ npm packages installed")

# ── STEP 5: Create .env file ────────────────────────────────────────────────
with open(f"{SERVER_DIR}/.env", "w") as f:
    f.write(f"SUPABASE_URL={SUPABASE_URL}\n")
    f.write(f"SUPABASE_SERVICE_ROLE_KEY={SUPABASE_SERVICE_ROLE_KEY}\n")
    f.write(f"PORT={PORT}\n")
    f.write(f"SERVER_SECRET={SERVER_SECRET}\n")

# ── STEP 6: Start server + tunnel ────────────────────────────────────────────
print("\n" + "=" * 60)
print("🚀 STEP 5: Starting WhatsApp Server + Cloudflare Tunnel...")
print("=" * 60)

# Set env vars for the server process
env = os.environ.copy()
env["SUPABASE_URL"] = SUPABASE_URL
env["SUPABASE_SERVICE_ROLE_KEY"] = SUPABASE_SERVICE_ROLE_KEY
env["PORT"] = str(PORT)
env["SERVER_SECRET"] = SERVER_SECRET
env["PUPPETEER_EXECUTABLE_PATH"] = BROWSER_PATH

# Start Node server in background
server_proc = subprocess.Popen(
    ["node", "server.js"],
    cwd=SERVER_DIR,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    bufsize=1,
    universal_newlines=True
)

# Give server a moment to start
time.sleep(3)

# Start Cloudflared tunnel
tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", f"http://localhost:{PORT}"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    bufsize=1,
    universal_newlines=True
)

# ── Auto-update Supabase Edge Function secrets ──
SUPABASE_PROJECT_REF = "vcpohetbsyyjqqkzuzxj"

def print_supabase_update_command(tunnel_url_val):
    """Print the command to update Supabase secrets."""
    print(f"\n📋 Run this on your laptop (from PG_buddy folder):")
    print(f'\n   npx supabase secrets set WA_SERVER_URL="{tunnel_url_val}" WA_SERVER_SECRET="{SERVER_SECRET}"')
    print(f"\n   OR set it in Supabase Dashboard -> Edge Functions -> Secrets")

# Background thread to capture tunnel URL
tunnel_url = [None]

def capture_tunnel_output():
    for line in tunnel_proc.stdout:
        line = line.strip()
        # Look for the tunnel URL
        match = re.search(r"(https://[a-zA-Z0-9\-]+\.trycloudflare\.com)", line)
        if match:
            tunnel_url[0] = match.group(1)
            print("\n" + "🌟" * 30)
            print(f"\n🔗 YOUR TUNNEL URL: {tunnel_url[0]}")
            print_supabase_update_command(tunnel_url[0])
            print("\n" + "🌟" * 30 + "\n")

tunnel_thread = threading.Thread(target=capture_tunnel_output, daemon=True)
tunnel_thread.start()

# ── STEP 7: Stream server output (keeps cell alive) ─────────────────────────
print("\n" + "=" * 60)
print("📺 WhatsApp Server Output (scan QR code below!):")
print("=" * 60 + "\n")

try:
    for line in server_proc.stdout:
        print(line, end="", flush=True)
except KeyboardInterrupt:
    print("\n\n🛑 Server stopped by user")
    server_proc.terminate()
    tunnel_proc.terminate()
