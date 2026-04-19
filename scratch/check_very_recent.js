
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVeryRecent() {
  console.log(`Checking for updates in the last 2 hours (since 10:30 user time)...`);
  // User time 12:32-03:00 means UTC 15:32.
  // Let's check from 14:00 UTC.
  const { data: enrollments, error } = await supabase
    .from('viagem_passageiros')
    .select('*, passageiros(nome_completo), viagens(destino)')
    .gte('updated_at', '2026-04-19T13:00:00Z')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${enrollments.length} enrollments updated recently.`);
  enrollments.forEach(e => {
    console.log(`ID: ${e.id} | Trip: ${e.viagens?.destino} | Passenger: ${e.passageiros?.nome_completo} | Assento: ${e.assento} | Updated: ${e.updated_at}`);
  });
}

checkVeryRecent();
