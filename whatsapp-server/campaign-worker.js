/**
 * 📨 PG Buddy — Campaign Worker
 * Runs in a separate terminal to handle the 3rd-minute drip marketing outreach.
 * Communicates with the Master Server to send messages.
 */

const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
require("dotenv").config();

// ── Config ──
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MASTER_SERVER_URL = `http://localhost:${process.env.PORT || 3001}`;
const SERVER_SECRET = process.env.SERVER_SECRET || "pg_buddy_whatsapp_secret_2024";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CAMPAIGN_INTERVAL = 3 * 60 * 1000; // 3 minutes

async function processCampaign() {
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Checking for pending pitches...`);

  try {
    // 1. Get the next pending pitch
    const { data: rows, error } = await supabase
      .from("whatsapp_message_queue")
      .select("*")
      .eq("status", "pending")
      .eq("template_type", "b2b_pitch")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      console.log("😴 No pending pitches found. Sleeping...");
      return;
    }

    const row = rows[0];
    const cleanPhone = row.phone_number.replace(/\D/g, "");

    console.log(`🚀 Sending pitch to ${row.phone_number} (${row.id})...`);

    // 2. Check for campaign media (detects images and videos)
    const fs = require("fs");
    const imagePaths = [];
    const videoPaths = [];
    const files = fs.readdirSync("./");
    
    files.forEach(file => {
      if (file.match(/^campaign.*\.(png|jpg|jpeg)$/i)) {
        imagePaths.push(`./${file}`);
      } else if (file.match(/^campaign.*\.(mp4|mov|avi|mkv)$/i)) {
        videoPaths.push(`./${file}`);
      }
    });

    // 3. Call the Master Server to send the message
    try {
      const payload = {
        phoneNumber: cleanPhone,
        message: row.message,
        isCampaign: true
      };
      
      // Prioritize Video if available
      if (videoPaths.length > 0) {
        payload.videoPath = videoPaths.sort()[0]; // Send the first video found
      } else if (imagePaths.length > 0) {
        payload.imagePaths = imagePaths.sort();
      }

      const resp = await axios.post(`${MASTER_SERVER_URL}/api/send-instant`, payload, {
        headers: {
          "Authorization": `Bearer ${SERVER_SECRET}`
        }
      });

      if (resp.data.success) {
        // 3. Update status in Supabase
        await supabase.from("whatsapp_message_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", row.id);
        
        console.log(`✅ Success: Message sent via Master Server.`);
        
        // 4. Check remaining
        const { count } = await supabase
          .from("whatsapp_message_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("template_type", "b2b_pitch");
        
        console.log(`📊 ${count || 0} campaign messages remaining.`);
      }

    } catch (apiErr) {
      const errorMsg = apiErr.response?.data?.error || apiErr.message;
      console.error(`❌ Master Server rejected send: ${errorMsg}`);
      
      // If it's a structural error (like not on WhatsApp), mark as failed
      if (apiErr.response?.status === 404) {
        await supabase.from("whatsapp_message_queue")
          .update({ status: "failed", error: "not_on_whatsapp", sent_at: new Date().toISOString() })
          .eq("id", row.id);
      }
    }

  } catch (e) {
    console.error("❌ Worker error:", e.message);
  }
}

// ── Start Heartbeat ──
console.log("==========================================");
console.log("🚀 PG Buddy Campaign Worker Started");
console.log(`⏰ Interval: 3 Minutes`);
console.log(`🔗 Master: ${MASTER_SERVER_URL}`);
console.log("==========================================\n");

// Run immediately on start, then every 3 mins
processCampaign();
setInterval(processCampaign, CAMPAIGN_INTERVAL);
