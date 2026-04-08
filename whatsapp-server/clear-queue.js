require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearPendingPitches() {
  console.log("Clearing old pending marketing pitches to prevent 'cheap' messages from sending...");
  const { data, error } = await supabase
    .from("whatsapp_message_queue")
    .delete()
    .eq("status", "pending")
    .eq("template_type", "b2b_pitch");

  if (error) {
    console.error("❌ Failed to clear queue:", error.message);
  } else {
    console.log("✅ Successfully cleared old pending pitches!");
  }
}

clearPendingPitches();
