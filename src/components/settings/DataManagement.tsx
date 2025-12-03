import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Database, Download, FileSpreadsheet } from 'lucide-react';

export const DataManagement: React.FC = () => {
    const { showToast } = useToast();
    const [exporting, setExporting] = useState(false);

    const handleExportData = async () => {
        setExporting(true);
        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Você precisa estar autenticado', 'error');
                return;
            }

            // Call secure API endpoint
            const response = await fetch('/api/data/export', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao exportar dados');
            }

            // Get the file blob
            const blob = await response.blob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lista-passageiros-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast('Lista de passageiros baixada com sucesso!', 'success');
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
