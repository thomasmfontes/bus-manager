
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCleciane() {
  console.log('Searching for "Cleciane" in passageiros...');
  const { data: passengers, error: pErr } = await supabase
    .from('passageiros')
    .select('*')
    .ilike('nome_completo', '%Cleciane%');

  if (pErr) {
    console.error('Error fetching passengers:', pErr);
    return;
  }

  console.log('Passengers found:', JSON.stringify(passengers, null, 2));

  if (passengers.length > 0) {
    const ids = passengers.map(p => p.id);
    console.log(`Checking enrollments for IDs: ${ids.join(', ')}`);
    
    const { data: enrollments, error: eErr } = await supabase
      .from('viagem_passageiros')
      .select('*, viagens(destino, data_ida)')
      .in('passageiro_id', ids);

    if (eErr) {
      console.error('Error fetching enrollments:', eErr);
      return;
    }

    console.log('Enrollments found:', JSON.stringify(enrollments, null, 2));
  } else {
    console.log('No passenger named Cleciane found.');
  }
}

checkCleciane();
