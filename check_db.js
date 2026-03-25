import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: profiles } = await supabase.from('profiles').select('user_id, phone, full_name').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Profiles:");
  console.dir(profiles, { depth: null });

  const { data: assignments } = await supabase.from('tenant_assignments').select('id, tenant_id, tenant_phone, tenant_name').order('created_at', { ascending: false }).limit(5);
  console.log("\nRecent Assignments:");
  console.dir(assignments, { depth: null });
}
check();
