import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useToast } from '@/components/ui/Toast';
import { Save, RefreshCw, FileSpreadsheet, Info } from 'lucide-react';

export const Settings: React.FC = () => {
    const [clientId, setClientId] = useState('');
    const [spreadsheetId, setSpreadsheetId] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const { syncFromGoogleSheets } = usePassengerStore();
    const { showToast } = useToast();

    useEffect(() => {
        const savedClientId = localStorage.getItem('google_client_id');
        const savedSpreadsheetId = localStorage.getItem('google_spreadsheet_id');
        if (savedClientId) setClientId(savedClientId);
        if (savedSpreadsheetId) setSpreadsheetId(savedSpreadsheetId);
    }, []);

    const handleSave = () => {
        localStorage.setItem('google_client_id', clientId);
        localStorage.setItem('google_spreadsheet_id', spreadsheetId);
        showToast('Configurações salvas!', 'success');
    };

    const handleSync = async () => {
        if (!clientId || !spreadsheetId) {
            showToast('Preencha os campos primeiro', 'error');
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncFromGoogleSheets(clientId, spreadsheetId);
            showToast(`${result.success} passageiros sincronizados!`, 'success');
        } catch (error) {
            showToast('Erro ao sincronizar', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Integração com Google Sheets</p>
            </div>

            {/* Main Card */}
            <Card>
                <div className="space-y-5">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2.5 bg-green-50 rounded-lg">
                            <FileSpreadsheet className="text-green-600" size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Google Sheets</h2>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">Sincronize dados automaticamente</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Client ID
                            </label>
                            <input
                                type="text"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                placeholder="123456789-abc...apps.googleusercontent.com"
                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                ID da Planilha
                            </label>
                            <input
                                type="text"
                                value={spreadsheetId}
                                onChange={(e) => setSpreadsheetId(e.target.value)}
                                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <Button
                            onClick={handleSave}
                            variant="secondary"
                            className="flex-1 sm:flex-initial justify-center text-sm"
                        >
                            <Save size={18} className="mr-2" />
                            Salvar
                        </Button>

                        <Button
                            onClick={handleSync}
                            disabled={isSyncing || !clientId || !spreadsheetId}
                            className="flex-1 sm:flex-initial justify-center text-sm"
                        >
                            <RefreshCw size={18} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Help Card */}
            <Card className="bg-blue-50/50 border-blue-100">
                <div className="flex gap-3">
                    <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-blue-900 space-y-2">
                        <p className="font-medium">Como configurar?</p>
                        <ol className="list-decimal pl-4 space-y-1 text-blue-800">
                            <li>Crie um projeto no Google Cloud Console</li>
                            <li>Ative a "Google Sheets API"</li>
                            <li>Crie credenciais OAuth 2.0 (Web)</li>
                            <li>Adicione <code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs">{window.location.origin}</code> nas origens</li>
                            <li>Cole o Client ID e ID da Planilha acima</li>
                        </ol>
                    </div>
                </div>
            </Card>
        </div>
    );
};
