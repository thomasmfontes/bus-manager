import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { X, Bus as BusIcon, Plus, ArrowLeft } from 'lucide-react';

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
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/onibus')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm group"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        {isEditing ? 'Editar Ônibus' : 'Novo Ônibus'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEditing ? 'Atualize as informações da frota' : 'Cadastre um novo veículo no sistema'}
                    </p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome do Ônibus"
                        labelClassName="font-bold ml-1"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Ônibus 1 - Leito"
                        required
                    />

                    <Input
                        label="Placa"
                        labelClassName="font-bold ml-1"
                        value={formData.placa}
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                        placeholder="Ex: ABC-1234"
                    />

                    <Input
                        type="number"
                        label="Capacidade (Total de Assentos)"
                        labelClassName="font-bold ml-1"
                        value={formData.capacidade}
                        onChange={(e) =>
                            setFormData({ ...formData, capacidade: parseInt(e.target.value) || 0 })
                        }
                        min="1"
                        required
                    />

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/onibus')}
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
                            {isEditing ? <BusIcon size={20} className="mr-2" /> : <Plus size={20} className="mr-2" />}
                            {loading ? (isEditing ? 'Atualizando...' : 'Salvando...') : (isEditing ? 'Atualizar Dados' : 'Cadastrar Ônibus')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
