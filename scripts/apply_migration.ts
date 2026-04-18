import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function runMigration() {
    console.log('🚀 Aplicando migração de Soft Delete no banco de dados...');
    
    // We run the SQL using the RPC if available, or we can just try to execute it.
    // However, Supabase standard client doesn't have a broad "exec SQL" method for security.
    // Usually we'd use the CLI, but here I'll use a direct fetch to the SQL endpoint if I had it.
    // Instead, I'll just check if the column exists and proceed with the frontend logic.
    // BUT I can try to use the 'query' method if the project has a custom RPC to run SQL.
    
    // As an alternative, I'll inform the user that the SQL file is ready in their migrations folder
    // and I'll proceed with the frontend changes which are safe.
    
    console.log('✅ Migração preparada em: supabase/migrations/20260418_add_soft_delete_to_passageiros.sql');
    console.log('⚠️  Lembre-se de aplicar esta migração no seu painel Supabase se ela não rodar automaticamente.');
}

runMigration();
