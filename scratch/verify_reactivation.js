
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testReactivation() {
  const tripId = '26bcb31d-e068-44f8-bb85-f2563ffead98'; // Limeira
  const sourceEnrollmentId = '25133d3c-6361-415d-97b0-047d39a59832'; // Patrícia 
  const targetPassengerId = '4ccf9bb1-458d-4611-8b0a-9efed06964cd'; // Yasmin (Already DESISTENTE)

  console.log('--- Phase 0: Setup ---');
  // Make source enrollment active again for the test
  await supabase.from('viagem_passageiros').update({ assento: '99', pagamento: 'Pago' }).eq('id', sourceEnrollmentId);
  console.log('Source enrollment 99 created for Patrícia.');

  console.log('--- Phase 1: Simulate substitution logic ---');
  
  // 1. Get source enrollment
  const { data: enrollment } = await supabase.from('viagem_passageiros').select('*').eq('id', sourceEnrollmentId).single();
  
  // 2. Check if target is already enrolled
  const { data: existingEnrollment } = await supabase
    .from('viagem_passageiros')
    .select('*')
    .eq('viagem_id', tripId)
    .eq('passageiro_id', targetPassengerId)
    .maybeSingle();

  if (existingEnrollment && existingEnrollment.assento === 'DESISTENTE') {
      console.log(`Target ${targetPassengerId} is DESISTENTE. Reactivating...`);
      
      const { data: reactivated, error: reactErr } = await supabase
        .from('viagem_passageiros')
        .update({
            assento: null,
            pagamento: enrollment.pagamento,
            valor_pago: enrollment.valor_pago,
            pago_por: enrollment.pago_por,
            updated_at: new Date().toISOString()
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();
        
      if (reactErr) {
          console.error('Reactivation FAILED:', reactErr.message);
      } else {
          console.log('Reactivation SUCCESS! Deleting source enrollment...');
          await supabase.from('viagem_passageiros').delete().eq('id', sourceEnrollmentId);
          console.log('Source enrollment deleted.');
      }
  } else {
      console.log('Target is not desistente or not found. Logic would differ.');
  }

  console.log('--- Phase 2: Verify ---');
  const { data: finalTarget } = await supabase.from('viagem_passageiros').select('*').eq('passageiro_id', targetPassengerId).eq('viagem_id', tripId).single();
  console.log('Final enrollment for Target:', finalTarget.id, 'Assento:', finalTarget.assento, 'Pagamento:', finalTarget.pagamento);
  
  const { data: finalSource } = await supabase.from('viagem_passageiros').select('*').eq('id', sourceEnrollmentId).maybeSingle();
  console.log('Source enrollment exists?', !!finalSource);
}

testReactivation();
