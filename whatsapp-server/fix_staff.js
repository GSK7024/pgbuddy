require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStaff() {
   // Find any staff_members where staff_user_id == owner_id 
   // which accidentally locks the owner out of the 'Staff' tab.
   
   const { data: staff } = await supabase.from('staff_members').select('*');
   
   let deletedCount = 0;
   if (staff) {
     for (const s of staff) {
       // Also delete if they added the phone 7743843389 or 8108813284
       if (s.staff_user_id === s.owner_id || s.invited_phone?.includes("7743") || s.invited_phone?.includes("8108")) {
          console.log("Deleting self-assigned staff record:", s.id);
          await supabase.from('staff_members').delete().eq('id', s.id);
          deletedCount++;
       }
     }
   }
   
   console.log(`Deleted ${deletedCount} circular staff records. The owner should now see the Staff button again.`);
}

fixStaff();
