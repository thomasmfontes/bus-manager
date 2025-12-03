import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Database, Download, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

export const DataManagement: React.FC = () => {
    const { showToast } = useToast();
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            // Fetch only passengers
            const { data: passengers, error } = await supabase
                .from('excursao_passengers')
                .select('*')
                .order('full_name');

            if (error) throw error;

            if (!passengers || passengers.length === 0) {
                showToast('Nenhum passageiro encontrado para exportar.', 'error');
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

            // Generate file
            XLSX.writeFile(wb, `lista-passageiros-${new Date().toISOString().split('T')[0]}.xlsx`);

            if (processedPassengers.length > 0) {
                showToast('Lista de passageiros baixada com sucesso!', 'success');
            }
        } catch (error: any) {
            console.error('Error exporting data:', error);
            showToast(`Erro ao exportar: ${error.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Database className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Gerenciamento de Dados</h2>
                        <p className="text-gray-500 text-sm">Exportação de dados</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <FileSpreadsheet size={18} className="text-green-600" />
                                    Lista de Passageiros (Excel)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Baixe a lista completa de passageiros em formato Excel (.xlsx).
                                </p>
                            </div>
                            <button
                                onClick={handleExportData}
                                disabled={exporting}
                                title="Baixar Lista"
                                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
                            >
                                <Download size={24} className={exporting ? 'animate-bounce' : ''} />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
