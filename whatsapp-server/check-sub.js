require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSub() {
  const { data: profiles } = await supabase.from("profiles").select("id").ilike("phone", "%9823828184%");
  if (!profiles || profiles.length === 0) return console.log("No profile found.");
  
  const userId = profiles[0].id;

  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);

  console.log("Subscriptions for user:", subs);
  if (error) console.error("Error:", error);
}

checkSub();
