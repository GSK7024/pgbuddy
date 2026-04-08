require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDetails() {
  const targetPhone = "9823828184";
  console.log(`🔍 Cross-referencing phone: ${targetPhone}...`);

  // Auth
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.phone?.includes(targetPhone));
  console.log("Auth User:", authUser ? { id: authUser.id, phone: authUser.phone } : "None");

  // Profile
  const { data: profiles } = await supabase.from("profiles").select("*").ilike("phone", `%${targetPhone}%`);
  console.log("Profiles found:", profiles);

  // User Roles
  const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", [authUser?.id, ...profiles.map(p => p.id)].filter(Boolean));
  console.log("User Roles found:", roles);

  // Subscriptions
  const { data: subs } = await supabase.from("subscriptions").select("*").in("user_id", [authUser?.id, ...profiles.map(p => p.id)].filter(Boolean));
  console.log("Subscriptions found:", subs);
}

checkDetails();
