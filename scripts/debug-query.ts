import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

async function run() {
  const { data, error } = await supabase.from('pagamentos').select('*').limit(1);
  const out = [];
  if (data && data.length > 0) {
    out.push('passageiros_ids type: ' + typeof data[0].passageiros_ids);
    out.push('Is Array: ' + Array.isArray(data[0].passageiros_ids));
    out.push('Value: ' + JSON.stringify(data[0].passageiros_ids));
  }
  
  const testUserId = "some_id";
  const { data: d2, error: queryErr } = await supabase
    .from('pagamentos')
    .select('id')
    .or(`payer_id.eq.${testUserId},passageiros_ids.cs.{"${testUserId}"}`)
    .limit(1);
  if (queryErr) {
    out.push('Error details: ' + JSON.stringify(queryErr));
  } else {
    out.push('Query succeeded');
  }

  // Also test with JSON cs
  const { data: d3, error: qErr2 } = await supabase
    .from('pagamentos')
    .select('id')
    .or(`payer_id.eq.${testUserId},passageiros_ids.cs.["${testUserId}"]`)
    .limit(1);
  if (qErr2) {
    out.push('JSON CS Error: ' + JSON.stringify(qErr2));
  } else {
    out.push('JSON CS succeeded');
  }
  
  fs.writeFileSync('debug_output.json', JSON.stringify(out, null, 2));
}

run();
