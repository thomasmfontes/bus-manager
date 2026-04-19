
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNewPassengers() {
  console.log(`Checking for new passengers created today...`);
  const { data: passengers, error } = await supabase
    .from('passageiros')
    .select('*')
    .gte('created_at', '2026-04-19T00:00:00Z');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${passengers.length} passengers created today.`);
  passengers.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.nome_completo} | Created: ${p.created_at}`);
  });
}

checkNewPassengers();
