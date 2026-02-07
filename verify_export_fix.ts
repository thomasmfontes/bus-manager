import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function verifyExportLogic() {
    const fieldsParam = 'Nome,Estado+Civil,Valor+Pago';
    const selectedFields = fieldsParam.split(',').map(f => decodeURIComponent(f).replace(/\+/g, ' '));
    console.log('Selected Fields:', selectedFields);

    const columnMap = {
        'Nome': 'nome_completo',
        'Valor Pago': 'valor_pago',
        'Estado Civil': 'estado_civil',
    };

    const voyageId = '52fc850c-befc-4bf3-bf9d-13874c46c35b';
    const { data: enrollments, error } = await supabase
        .from('viagem_passageiros')
        .select(`
            pagamento,
            assento,
            valor_pago,
            viagem_id,
            passageiros!inner (*)
        `)
        .eq('viagem_id', voyageId);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const processedRows = enrollments.map(enrollment => {
        const p = {
            ...((enrollment as any).passageiros || {}),
            pagamento: enrollment.pagamento,
            assento: enrollment.assento,
            valor_pago: enrollment.valor_pago,
        };

        const row: any = {};
        selectedFields.forEach(field => {
            const dbColumn = (columnMap as any)[field];
            const value = (dbColumn && p) ? p[dbColumn] : null;

            if (field === 'Valor Pago') {
                const numValue = (value !== undefined && value !== null) ? Number(value) : 0;
                row[field] = `R$ ${numValue.toFixed(2)}`.replace('.', ',');
            } else {
                row[field] = (value !== undefined && value !== null && value !== '') ? value : '-';
            }
        });
        return row;
    });

    console.log('\n--- Dados Processados ---');
    console.log(JSON.stringify(processedRows.slice(0, 3), null, 2));
}

verifyExportLogic();
