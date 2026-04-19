
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('Checking unique constraints on viagem_passageiros...');
  // We can query information_schema if we have permissions, or just try to insert a duplicate.
  // Actually, we can use RPC to check if available, but let's just try to find it via a query that might fail.
  
  const { data, error } = await supabase.rpc('get_table_constraints', { table_name: 'viagem_passageiros' });
  if (error) {
    console.log('RPC get_table_constraints not found, trying common query...');
    // Fallback: Check if we can find it in pg_indexes
    const { data: indexes, error: idxErr } = await supabase.from('pg_indexes').select('*').eq('tablename', 'viagem_passageiros');
    // Wait, pg_indexes is in pg_catalog, standard Supabase might not allow direct select.
    
    // Let's just try to INSERT a duplicate and see the error message.
    console.log('Test: Trying to insert a potential duplicate to see constraint error...');
  } else {
    console.log('Constraints:', JSON.stringify(data, null, 2));
  }
}

async function checkClecianeAgain() {
  // Check if Cleciane has ANY other enrollments that were updated today but under a different name? No, I checked by her ID.
  
  // Wait, check if there is an enrollment for the Limeira trip that was DELETED today?
  // Our store uses soft-delete for passengers, but maybe hard delete for enrollments?
  // fetchPassageiros uses .is('deleted_at', null) on passengers, but doesn't check deleted_at on enrollments.
}

checkConstraints();
