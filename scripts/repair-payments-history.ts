import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function repairHistory() {
  console.log('🚀 Iniciando reparo de histórico de pagamentos...');

  // 1. Buscar todos os pagamentos sem payer_id
  const { data: payments, error: pError } = await supabase
    .from('pagamentos')
    .select('id, viagem_id, passageiros_ids, status, payer_name')
    .is('payer_id', null);

  if (pError) {
    console.error('❌ Erro ao buscar pagamentos:', pError);
    return;
  }

  console.log(`🔍 Encontrados ${payments?.length || 0} pagamentos para analisar.`);

  if (!payments || payments.length === 0) {
    console.log('✅ Nenhum pagamento pendente de reparo.');
    return;
  }

  let updatedCount = 0;

  for (const payment of payments) {
    if (!payment.passageiros_ids || payment.passageiros_ids.length === 0) continue;

    // 2. Tentar encontrar quem pagou por esses passageiros nesta viagem
    const { data: enrollments, error: eError } = await supabase
      .from('viagem_passageiros')
      .select('pago_por')
      .eq('viagem_id', payment.viagem_id)
      .in('passageiro_id', payment.passageiros_ids)
      .not('pago_por', 'is', null)
      .limit(1);

    if (eError) {
      console.error(`⚠️ Erro ao buscar reserva para pagamento ${payment.id}:`, eError);
      continue;
    }

    const foundPayerId = enrollments?.[0]?.pago_por;

    if (foundPayerId) {
      console.log(`✏️ Atualizando pagamento ${payment.id} (${payment.payer_name}) -> Payer ID: ${foundPayerId}`);
      
      const { error: updateError } = await supabase
        .from('pagamentos')
        .update({ payer_id: foundPayerId })
        .eq('id', payment.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar pagamento ${payment.id}:`, updateError);
      } else {
        updatedCount++;
      }
    } else {
      console.log(`⚠️ Não foi possível identificar o pagador para o pagamento ${payment.id} (${payment.payer_name})`);
    }
  }

  console.log(`\n✨ Reparo concluído!`);
  console.log(`✅ Pagamentos atualizados: ${updatedCount}`);
}

repairHistory().catch(err => {
  console.error('💥 Erro fatal no script:', err);
  process.exit(1);
});
