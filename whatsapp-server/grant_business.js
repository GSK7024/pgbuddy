require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeUser() {
  const targetPhone = "917743843389";
  
  // Find their user ID
  const { data: profiles } = await supabase.from('profiles').select('user_id').eq('phone', targetPhone).single();
  
  if (!profiles) {
     return console.log("User not found!");
  }
  
  const userId = profiles.user_id;

  // Find the current Business Plan ID from subscription_plans
  const { data: plans } = await supabase.from('subscription_plans').select('id, name, slug').eq('slug', 'business').single();
  
  if (!plans) {
    return console.log("Failed to find 'business' plan slug in the database.");
  }

  // Check if they already have an active subscription
  const { data: existingSub } = await supabase
     .from('subscriptions')
     .select('id')
     .eq('user_id', userId)
     .eq('status', 'active')
     .single();

  if (existingSub) {
    // Update it
    console.log("Updating existing active subscription to Business...");
    const { error: upErr } = await supabase.from('subscriptions').update({ plan_id: plans.id }).eq('id', existingSub.id);
    if (!upErr) console.log("✅ Successfully updated to Business Plan!");
  } else {
    // Insert new
    console.log("Creating new active Business Subscription...");
    const { error: insErr } = await supabase.from('subscriptions').insert({
       user_id: userId,
       plan_id: plans.id,
       status: 'active',
       current_period_start: new Date().toISOString(),
       current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year expiry
    });
    if (!insErr) console.log("✅ Successfully granted an active Business Plan for 1 year!");
    else console.error("Error inserting:", insErr.message);
  }
}

upgradeUser();
