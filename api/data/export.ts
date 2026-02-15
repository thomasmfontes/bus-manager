import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get auth token from request
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Create Supabase client
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing Supabase configuration');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error('Auth error:', authError);
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get query parameters (ensure they are strings)
        const fieldsParam = Array.isArray(req.query.fields) ? req.query.fields[0] : req.query.fields;
        const viagemIdParam = Array.isArray(req.query.viagem_id) ? req.query.viagem_id[0] : req.query.viagem_id;

        // Default fields if none provided (decode + as space if needed)
        const selectedFields = fieldsParam
            ? (fieldsParam as string).split(',').map(f => decodeURIComponent(f).replace(/\+/g, ' '))
            : ['Nome', 'Documento', 'Telefone', 'Congregação', 'Status', 'Assento'];

        // Map export labels back to database columns
        const columnMap: Record<string, string> = {
            'Nome': 'nome_completo',
            'Documento': 'cpf_rg',
            'Telefone': 'telefone',
            'Congregação': 'comum_congregacao',
            'Status': 'pagamento',
            'Ônibus': 'onibus_info',
            'Assento': 'assento',
            'Instrumento': 'instrumento',
            'Idade': 'idade',
            'Valor Pago': 'valor_pago',
            'Estado Civil': 'estado_civil',
            'Auxiliar': 'auxiliar'
        };

        // Start building query
        let passengers: any[] = [];
        let fetchError: any = null;

        if (viagemIdParam && viagemIdParam !== 'all') {
            // Case 1: Filtered by Trip - Primary table is 'viagem_passageiros'
            const { data, error } = await supabase
                .from('viagem_passageiros')
                .select(`
                    pagamento,
                    assento,
                    valor_pago,
                    viagem_id,
                    onibus:onibus_id (nome, placa),
                    passageiros!inner (*)
                `)
                .eq('viagem_id', (viagemIdParam as string))
                .in('pagamento', ['Pago', 'paid', 'Realizado']);

            if (!error && data) {
                // Flatten and clean
                passengers = data.map(enrollment => {
                    const bus = (enrollment as any).onibus;
                    const onibus_info = bus ? bus.nome : '-';

                    return {
                        ...((enrollment as any).passageiros || {}),
                        pagamento: enrollment.pagamento,
                        assento: enrollment.assento,
                        valor_pago: enrollment.valor_pago,
                        viagem_id: enrollment.viagem_id,
                        onibus_info
                    };
                }).filter(p => (p as any).nome_completo !== 'BLOQUEADO');

                // Sort in memory for robustness
                passengers.sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || ''));
            }
            fetchError = error;
        } else {
            // Case 2: Master List (Global) - Primary table is 'passageiros'
            const { data, error } = await supabase
                .from('passageiros')
                .select('*')
                .neq('nome_completo', 'BLOQUEADO')
                .order('nome_completo');

            passengers = data || [];
            fetchError = error;
        }

        if (fetchError) {
            console.error('Database error in export:', fetchError);
            return res.status(500).json({ error: fetchError.message || 'Erro ao buscar dados no banco' });
        }

        // Fetch trip name if filtered
        let fileNamePrefix = 'lista-passageiros';
        if (viagemIdParam && viagemIdParam !== 'all') {
            const { data: trip } = await supabase
                .from('viagens')
                .select('nome')
                .eq('id', (viagemIdParam as string))
                .maybeSingle();
            if (trip) {
                fileNamePrefix = `lista-${trip.nome.replace(/[^\w-]/g, '-').toLowerCase()}`;
            }
        }

        // Process data for export using selected fields
        const processedRows = (passengers || []).map(p => {
            const row: any = {};
            selectedFields.forEach(field => {
                const dbColumn = columnMap[field];
                const value = (dbColumn && p) ? p[dbColumn] : null;

                if (field === 'Status') {
                    // Try to match both database and display formats
                    const v = (value || '').toString().toLowerCase();
                    if (v === 'paid' || v === 'pago' || v === 'realizado') row[field] = 'Pago';
                    else if (v === 'pending' || v === 'pendente') row[field] = 'Pendente';
                    else row[field] = value || 'Pendente';
                } else if (field === 'Valor Pago') {
                    const numValue = (value !== undefined && value !== null) ? Number(value) : 0;
                    row[field] = `R$ ${numValue.toFixed(2)}`.replace('.', ',');
                } else {
                    row[field] = (value !== undefined && value !== null && value !== '') ? value : '-';
                }
            });
            return row;
        });

        console.log(`Exporting ${processedRows.length} rows with prefix ${fileNamePrefix}`);

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Ensure sheet is created even if no rows
        const ws = processedRows.length > 0
            ? XLSX.utils.json_to_sheet(processedRows, { header: selectedFields })
            : XLSX.utils.aoa_to_sheet([selectedFields]);

        // Adjust column widths
        const wscols = selectedFields.map(field => {
            if (field === 'Nome') return { wch: 40 };
            if (field === 'Documento') return { wch: 18 };
            if (field === 'Telefone') return { wch: 15 };
            return { wch: 12 };
        });
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Passageiros");

        // Generate Excel file
        // Using 'base64' then converting to Buffer is the safest way for serverless environments
        const excelB64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const finalBuffer = Buffer.from(excelB64, 'base64');

        // Set headers for safely downloading binary data
        const dateString = new Date().toISOString().split('T')[0];
        const fileName = `${fileNamePrefix}-${dateString}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', finalBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');

        return res.status(200).send(finalBuffer);

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
