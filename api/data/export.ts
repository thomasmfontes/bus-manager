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

        // Create Supabase client with anon key to verify user
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Verify user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch passengers data (using anon key is fine since RLS allows authenticated reads)
        const { data: passengers, error: fetchError } = await supabase
            .from('excursao_passengers')
            .select('*')
            .order('full_name');

        if (fetchError) {
            console.error('Error fetching passengers:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch passenger data' });
        }

        // Process data for export
        const processedPassengers = passengers?.map(p => ({
            Nome: p.full_name,
            Documento: p.cpf || p.rg || '-',
        })) || [];

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Define headers explicitly
        const headers = ['Nome', 'Documento'];

        // Create worksheet
        let wsPassengers;
        if (processedPassengers.length === 0) {
            wsPassengers = XLSX.utils.aoa_to_sheet([headers]);
        } else {
            wsPassengers = XLSX.utils.json_to_sheet(processedPassengers, { header: headers });
        }

        // Adjust column widths
        const wscols = [
            { wch: 40 }, // Nome
            { wch: 25 }, // Documento
        ];
        wsPassengers['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, wsPassengers, "Passageiros");

        // Generate Excel file as buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for file download
        const fileName = `lista-passageiros-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        // Send file
        return res.status(200).send(excelBuffer);

    } catch (error: any) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
