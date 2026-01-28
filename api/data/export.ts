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
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get query parameters
        const { fields, viagem_id } = req.query;

        // Default fields if none provided
        const selectedFields = fields ? (fields as string).split(',') : ['Nome', 'Documento', 'Telefone', 'Congregação', 'Status', 'Assento'];

        // Map export labels back to database columns
        const columnMap: Record<string, string> = {
            'Nome': 'nome_completo',
            'Documento': 'cpf_rg',
            'Telefone': 'telefone',
            'Congregação': 'comum_congregacao',
            'Status': 'pagamento',
            'Assento': 'assento',
            'Instrumento': 'instrumento',
            'Idade': 'idade',
            'Valor Pago': 'valor_pago',
            'Estado Civil': 'estado_civil',
            'Auxiliar': 'auxiliar'
        };

        // Start building query
        let query = supabase
            .from('passageiros')
            .select('*')
            .neq('nome_completo', 'BLOQUEADO');

        // Filter by trip if provided
        if (viagem_id) {
            query = query.eq('viagem_id', viagem_id);
        }

        const { data: passengers, error: fetchError } = await query.order('nome_completo');

        if (fetchError) {
            console.error('Error fetching passengers:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch passenger data' });
        }

        // Fetch trip name if filtered
        let fileNamePrefix = 'lista-passageiros';
        if (viagem_id) {
            const { data: trip } = await supabase
                .from('viagens')
                .select('nome, destino')
                .eq('id', viagem_id)
                .single();
            if (trip) {
                fileNamePrefix = `lista-${trip.nome.replace(/\s+/g, '-').toLowerCase()}`;
            }
        }

        // Process data for export using selected fields
        const processedPassengers = passengers?.map(p => {
            const row: any = {};
            selectedFields.forEach(field => {
                const dbColumn = columnMap[field];
                const value = p[dbColumn];

                if (field === 'Status') {
                    row[field] = value === 'paid' ? 'Pago' : value === 'pending' ? 'Pendente' : value || '-';
                } else if (field === 'Valor Pago') {
                    row[field] = value ? `R$ ${parseFloat(value).toFixed(2)}` : 'R$ 0,00';
                } else {
                    row[field] = value || '-';
                }
            });
            return row;
        }) || [];

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Create worksheet
        let wsPassengers;
        if (processedPassengers.length === 0) {
            wsPassengers = XLSX.utils.aoa_to_sheet([selectedFields]);
        } else {
            wsPassengers = XLSX.utils.json_to_sheet(processedPassengers, { header: selectedFields });
        }

        // Adjust column widths based on content/headers
        const wscols = selectedFields.map(field => {
            if (field === 'Nome') return { wch: 40 };
            if (field === 'Documento') return { wch: 20 };
            if (field === 'Congregação') return { wch: 25 };
            return { wch: 15 };
        });
        wsPassengers['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, wsPassengers, "Passageiros");

        // Generate Excel file
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        const date = new Date().toISOString().split('T')[0];
        const fileName = `${fileNamePrefix}-${date}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        return res.status(200).send(excelBuffer);

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
