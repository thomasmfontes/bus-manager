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
        congregacao: '',
        idade: '',
        estadoCivil: '',
        instrumento: '',
        auxiliar: '',
        statusPagamento: 'pending',
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
                    congregacao: passenger.congregacao || '',
                    idade: passenger.idade || '',
                    estadoCivil: passenger.estadoCivil || '',
                    instrumento: passenger.instrumento || '',
                    auxiliar: passenger.auxiliar || '',
                    statusPagamento: passenger.statusPagamento || 'pending',
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
        <div className="space-y-6 w-full">
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

            <Card className="w-full">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Nome Completo"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />

                        <Input
                            label="CPF ou RG"
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

                        <Input
                            label="Congregação"
                            value={formData.congregacao}
                            onChange={(e) => setFormData({ ...formData, congregacao: e.target.value })}
                            placeholder="Ex: Água Rasa"
                        />

                        <Input
                            label="Idade"
                            value={formData.idade}
                            onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                            placeholder="Ex: 25"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Estado Civil
                            </label>
                            <select
                                value={formData.estadoCivil}
                                onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                                className="input-base"
                            >
                                <option value="">Selecione...</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                                <option value="Divorciado(a)">Divorciado(a)</option>
                                <option value="Viúvo(a)">Viúvo(a)</option>
                            </select>
                        </div>

                        <Input
                            label="Instrumento"
                            value={formData.instrumento}
                            onChange={(e) => setFormData({ ...formData, instrumento: e.target.value })}
                            placeholder="Ex: Violino, Piano..."
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Auxiliar
                            </label>
                            <select
                                value={formData.auxiliar}
                                onChange={(e) => setFormData({ ...formData, auxiliar: e.target.value })}
                                className="input-base"
                            >
                                <option value="">Selecione...</option>
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Status de Pagamento
                            </label>
                            <select
                                value={formData.statusPagamento}
                                onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value })}
                                className="input-base"
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>

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
