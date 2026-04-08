require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LEADS_FILE = path.join(__dirname, "pg_leads.json");

async function queueLeads() {
  if (!fs.existsSync(LEADS_FILE)) {
    console.error("❌ No pg_leads.json file found. Run scrape-leads.js first!");
    return;
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
  
  // Filter leads with 10 digit phones
  const validLeads = leads.filter(lead => lead.phone && lead.phone.length === 10);
  
  console.log(`📋 Found ${validLeads.length} valid leads to queue.`);

  if (validLeads.length === 0) return;

  const queueRows = validLeads.map(lead => {
    // Clean PG name (remove 'PG', 'Hostel' etc just to make it conversational if needed, or keep it)
    const pgName = lead.pg_name || "PG Owner";
    
    // Customized Pitch with 'reply here for demo'
    const message = `Hi ${pgName} Team! 👋\n\nI am a local software developer. I saw your PG on Google Maps.\n\nI've built a simple Cloud Software + Tenant App specifically for PGs to automatically collect rent on time and send WhatsApp receipts. No bulky computers needed.\n\nCan I show you a quick 5-minute demo on your phone? It will save you 20+ hours of accounting work every month.\n\n*Reply here for a free live demo.*`;

    return {
      phone_number: lead.phone,
      message: message,
      template_type: "b2b_pitch",
      status: "pending",
      created_at: new Date().toISOString()
    };
  });

  // Batch insert to Supabase
  const { error } = await supabase.from("whatsapp_message_queue").insert(queueRows);

  if (error) {
    console.error("❌ Error queueing messages in Supabase:", error.message);
  } else {
    console.log(`✅ Successfully queued ${queueRows.length} marketing messages!`);
    console.log(`⏱️  The WhatsApp Server will now send 1 message every 90 seconds (approx ${((queueRows.length * 90) / 60).toFixed(1)} minutes total).`);
  }
}

queueLeads().catch(console.error);
