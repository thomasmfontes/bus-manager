import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useTripStore } from '@/stores/useTripStore';
import { Database, Download, FileSpreadsheet, RefreshCw, Circle } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';

const AVAILABLE_FIELDS = [
    'Nome',
    'Documento',
    'Telefone',
    'Congregação',
    'Status',
    'Assento',
    'Instrumento',
    'Idade',
    'Valor Pago',
    'Estado Civil',
    'Auxiliar'
];

export const DataManagement: React.FC = () => {
    const { showToast } = useToast();
    const { trips, fetchViagens } = useTripStore();
    const [exporting, setExporting] = useState(false);
    const [normalizing, setNormalizing] = useState(false);
    const [selectedFields, setSelectedFields] = useState<string[]>(['Nome', 'Documento', 'Telefone', 'Congregação', 'Status', 'Assento']);
    const [selectedTripId, setSelectedTripId] = useState<string>('all');
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    React.useEffect(() => {
        if (trips.length === 0) {
            fetchViagens();
        }
    }, [fetchViagens, trips.length]);

    const toggleField = (field: string) => {
        setSelectedFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const handleExportData = async () => {
        if (selectedFields.length === 0) {
            showToast('Selecione pelo menos um campo para exportar', 'error');
            return;
        }

        setExporting(true);
        try {
            // Get current session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Você precisa estar autenticado', 'error');
                return;
            }

            // Call secure API endpoint
            // Call secure API endpoint with selection
            const queryParams = new URLSearchParams();
            queryParams.append('fields', selectedFields.join(','));
            if (selectedTripId !== 'all') {
                queryParams.append('viagem_id', selectedTripId);
            }

            const response = await fetch(`/api/data/export?${queryParams.toString()}`, {
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

    const handleNormalizeStatus = async () => {
        setNormalizing(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                showToast('Você precisa estar autenticado', 'error');
                return;
            }

            let query = supabase
                .from('passageiros')
                .update({ pagamento: 'pending' })
                .eq('pagamento', 'Realizado');

            // Apply filter only if a specific trip is selected
            if (selectedTripId !== 'all') {
                query = query.eq('viagem_id', selectedTripId);
            } else {
                // Safeguard: Do not allow global reset without explicit trip selection
                showToast('Selecione uma viagem específica para reiniciar os status', 'error');
                return;
            }

            const { data, error } = await query.select();

            if (error) throw error;

            showToast(`${data?.length || 0} registros reiniciados com sucesso!`, 'success');
            setShowConfirmReset(false);
        } catch (error: any) {
            console.error('Error normalizing data:', error);
            showToast(`Erro ao reiniciar: ${error.message || 'Erro desconhecido'}`, 'error');
        } finally {
            setNormalizing(false);
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-sm shrink-0">
                        <Database className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Gerenciamento de Dados</h2>
                        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Exportação de dados</p>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50/50 rounded-xl border border-green-100 hover:border-green-200 transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                    <FileSpreadsheet size={20} className="text-green-600 shrink-0" />
                                    <span>Lista de Passageiros</span>
                                </h3>
                                <p className="text-sm text-gray-600">
                                </p>
                            </div>
                        </div>

                        {/* Customization Options */}
                        <div className="mt-6 space-y-6 animate-in">
                            {/* Trip Filter */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Database size={16} className="text-gray-400" />
                                    <span>Filtrar por Viagem</span>
                                </label>
                                <select
                                    value={selectedTripId}
                                    onChange={(e) => setSelectedTripId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                >
                                    <option value="all">Todas as Viagens (Lista Completa)</option>
                                    {trips.map(trip => (
                                        <option key={trip.id} value={trip.id}>
                                            {trip.nome} → {trip.destino}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Field Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Escolha os Dados para Exportar
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {AVAILABLE_FIELDS.map(field => {
                                        const selectedIndex = selectedFields.indexOf(field);
                                        const isSelected = selectedIndex !== -1;
                                        return (
                                            <button
                                                key={field}
                                                onClick={() => toggleField(field)}
                                                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${isSelected
                                                    ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200'
                                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {isSelected ? (
                                                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-green-600 text-white text-[10px] font-bold shrink-0">
                                                        {selectedIndex + 1}
                                                    </div>
                                                ) : (
                                                    <Circle size={14} className="text-gray-300 shrink-0" />
                                                )}
                                                <span className="truncate">{field}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 italic">
                                    * A ordem das colunas no Excel seguirá a numeração acima.
                                </p>
                            </div>

                            {/* Export Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleExportData}
                                    disabled={exporting}
                                    className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <Download size={20} className={exporting ? 'animate-bounce' : ''} />
                                    <span>{exporting ? 'Baixando...' : 'Baixar Excel'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl border border-blue-100 hover:border-blue-200 transition-all">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                                    <RefreshCw size={20} className="text-blue-600 shrink-0" />
                                    <span>Reiniciar Status de Pagamento</span>
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Converte status "Realizado" para "Pendente" para a viagem selecionada
                                </p>
                            </div>
                            <button
                                onClick={() => setShowConfirmReset(true)}
                                disabled={normalizing || selectedTripId === 'all'}
                                title={selectedTripId === 'all' ? "Selecione uma viagem para habilitar esta opção" : "Reiniciar"}
                                className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <RefreshCw size={20} className={normalizing ? 'animate-spin' : ''} />
                                <span className="text-sm">{normalizing ? 'Processando...' : 'Reiniciar'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            <ConfirmModal
                isOpen={showConfirmReset}
                onClose={() => setShowConfirmReset(false)}
                onConfirm={handleNormalizeStatus}
                title="Reiniciar Status de Pagamento"
                message={`Deseja converter todos os status "Realizado" para "Pendente" na viagem "${trips.find(t => t.id === selectedTripId)?.nome || '(Selecione uma viagem)'}"? Esta ação não pode ser desfeita.`}
            />
        </div>
    );
};
