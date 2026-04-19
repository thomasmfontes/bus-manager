
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTrip() {
  const tripId = '26bcb31d-e068-44f8-bb85-f2563ffead98';
  console.log(`Checking trip ${tripId} enrollments...`);
  
  const { data: enrollments, error } = await supabase
    .from('viagem_passageiros')
    .select('*, passageiros(nome_completo, cpf_rg)')
    .eq('viagem_id', tripId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Enrollments for trip (sorted by latest update):');
  enrollments.forEach(e => {
    console.log(`ID: ${e.id} | Passenger: ${e.passageiros?.nome_completo} (${e.passageiro_id}) | Assento: ${e.assento} | Pago: ${e.pagamento} | Updated: ${e.updated_at}`);
  });
}

checkTrip();
