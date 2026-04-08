require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteUsers() {
  const phoneNumbersToCheck = ["7743843389", "8108813284", "+917743843389", "+918108813284", "917743843389", "918108813284"];
  console.log("Searching profiles for phones:", phoneNumbersToCheck);

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, phone, full_name');
    
  if (error) {
    console.error("Error fetching profiles:", error);
    return;
  }

  let deletedCount = 0;
  for (const profile of profiles) {
    if (profile.phone) {
       const cleanPhone = profile.phone.replace(/\D/g, "").slice(-10);
       if (["7743843389", "8108813284"].includes(cleanPhone)) {
         console.log(`Found matching profile: ${profile.phone} (${profile.user_id})`);
         const { error: delError } = await supabase.auth.admin.deleteUser(profile.user_id);
         if (delError) {
           console.error(`Failed to delete auth user ${profile.user_id}:`, delError.message);
         } else {
           console.log(`✅ successfully deleted from auth: ${profile.phone} (${profile.full_name})`);
           deletedCount++;
         }
       }
    }
  }

  // Also manually try to delete them by searching auth if they don't have a profile
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (!authError && users) {
     for (const user of users) {
       if (user.phone) {
          const cleanPhone = user.phone.replace(/\D/g, "").slice(-10);
          if (["7743843389", "8108813284"].includes(cleanPhone)) {
             console.log(`Deleting auth user directly: ${user.phone}`);
             await supabase.auth.admin.deleteUser(user.id);
             deletedCount++;
          }
       }
     }
  }

  console.log(`Deleted ${deletedCount} users total.`);
}

deleteUsers();
