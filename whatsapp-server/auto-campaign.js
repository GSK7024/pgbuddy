require("dotenv").config();
const { execSync } = require("child_process");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SEARCH_QUERY = process.argv.slice(2).join(" ");

if (!SEARCH_QUERY) {
  console.error("❌ Please provide a search query! Example: node auto-campaign.js \"PG in Hinjewadi Pune\"");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const LEADS_FILE = path.join(__dirname, "pg_leads.json");

async function runCampaign() {
  console.log(`\n🚀 [STAGE 1/3] Scraping Google Maps for: "${SEARCH_QUERY}"`);
  console.log(`This will open a background browser and take 1-2 minutes. Please wait...`);

  try {
    // 1. Run the scraper
    execSync(`node scrape-leads.js "${SEARCH_QUERY}"`, { stdio: "inherit" });
    console.log(`\n✅ [STAGE 1 COMPLETE] Scraping finished successfully.\n`);
  } catch (err) {
    console.error("❌ Scraper failed to run:", err.message);
    process.exit(1);
  }

  // 2. Read the results
  console.log(`\n🔄 [STAGE 2/3] Analyzing and deduping leads from Supabase...`);
  if (!fs.existsSync(LEADS_FILE)) {
    console.error("❌ No pg_leads.json file was generated. Scraping may have failed.");
    return;
  }

  const leads = JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8"));
  const validLeads = leads.filter((lead) => lead.phone && lead.phone.length === 10);

  if (validLeads.length === 0) {
    console.log("⚠️ No valid phone numbers found in this area. Try a different search!");
    return;
  }

  // 3. Fetch existing campaigned numbers to avoid spamming the same PG
  const { data: existingRecords, error: fetchErr } = await supabase
    .from("whatsapp_message_queue")
    .select("phone_number")
    .eq("template_type", "b2b_pitch");

  if (fetchErr) {
    console.error("❌ Failed to contact Supabase to check existing numbers:", fetchErr.message);
    return;
  }

  const existingPhones = new Set((existingRecords || []).map((row) => row.phone_number.replace(/\D/g, "").slice(-10)));

  // Filter out duplicates
  const BLACKLIST = ["stanza", "zolo", "mauli", "dew", "isthara", "helloworld", "stayabode", "colive", "pg manager", "your-space"];
  const newLeads = validLeads.filter((lead) => {
    // 1. Skip if we already pitched them according to the DB
    if (existingPhones.has(lead.phone)) return false;

    // 2. Skip if their name is in our blacklist
    const nameLower = (lead.pg_name || "").toLowerCase();
    const isBlacklisted = BLACKLIST.some((badKeyword) => nameLower.includes(badKeyword));
    if (isBlacklisted) return false;

    return true; // Safe to send
  }).slice(0, 25); // Limit to 25 leads per run

  console.log(`📊 Found ${validLeads.length} valid numbers from Google Maps.`);
  console.log(`🛑 Skipped ${validLeads.length - newLeads.length} numbers that we already pitched previously.`);
  console.log(`🎯 Sending to ${newLeads.length} NEW PGs!\n`);

  if (newLeads.length === 0) {
    console.log("🏁 All PGs in this list have already been messaged. Campaign finished.");
    return;
  }

  // 4. Inject into Supabase
  console.log(`\n📤 [STAGE 3/3] Queueing pitches into your database...`);
  const queueRows = newLeads.map((lead) => {
    const pgName = lead.pg_name || "PG Owner";
    
    // Check if the lead has a rating/reviews and optionally a bad review
    let introText = `We noticed you're listed on Google Maps! Managing a growing PG can be tough.`;
    
    if (lead.rating && lead.review_count) {
      if (lead.bad_review_text) {
        introText = `We noticed that you have a Google rating of ${lead.rating}, with ${lead.review_count} reviews, but some guests have mentioned concerns about ${lead.bad_review_text.slice(0, 30)}..., which might be affecting your overall guest experience 📉.`;
      } else {
        introText = `We noticed that you have a solid Google rating of ${lead.rating} with ${lead.review_count} reviews! However, maintaining that reputation while handling rent manually can be overwhelming.`;
      }
    }

    const message = `🏠 *${pgName}*\n${introText}\n\nHere are the key features of PG Buddy:\n✅ Automated WhatsApp Reminders\n✅ Digital Receipts & Billing\n✅ Complaint Tracking\n✅ Mess & Room Analytics\n\nBy leveraging PG Buddy, local Pune PGs have stopped manual follow-ups and increased collections by 20% 🚀.\n\nLearn more: https://pgbuddy-zeta-rust.vercel.app\n\nWe also provide tech & software services across various domains at https://nktstudio.tech/\n\nWould you be open to a quick 5-min online meeting to explore how we can help? 🗓️`;

    return {
      phone_number: lead.phone,
      message: message,
      template_type: "b2b_pitch",
      status: "pending",
      created_at: new Date().toISOString(),
    };
  });

  const { error: insertErr } = await supabase.from("whatsapp_message_queue").insert(queueRows);

  if (insertErr) {
    console.error("❌ Error queueing messages in Supabase:", insertErr.message);
  } else {
    console.log(`✅ [COMPLETE] Successfully queued ${queueRows.length} total marketing messages!`);
    console.log(`⏱️  Your WhatsApp Server will now automatically drip-feed these exact pitches 1 by 1 every 90 seconds in the background.`);
    console.log(`Estimated time to send all messages: ${((queueRows.length * 90) / 60).toFixed(1)} minutes.`);
    console.log(`\nYou can now close this terminal! Do not close your WhatsApp Server terminal.\n`);
  }
}

runCampaign();
