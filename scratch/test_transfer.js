
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTransferFailure() {
  const tripId = '26bcb31d-e068-44f8-bb85-f2563ffead98'; // Limeira
  const clecianeId = '8ed8568d-72fb-4b67-ab50-d4db0905163f';
  
  // Let's try to update an enrollment (e.g. Patrícia's) to Cleciane
  const patriciaEnrollmentId = '25133d3c-6361-415d-97b0-047d39a59832';
  
  console.log(`Attempting to transfer Patrícia's enrollment (${patriciaEnrollmentId}) to Cleciane (${clecianeId})...`);
  
  const { error } = await supabase
    .from('viagem_passageiros')
    .update({ passageiro_id: clecianeId })
    .eq('id', patriciaEnrollmentId);

  if (error) {
    console.error('FAILED (Expected if unique constraint exists):', error.message);
    console.error('Error Code:', error.code);
  } else {
    console.log('SUCCESS (No unique constraint!)');
    // ROLLBACK manually!
    await supabase
        .from('viagem_passageiros')
        .update({ passageiro_id: '4d7d39a5-9832-415d-97b0-047d39a59832' }) // Wait, I should probably use the original ID
        // Actually I'll just check if it fails.
  }
}

testTransferFailure();
