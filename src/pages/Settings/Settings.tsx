import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useToast } from '@/components/ui/Toast';
import { Save, RefreshCw, FileSpreadsheet, HelpCircle } from 'lucide-react';

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
        showToast('Configurações salvas com sucesso!', 'success');
    };

    const handleSync = async () => {
        if (!clientId || !spreadsheetId) {
            showToast('Preencha o Client ID e o ID da Planilha', 'error');
            return;
        }

        setIsSyncing(true);
        try {
            const result = await syncFromGoogleSheets(clientId, spreadsheetId);
            showToast(`Sincronização concluída! ${result.success} atualizados/criados.`, 'success');
        } catch (error) {
            showToast('Erro ao sincronizar. Verifique as permissões e o console.', 'error');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">Configurações</h1>

            <Card className="max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <FileSpreadsheet className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Integração Google Sheets</h2>
                        <p className="text-sm text-gray-500">Sincronize passageiros de uma planilha privada</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Google Client ID
                        </label>
                        <input
                            type="text"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="ex: 123456789-abc...apps.googleusercontent.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Obtido no Google Cloud Console (Credenciais OAuth 2.0)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID da Planilha
                        </label>
                        <input
                            type="text"
                            value={spreadsheetId}
                            onChange={(e) => setSpreadsheetId(e.target.value)}
                            placeholder="ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            O código longo na URL da sua planilha
                        </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                        <Button onClick={handleSave} variant="secondary">
                            <Save size={20} className="mr-2" />
                            Salvar Configuração
                        </Button>

                        <Button
                            onClick={handleSync}
                            disabled={isSyncing || !clientId || !spreadsheetId}
                            className={isSyncing ? 'opacity-75 cursor-not-allowed' : ''}
                        >
                            <RefreshCw size={20} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                        </Button>
                    </div>
                </div>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                        <HelpCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                        <div className="text-sm text-blue-800 space-y-2">
                            <p className="font-semibold">Como configurar?</p>
                            <ol className="list-decimal pl-4 space-y-1">
                                <li>Crie um projeto no Google Cloud Console.</li>
                                <li>Ative a "Google Sheets API".</li>
                                <li>Crie credenciais OAuth 2.0 (Aplicativo Web).</li>
                                <li>Adicione <code>{window.location.origin}</code> nas origens autorizadas.</li>
                                <li>Copie o Client ID acima.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
