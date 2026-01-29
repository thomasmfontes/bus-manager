import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { useToast } from '@/components/ui/Toast';
import { Save, Bus as BusIcon, Info, Trash2, Plus, AlertCircle } from 'lucide-react';

interface TripEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: Trip;
    onSuccess?: () => void;
}

export const TripEditModal: React.FC<TripEditModalProps> = ({ isOpen, onClose, trip, onSuccess }) => {
    const navigate = useNavigate();
    const { updateViagem, trips, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'info' | 'buses'>('info');

    const formatForDateTimeLocal = (dateInput: string | Date | undefined) => {
        if (!dateInput) return '';
        const d = new Date(dateInput);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        nome: trip.nome,
        destino: trip.destino,
        data_ida: formatForDateTimeLocal(trip.data_ida),
        data_volta: formatForDateTimeLocal(trip.data_volta),
        preco: trip.preco,
        onibus_ids: [...(trip.onibus_ids || [])],
        origem_endereco: trip.origem_endereco || '',
        destino_endereco: trip.destino_endereco || '',
        meta_financeira: trip.meta_financeira || 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchOnibus();
            setFormData({
                nome: trip.nome,
                destino: trip.destino,
                data_ida: formatForDateTimeLocal(trip.data_ida),
                data_volta: formatForDateTimeLocal(trip.data_volta),
                preco: trip.preco,
                onibus_ids: [...(trip.onibus_ids || [])],
                origem_endereco: trip.origem_endereco || '',
                destino_endereco: trip.destino_endereco || '',
                meta_financeira: trip.meta_financeira || 0,
            });
        }
    }, [isOpen, trip, fetchOnibus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.onibus_ids.length === 0) {
            showToast('A viagem precisa de pelo menos um ônibus', 'error');
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
            await updateViagem(trip.id, {
                nome: formData.nome,
                destino: formData.destino,
                data_ida: formatWithOffset(formData.data_ida) || '',
                data_volta: formatWithOffset(formData.data_volta) || undefined,
                preco: typeof formData.preco === 'string' ? parseFloat(formData.preco) : formData.preco,
                onibus_ids: formData.onibus_ids,
                origem_endereco: formData.origem_endereco,
                destino_endereco: formData.destino_endereco,
                meta_financeira: typeof formData.meta_financeira === 'string' ? parseFloat(formData.meta_financeira) || 0 : formData.meta_financeira,
            });
            showToast('Viagem atualizada com sucesso!', 'success');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            showToast('Erro ao atualizar viagem', 'error');
        }
    };

    const toggleBus = (busId: string) => {
        setFormData((prev: typeof formData) => ({
            ...prev,
            onibus_ids: prev.onibus_ids.includes(busId)
                ? prev.onibus_ids.filter((id: string) => id !== busId)
                : [...prev.onibus_ids, busId]
        }));
    };

    const tripBuses = buses.filter(b => formData.onibus_ids.includes(b.id));

    // Strict filtering: exclude buses used in ANY other trip
    const otherTrips = trips.filter(t => t.id !== trip.id);
    const busIdsUsedInOtherTrips = new Set(
        otherTrips.flatMap(t => t.onibus_ids || (t.onibus_id ? [t.onibus_id] : []))
    );

    const availableBuses = buses.filter(b =>
        !formData.onibus_ids.includes(b.id) &&
        !busIdsUsedInOtherTrips.has(b.id)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Viagem"
            footer={
                <div className="flex w-full">
                    <Button
                        onClick={handleSubmit}
                        className="w-full py-3 text-base shadow-lg shadow-blue-200"
                        isLoading={loading}
                    >
                        <Save size={20} className="mr-2" />
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 -mx-6 px-6 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 min-w-[120px] py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'info'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Info size={18} />
                            Informações
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('buses')}
                        className={`flex-1 min-w-[120px] py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'buses'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <BusIcon size={18} />
                            Ônibus ({formData.onibus_ids.length})
                        </div>
                    </button>
                </div>

                <div className="min-h-[300px]">
                    {activeTab === 'info' ? (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <Input
                                label="Nome da Viagem (Origem)"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: Excursão Aparecida"
                                required
                            />
                            <Input
                                label="Destino"
                                value={formData.destino}
                                onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                                placeholder="Ex: Aparecida do Norte"
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    type="datetime-local"
                                    label="Data de Ida"
                                    value={formData.data_ida}
                                    onChange={(e) => setFormData({ ...formData, data_ida: e.target.value })}
                                    required
                                />
                                <Input
                                    type="datetime-local"
                                    label="Data de Volta"
                                    value={formData.data_volta}
                                    onChange={(e) => setFormData({ ...formData, data_volta: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Endereço de Saída Precisão"
                                    value={formData.origem_endereco}
                                    onChange={(e) => setFormData({ ...formData, origem_endereco: e.target.value })}
                                    placeholder="Ex: Rua X, 123, Bairro, Cidade, SP"
                                />
                                <Input
                                    label="Endereço de Destino Precisão"
                                    value={formData.destino_endereco}
                                    onChange={(e) => setFormData({ ...formData, destino_endereco: e.target.value })}
                                    placeholder="Ex: Av. Y, 456, Centro, Cidade, UF"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    label="Preço por Pessoa"
                                    value={formData.preco}
                                    onChange={(e) => setFormData({ ...formData, preco: e.target.value ? parseFloat(e.target.value) : 0 })}
                                    placeholder="0.00"
                                    step="0.01"
                                    required
                                />
                                <Input
                                    type="number"
                                    label="Meta Financeira Total"
                                    value={formData.meta_financeira}
                                    onChange={(e) => setFormData({ ...formData, meta_financeira: e.target.value ? parseFloat(e.target.value) : 0 })}
                                    placeholder="Ex: 2500.00"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Current Buses */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        Ônibus Vinculados
                                    </h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                        {tripBuses.length} vinculados
                                    </span>
                                </div>
                                {tripBuses.length === 0 ? (
                                    <div className="p-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                        <BusIcon className="mx-auto text-gray-300 mb-2" size={32} />
                                        <p className="text-sm text-gray-500">Nenhum ônibus vinculado.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {tripBuses.map(bus => (
                                            <div key={bus.id} className="group flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <BusIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{bus.nome}</p>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{bus.placa} • {bus.capacidade} lugares</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleBus(bus.id)}
                                                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Remover ônibus"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Available Buses */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                                    Adicionar Novo Ônibus
                                </h3>
                                {availableBuses.length === 0 ? (
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
                                            className="bg-white border-orange-200 text-orange-600 hover:bg-orange-50 w-full"
                                            onClick={() => navigate('/onibus/novo')}
                                        >
                                            <Plus size={16} className="mr-2" />
                                            Criar Novo Ônibus
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                                        {availableBuses.map(bus => (
                                            <button
                                                key={bus.id}
                                                onClick={() => toggleBus(bus.id)}
                                                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        <BusIcon size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-blue-700">{bus.nome}</p>
                                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-tighter">{bus.placa} • {bus.capacidade} lugares</p>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                                                    <Plus size={20} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
