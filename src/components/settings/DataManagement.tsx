import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Database, Download, FileJson } from 'lucide-react';

export const DataManagement: React.FC = () => {
    const { showToast } = useToast();
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            // Fetch all data
            const { data: passengers } = await supabase.from('excursao_passengers').select('*');
            const { data: buses } = await supabase.from('buses').select('*');
            const { data: trips } = await supabase.from('trips').select('*');
            const { data: assignments } = await supabase.from('seat_assignments').select('*');

            const backupData = {
                timestamp: new Date().toISOString(),
                passengers: passengers || [],
                buses: buses || [],
                trips: trips || [],
                seat_assignments: assignments || [],
            };

            // Create blob and download
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bus-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Backup baixado com sucesso!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            showToast('Erro ao exportar dados', 'error');
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
                        <p className="text-gray-500 text-sm">Faça backup dos seus dados</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <FileJson size={18} className="text-gray-500" />
                                    Exportar Dados (JSON)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Baixe uma cópia completa de todos os passageiros, ônibus e viagens.
                                    Útil para backups manuais.
                                </p>
                            </div>
                            <button
                                onClick={handleExportData}
                                disabled={exporting}
                                title="Baixar Backup"
                                className="h-12 w-12 shrink-0 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
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
