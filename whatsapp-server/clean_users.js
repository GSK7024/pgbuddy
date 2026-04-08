require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanUserData() {
  const targetPhones = ["917743843389", "918108813284"];
  console.log("Starting deep wipe for:", targetPhones);

  // Get user IDs
  const { data: profiles } = await supabase.from('profiles').select('user_id, phone');
  if (!profiles) return console.error("No profiles found.");

  for (const target of targetPhones) {
     const profile = profiles.find(p => p.phone === target);
     if (!profile) {
        console.log(`User ${target} not found in profiles or already deleted.`);
        continue;
     }

     const userId = profile.user_id;
     console.log(`\n============================`);
     console.log(`Wiping data for: ${target} (ID: ${userId})`);

     // 1. Get properties owned by user
     const { data: properties } = await supabase.from('properties').select('id').eq('owner_id', userId);
     const propertyIds = (properties || []).map(p => p.id);
     
     if (propertyIds.length > 0) {
        console.log(`Found ${propertyIds.length} properties. Wiping linked data...`);

        // 2. Delete Staff Members assigned to these properties or this owner
        await supabase.from('staff_members').delete().eq('owner_id', userId);
        
        // 3. Delete Tenant Assignments
        await supabase.from('tenant_assignments').delete().in('property_id', propertyIds);

        // 4. Delete Complaints
        await supabase.from('complaints').delete().in('property_id', propertyIds);

        // 5. Delete Beds (via rooms)
        // Need room IDs first
        const { data: rooms } = await supabase.from('rooms').select('id').in('property_id', propertyIds);
        const roomIds = (rooms || []).map(r => r.id);
        if (roomIds.length > 0) {
           await supabase.from('beds').delete().in('room_id', roomIds);
           console.log(`Deleted beds in ${roomIds.length} rooms`);
        }

        // 6. Delete Rooms
        await supabase.from('rooms').delete().in('property_id', propertyIds);

        // 7. Finally delete the properties
        const { error: propErr } = await supabase.from('properties').delete().in('id', propertyIds);
        if (propErr) console.error("Error deleting properties:", propErr.message);
        else console.log("Deleted properties.");
     }

     // Now delete the Auth User! (This handles profiles, etc automatically)
     const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
     if (authErr) {
        console.error(`Failed to delete Auth User ${target}:`, authErr.message);
     } else {
        console.log(`✅ COMPLETELY DELETED AUTH USER ${target}`);
     }
  }

  console.log("\nWipe completed.");
}

cleanUserData();
