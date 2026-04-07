import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  const testUserId = "bcda289e-0f1c-4caa-896d-ba5fff0b9f82";
  const result: any = {};
  
  const { data: d1, error: e1 } = await supabase
    .from('pagamentos')
    .select('id')
    .or(`payer_id.eq.${testUserId},passageiros_ids.cs.{"${testUserId}"}`)
    .limit(1);
  result.format1 = e1 ? e1 : d1;

  const { data: d2, error: e2 } = await supabase
    .from('pagamentos')
    .select('id')
    .or(`payer_id.eq.${testUserId},passageiros_ids.cs.{${testUserId}}`)
    .limit(1);
  result.format2 = e2 ? e2 : d2;

  fs.writeFileSync('debug_json.json', JSON.stringify(result, null, 2));
}

run();
