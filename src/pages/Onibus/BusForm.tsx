import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Save, X, Bus as BusIcon, Plus } from 'lucide-react';

export const BusForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { buses, createOnibus, updateOnibus, fetchOnibus, loading } = useBusStore();
    const { showToast } = useToast();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        nome: '',
        placa: '',
        capacidade: 46,
    });

    useEffect(() => {
        if (isEditing) {
            fetchOnibus();
        }
    }, [isEditing, fetchOnibus]);

    useEffect(() => {
        if (isEditing && id) {
            const bus = buses.find((b) => b.id === id);
            if (bus) {
                setFormData({
                    nome: bus.nome,
                    placa: bus.placa || '',
                    capacidade: bus.capacidade || 46,
                });
            }
        }
    }, [isEditing, id, buses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const busData = {
            nome: formData.nome,
            placa: formData.placa,
            capacidade: formData.capacidade,
        };

        try {
            if (isEditing && id) {
                await updateOnibus(id, busData);
                showToast('Ônibus atualizado com sucesso!', 'success');
            } else {
                await createOnibus(busData);
                showToast('Ônibus cadastrado com sucesso!', 'success');
            }
            navigate('/onibus');
        } catch (error) {
            showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} ônibus`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-dark">
                {isEditing ? 'Editar Ônibus' : 'Novo Ônibus'}
            </h1>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome do Ônibus"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Ônibus 1 - Leito"
                        required
                    />

                    <Input
                        label="Placa"
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        placeholder="Ex: ABC-1234"
                        required
                    />

                    <Input
                        type="number"
                        label="Capacidade (Total de Assentos)"
                        value={formData.capacidade}
                        onChange={(e) =>
                            setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })
                        }
                        min="1"
                        required
                    />

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/onibus')}
                            className="w-full sm:flex-1 py-3 text-base"
                        >
                            <X size={20} className="mr-2" />
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full sm:flex-1 py-3 text-base shadow-lg shadow-blue-200"
                        >
                            {isEditing ? <BusIcon size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                            {loading ? (isEditing ? 'Atualizando...' : 'Salvando...') : (isEditing ? 'Atualizar Ônibus' : 'Salvar Ônibus')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
