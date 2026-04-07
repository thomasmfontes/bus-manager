import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkColumn() {
  const { data, error } = await supabase
    .from('pagamentos')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao acessar tabela pagamentos:', error.message);
    return;
  }

  if (data && data.length > 0) {
    const hasPayerId = 'payer_id' in data[0];
    console.log(`✅ Coluna 'payer_id' existe? ${hasPayerId ? 'SIM' : 'NÃO'}`);
  } else {
    console.log('⚠️ Tabela pagamentos está vazia, não foi possível verificar colunas via select.');
  }
}

checkColumn().catch(console.error);
