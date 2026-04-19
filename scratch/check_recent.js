
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentChanges() {
  const tripId = '26bcb31d-e068-44f8-bb85-f2563ffead98';
  console.log(`Checking recent changes for trip ${tripId}...`);
  
  const { data: enrollments, error } = await supabase
    .from('viagem_passageiros')
    .select('*, passageiros(nome_completo)')
    .eq('viagem_id', tripId)
    .gte('updated_at', '2026-04-19T00:00:00Z');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${enrollments.length} enrollments updated today.`);
  enrollments.forEach(e => {
    console.log(`ID: ${e.id} | Passenger: ${e.passageiros?.nome_completo} (${e.passageiro_id}) | Assento: ${e.assento} | Pago: ${e.pagamento} | Updated: ${e.updated_at}`);
  });

  // Also check if there's any other "Cleciane" or if she is in another trip today.
  console.log('\nChecking all Cleciane enrollments everywhere...');
  const { data: clecianeAll } = await supabase
    .from('viagem_passageiros')
    .select('*, passageiros(nome_completo), viagens(destino, data_ida)')
    .ilike('passageiros.nome_completo', '%Cleciane%');
  
  if (clecianeAll) {
     clecianeAll.forEach(e => {
        console.log(`Trip: ${e.viagens?.destino} (${e.viagens?.data_ida}) | ID: ${e.id} | Assento: ${e.assento} | Updated: ${e.updated_at}`);
     });
  }
}

checkRecentChanges();
