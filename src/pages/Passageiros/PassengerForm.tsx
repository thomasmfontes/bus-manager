import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft } from 'lucide-react';

export const PassengerForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { passengers, createPassageiro, updatePassageiro, fetchPassageiros } = usePassengerStore();
    const { showToast } = useToast();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        nome: '',
        documento: '',
        telefone: '',
    });

    useEffect(() => {
        if (isEditing) {
            fetchPassageiros();
        }
    }, [isEditing, fetchPassageiros]);

    useEffect(() => {
        if (isEditing && id) {
            const passenger = passengers.find((p) => p.id === id);
            if (passenger) {
                setFormData({
                    nome: passenger.nome,
                    documento: passenger.documento,
                    telefone: passenger.telefone,
                });
            }
        }
    }, [isEditing, id, passengers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isEditing && id) {
                await updatePassageiro(id, formData);
                showToast('Passageiro atualizado com sucesso!', 'success');
            } else {
                await createPassageiro(formData);
                showToast('Passageiro cadastrado com sucesso!', 'success');
            }
            navigate('/passageiros');
        } catch (error) {
            showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} passageiro`, 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/passageiros')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditing ? 'Editar Passageiro' : 'Novo Passageiro'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isEditing ? 'Atualize as informações do passageiro' : 'Cadastre um novo passageiro no sistema'}
                    </p>
                </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label="Nome Completo"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: João Silva"
                        required
                    />

                    <Input
                        label="CPF"
                        value={formData.documento}
                        onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                        placeholder="Ex: 123.456.789-00"
                        required
                    />

                    <Input
                        label="Telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="Ex: (11) 98765-4321"
                        required
                    />

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Button type="submit">{isEditing ? 'Atualizar' : 'Salvar'}</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/passageiros')}
                        >
                            Cancelar
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
