require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function grantProPlan() {
  const targetPhone = "9823828184";
  console.log(`🔍 Looking up user with phone: ${targetPhone}...`);

  // 1. Get user_id from profiles (using wildcard for safe matches with/without country codes)
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, phone")
    .ilike("phone", `%${targetPhone}%`);

  if (profileErr || !profiles || profiles.length === 0) {
    console.error("❌ Could not find user with that phone number.");
    return;
  }
  
  const userId = profiles[0].id;
  console.log(`✅ Found user: ${userId}`);

  // 2. Get the 'business' plan ID
  const { data: plans, error: planErr } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", "business")
    .single();

  if (planErr || !plans) {
    console.error("❌ Could not find 'business' plan in subscription_plans.");
    return;
  }
  const planId = plans.id;
  console.log(`✅ Found 'business' plan ID: ${planId}`);

  // 3. Calculate expiry date (3 days from now)
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 3);

  // 4. Update or Insert Subscription
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingSub) {
    const { error: updateErr } = await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: expiryDate.toISOString(),
      })
      .eq("id", existingSub.id);

    if (updateErr) console.error("❌ Failed to update subscription:", updateErr.message);
    else console.log(`🎉 Successfully upgraded existing subscription to PRO until ${expiryDate.toLocaleDateString()}`);
  } else {
    const { error: insertErr } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: expiryDate.toISOString(),
      });

    if (insertErr) console.error("❌ Failed to insert new subscription:", insertErr.message);
    else console.log(`🎉 Successfully granted NEW PRO plan until ${expiryDate.toLocaleDateString()}`);
  }
}

grantProPlan();
