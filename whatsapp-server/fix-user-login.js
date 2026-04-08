require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUser() {
  const authId = "b91e2160-b66c-4e1f-a434-f6f5abd19933";
  const profileId = "48759752-9ce8-4004-a977-67d9d4a73d54";
  const businessPlanId = "498fc9c3-cdbf-415b-ac46-b30e395c47d5";
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 3);

  console.log("🛠️ Fixing ID Mismatch for 9823828184...");

  // 1. Assign Owner Role to the correct Auth ID
  const { error: roleErr } = await supabase.from("user_roles").upsert({
    user_id: authId,
    role: "owner"
  });
  if (roleErr) console.error("❌ Role update failed:", roleErr.message);
  else console.log("✅ Correct Owner role assigned to Auth ID.");

  // 2. Fix the Profile table to use the Auth ID as the primary ID if they aren't linked correctly
  // Actually, profiles.id is often the user_id in many templates, but here it's separate.
  // Let's just make sure the profile.user_id points to the Auth ID (it does).

  // 3. Move the Subscription to the Auth ID
  const { error: subErr } = await supabase.from("subscriptions").update({
    user_id: authId,
    current_period_end: expiryDate.toISOString(),
  }).eq("user_id", profileId);

  if (subErr) {
    console.log("⚠️ Existing sub update failed, trying insert...");
    const { error: insErr } = await supabase.from("subscriptions").insert({
        user_id: authId,
        plan_id: businessPlanId,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: expiryDate.toISOString()
    });
    if (insErr) console.error("❌ Subscription fix failed:", insErr.message);
    else console.log("✅ Business Plan granted to correct Auth ID.");
  } else {
    console.log("✅ Subscription migrated from Profile PK to Auth ID.");
  }

  // 4. Delete the orphan/incorrect subscription entry if any
  await supabase.from("subscriptions").delete().eq("user_id", profileId);
  
  console.log("🚀 Done! User should be able to login as Owner + Business Plan now.");
}

fixUser();
