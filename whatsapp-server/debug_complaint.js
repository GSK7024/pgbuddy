require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testComplaintLogic() {
  const category = "plumbing";
  const property_id = "testing"; // We'll just fetch ANY active plumber to see if the query works
  
  console.log("Testing Edge Function Staff Query Logic...");

  // 1. Map category
  const categoryToRole = {
    "plumbing": "plumber",
    "electrical": "electrician",
    "cleaning": "cleaner",
  };
  const matchingRole = categoryToRole[category.toLowerCase()] || null;
  const rolesToNotify = ["manager", "caretaker"];
  if (matchingRole) rolesToNotify.push(matchingRole);

  console.log("Roles to notify:", rolesToNotify);

  // 2. Fetch staff members
  const { data: staff, error } = await supabase
    .from("staff_members")
    .select("id, staff_user_id, invited_phone, role, owner_id, property_id, status")
    .in("status", ["active", "pending"])
    .in("role", rolesToNotify);
    
  if (error) console.error("Error fetching staff:", error.message);
  
  console.log("Raw Staff Query Results:", staff);
  
  if (staff && staff.length > 0) {
     const managerIds = staff.map(s => s.staff_user_id).filter(Boolean);
     console.log("Manager IDs extracted:", managerIds);
     
     if (managerIds.length > 0) {
        const { data: mProfiles } = await supabase
          .from("profiles")
          .select("phone, full_name, user_id")
          .in("user_id", managerIds);
        console.log("Matched Profiles for Managers:", mProfiles);
     }
     
     const invitedPhones = staff
         .filter(s => !s.staff_user_id && s.invited_phone?.trim())
         .map(s => s.invited_phone.trim());
     console.log("Extracted purely invited phones:", invitedPhones);
  } else {
     console.log("No staff found for roles!");
  }
}

testComplaintLogic();
