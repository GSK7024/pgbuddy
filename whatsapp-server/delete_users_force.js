require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOwner() {
   const userId = "188180ac-8e7e-4781-8e43-63b8063134eb";
   const { data: properties } = await supabase.from('properties').select('id, name').eq('owner_id', userId);
   const { data: staff } = await supabase.from('staff_members').select('id').eq('owner_id', userId);
   
   console.log("Blocking Properties:", properties);
   console.log("Blocking Staff Members length:", staff?.length);
   
   if (properties && properties.length > 0) {
      console.log("Attempting to delete their properties first...");
      const { error } = await supabase.from('properties').delete().eq('owner_id', userId);
      console.log("Property deletion error:", error?.message || "Success");
   }
   
   console.log("Retrying user deletion...");
   const { error: delError } = await supabase.auth.admin.deleteUser(userId);
   console.log("User deletion error:", delError?.message || "Success");
}

checkOwner();
