require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanRemaining() {
  const userId = "188180ac-8e7e-4781-8e43-63b8063134eb"; // 7743843389
  
  console.log(`Wiping remaining tables for ${userId}`);

  const tablesToWipe = [
    'subscriptions', 
    'payment_methods', 
    'audit_logs', 
    'referrals', 
    'mess_members',
    'expenses',
    'announcements',
    'payments',
    'tenant_assignments',
    'staff_members', // they might be "invited_phone"
  ];

  for (const table of tablesToWipe) {
     console.log(`Deleting from ${table}...`);
     // Most tables use 'user_id', owner_id, or tenant_id
     try {
       await supabase.from(table).delete().eq('user_id', userId);
     } catch(e) {}
     try {
       await supabase.from(table).delete().eq('owner_id', userId);
     } catch(e) {}
     try {
       await supabase.from(table).delete().eq('tenant_id', userId);
     } catch(e) {}
  }
  
  // Try to delete Auth user again
  const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
  if (authErr) {
     console.error(`Still failed to delete Auth User:`, authErr.message);
  } else {
     console.log(`✅ COMPLETELY DELETED AUTH USER 917743843389`);
  }
}

cleanRemaining();
