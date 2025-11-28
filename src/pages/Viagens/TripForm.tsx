import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export const TripForm: React.FC = () => {
    const navigate = useNavigate();
    const { createViagem } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        origem: '',
        destino: '',
        data: '',
        onibusIds: [] as string[],
        descricao: '',
    });

    useEffect(() => {
        fetchOnibus();
    }, [fetchOnibus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.onibusIds.length === 0) {
            showToast('Selecione pelo menos um ônibus', 'error');
            return;
        }

        try {
            // Envia a data diretamente no formato datetime-local
            // O Supabase vai interpretar como timestamp local
            await createViagem(formData);
            showToast('Viagem cadastrada com sucesso!', 'success');
            navigate('/viagens');
        } catch (error) {
            showToast('Erro ao cadastrar viagem', 'error');
        }
    };

    const toggleBus = (busId: string) => {
        setFormData(prev => {
            const currentIds = prev.onibusIds;
            if (currentIds.includes(busId)) {
                return { ...prev, onibusIds: currentIds.filter(id => id !== busId) };
            } else {
                return { ...prev, onibusIds: [...currentIds, busId] };
            }
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">Nova Viagem</h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Origem"
                            value={formData.origem}
                            onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                            placeholder="Ex: São Paulo"
                            required
                        />

                        <Input
                            label="Destino"
                            value={formData.destino}
                            onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                            placeholder="Ex: Rio de Janeiro"
                            required
                        />
                    </div>

                    <Input
                        type="datetime-local"
                        label="Data e Hora"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Ônibus (Selecione um ou mais)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
                            {buses.map((bus) => (
                                <label key={bus.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.onibusIds.includes(bus.id)}
                                        onChange={() => toggleBus(bus.id)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm text-gray-700">
                                        {bus.nome} - {bus.placa} ({bus.totalAssentos} lug.)
                                    </span>
                                </label>
                            ))}
                            {buses.length === 0 && (
                                <p className="text-gray-500 text-sm p-2">Nenhum ônibus cadastrado.</p>
                            )}
                        </div>
                    </div>

                    <Input
                        label="Descrição (opcional)"
                        value={formData.descricao}
                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        placeholder="Ex: Viagem executiva com paradas"
                    />

                    <div className="flex gap-3">
                        <Button type="submit">Salvar</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/viagens')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
