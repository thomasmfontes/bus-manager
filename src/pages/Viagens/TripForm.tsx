import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BusMultiSelect } from '@/components/ui/BusMultiSelect';
import { useToast } from '@/components/ui/Toast';

export const TripForm: React.FC = () => {
    const navigate = useNavigate();
    const { createViagem } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        nome: '',
        destino: '',
        data_ida: '',
        data_volta: '',
        preco: '' as string | number,
        onibus_ids: [] as string[],
    });

    useEffect(() => {
        fetchOnibus();
    }, [fetchOnibus]);

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
            });
            showToast('Viagem cadastrada com sucesso!', 'success');
            navigate('/viagens');
        } catch (error) {
            showToast('Erro ao cadastrar viagem', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">Nova Viagem</h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="datetime-local"
                            label="Data de Ida"
                            value={formData.data_ida}
                            onChange={(e) => setFormData({ ...formData, data_ida: e.target.value })}
                            required
                        />
                        <Input
                            type="datetime-local"
                            label="Data de Volta (Opcional)"
                            value={formData.data_volta}
                            onChange={(e) => setFormData({ ...formData, data_volta: e.target.value })}
                        />
                    </div>

                    <Input
                        type="number"
                        label="Preço"
                        value={formData.preco}
                        onChange={(e) => setFormData({ ...formData, preco: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                    />


                    <BusMultiSelect
                        buses={buses}
                        selectedBusIds={formData.onibus_ids}
                        onChange={(busIds) => setFormData({ ...formData, onibus_ids: busIds })}
                        label="Ônibus"
                        required
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
