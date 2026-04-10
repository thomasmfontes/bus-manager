import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BusMultiSelect } from '@/components/ui/BusMultiSelect';
import { useToast } from '@/components/ui/Toast';
import { X, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { BusInlineForm } from '@/components/onibus/BusInlineForm';
import { Spinner } from '@/components/ui/Spinner';

export const TripForm: React.FC = () => {
    const navigate = useNavigate();
    const { createViagem, trips, fetchViagens, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        nome: '',
        destino: '',
        data_ida: '',
        data_volta: '',
        preco: '' as string | number,
        onibus_ids: [] as string[],
        origem_endereco: '',
        destino_endereco: '',
        meta_financeira: '' as string | number,
        requires_approval: false,
    });

    const [isBusModalOpen, setIsBusModalOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsInitialLoading(true);
            await Promise.all([fetchOnibus(), fetchViagens()]);
            setIsInitialLoading(false);
        };
        loadInitialData();
    }, [fetchOnibus, fetchViagens]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.onibus_ids || formData.onibus_ids.length === 0) {
            showToast('Selecione pelo menos um ônibus', 'error');
            return;
        }

        if (!formData.data_ida) {
            showToast('Informe a data de ida', 'error');
            return;
        }

        const preco = typeof formData.preco === 'string' ? parseFloat(formData.preco) : formData.preco;

        if (isNaN(preco) || preco <= 0) {
            showToast('Informe um preço válido', 'error');
            return;
        }

        const formatWithOffset = (dateString: string) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            const tzo = -date.getTimezoneOffset();
            const dif = tzo >= 0 ? '+' : '-';
            const pad = (num: number) => (num < 10 ? '0' : '') + num;
            const offset = dif + pad(Math.floor(Math.abs(tzo) / 60)) + ':' + pad(Math.abs(tzo) % 60);
            return `${dateString.replace('T', ' ')}:00${offset}`;
        };

        try {
            await createViagem({
                nome: formData.nome,
                destino: formData.destino,
                data_ida: formatWithOffset(formData.data_ida) || '',
                data_volta: formatWithOffset(formData.data_volta) || undefined,
                preco,
                onibus_ids: formData.onibus_ids,
                origem_endereco: formData.origem_endereco,
                destino_endereco: formData.destino_endereco,
                meta_financeira: typeof formData.meta_financeira === 'string' ? parseFloat(formData.meta_financeira) || 0 : formData.meta_financeira,
                requires_approval: formData.requires_approval,
            });
            showToast('Viagem cadastrada com sucesso!', 'success');
            navigate('/viagens');
        } catch (error) {
            showToast('Erro ao cadastrar viagem', 'error');
        }
    };

    return (
        <div className="space-y-6 fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/viagens')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm group"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        Nova Viagem
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Cadastre um novo itinerário e organize os passageiros
                    </p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nome da Viagem (Origem)"
                            labelClassName="font-bold ml-1"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Excursão Aparecida"
                            required
                        />

                        <Input
                            label="Destino"
                            labelClassName="font-bold ml-1"
                            value={formData.destino}
                            onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                            placeholder="Ex: Aparecida do Norte"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="datetime-local"
                            label="Data de Ida"
                            labelClassName="font-bold ml-1"
                            value={formData.data_ida}
                            onChange={(e) => setFormData({ ...formData, data_ida: e.target.value })}
                            required
                        />
                        <Input
                            type="datetime-local"
                            label="Data de Volta (Opcional)"
                            labelClassName="font-bold ml-1"
                            value={formData.data_volta}
                            onChange={(e) => setFormData({ ...formData, data_volta: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Endereço de Saída Precisão (Opcional)"
                            labelClassName="font-bold ml-1"
                            value={formData.origem_endereco}
                            onChange={(e) => setFormData({ ...formData, origem_endereco: e.target.value })}
                            placeholder="Ex: Rua X, 123, Bairro, Cidade, SP"
                        />
                        <Input
                            label="Endereço de Destino Precisão (Opcional)"
                            labelClassName="font-bold ml-1"
                            value={formData.destino_endereco}
                            onChange={(e) => setFormData({ ...formData, destino_endereco: e.target.value })}
                            placeholder="Ex: Av. Y, 456, Centro, Cidade, UF"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Preço por Pessoa"
                            labelClassName="font-bold ml-1"
                            value={formData.preco}
                            onChange={(e) => setFormData({ ...formData, preco: e.target.value ? parseFloat(e.target.value) : '' })}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                        />
                        <Input
                            type="number"
                            label="Meta Financeira Total (Opcional)"
                            labelClassName="font-bold ml-1"
                            value={formData.meta_financeira}
                            onChange={(e) => setFormData({ ...formData, meta_financeira: e.target.value ? parseFloat(e.target.value) : '' })}
                            placeholder="Ex: 2500.00"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mt-4">
                        <div className="flex items-center h-5 mt-1">
                            <input
                                id="requires_approval"
                                type="checkbox"
                                checked={formData.requires_approval}
                                onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-[var(--accent-color)] focus:ring-[var(--accent-color)] cursor-pointer"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="requires_approval" className="text-sm font-bold text-gray-900 cursor-pointer">
                                Exige Aprovação do Organizador
                            </label>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                Se marcado, os passageiros ficarão em uma lista de espera e não ocuparão lugares até a aprovação manual.
                            </p>
                        </div>
                    </div>



                    {(() => {
                        if (isInitialLoading) {
                            return (
                                <div className="space-y-2">
                                    <label className="block text-sm text-gray-700 font-bold ml-1">
                                        Selecione os Ônibus *
                                    </label>
                                    <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded-xl flex flex-col items-center justify-center">
                                        <Spinner size="lg" text="Carregando frota disponível..." />
                                    </div>
                                </div>
                            );
                        }

                        const now = new Date();
                        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

                        // Only consider buses "occupied" if the trip is active (departed < 24h ago or in future)
                        const occupiedBusIds = new Set(
                            trips
                                .filter(t => new Date(t.data_ida) >= twentyFourHoursAgo)
                                .flatMap(t => t.onibus_ids || (t.onibus_id ? [t.onibus_id] : []))
                        );

                        const availableBuses = buses.filter(b => !occupiedBusIds.has(b.id));

                        return availableBuses.length === 0 ? (
                            <div className="p-8 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-orange-900">Nenhum ônibus disponível</p>
                                    <p className="text-xs text-orange-700 max-w-[200px] mx-auto">
                                        Todos os ônibus cadastrados já estão ocupados em outras viagens.
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    type="button"
                                    className="bg-white border-orange-200 text-orange-600 hover:bg-orange-50 w-full sm:w-auto mx-auto"
                                    onClick={() => setIsBusModalOpen(true)}
                                >
                                    <Plus size={16} className="mr-2" />
                                    Criar Novo Ônibus
                                </Button>
                            </div>
                        ) : (
                            <BusMultiSelect
                                buses={availableBuses}
                                selectedBusIds={formData.onibus_ids}
                                onChange={(busIds) => setFormData({ ...formData, onibus_ids: busIds })}
                                label="Selecione os Ônibus"
                                labelClassName="font-bold ml-1 text-gray-700"
                                required
                                actionRight={
                                    <button
                                        type="button"
                                        onClick={() => setIsBusModalOpen(true)}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
                                        title="Cadastrar Novo Ônibus"
                                    >
                                        <Plus size={18} />
                                    </button>
                                }
                            />
                        );
                    })()}

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/viagens')}
                            className="h-12 flex-1 rounded-xl shadow-sm hover:shadow-md transition-all font-bold"
                        >
                            <X size={20} className="mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            className="h-12 flex-[2] rounded-xl shadow-lg transition-all font-bold"
                        >
                            <Plus size={20} className="mr-2" />
                            {loading ? 'Salvando...' : 'Cadastrar Viagem'}
                        </Button>
                    </div>
                </form>
            </Card>

            <BusInlineForm
                isOpen={isBusModalOpen}
                onClose={() => setIsBusModalOpen(false)}
                onSuccess={(newBusId) => {
                    // Update the form data to include the new selected bus
                    if (newBusId) {
                        setFormData((prev) => ({
                            ...prev,
                            onibus_ids: [...prev.onibus_ids, newBusId]
                        }));
                    }
                    setIsBusModalOpen(false);
                }}
            />
        </div>
    );
};
