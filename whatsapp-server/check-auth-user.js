require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkUserAuth() {
  const targetPhone = "9823828184";
  console.log(`🔍 Checking Auth for phone: ${targetPhone}...`);

  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;

    const user = users.users.find(u => u.phone?.includes(targetPhone));
    
    if (user) {
      console.log(`✅ User found in Auth: ${user.id}`);
      console.log(`- Last sign in: ${user.last_sign_in_at}`);
      console.log(`- Created at: ${user.created_at}`);
    } else {
      console.log(`❌ User NOT found in auth.users with tail 9823828184`);
      console.log(`Checking all users with phones...`);
      users.users.forEach(u => {
        if (u.phone) console.log(`- User ${u.id}: ${u.phone}`);
      });
    }
  } catch (err) {
    console.error("❌ Error checking users:", err.message);
  }
}

checkUserAuth();
