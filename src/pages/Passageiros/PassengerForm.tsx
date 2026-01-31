import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { useCongregacaoStore } from '@/stores/useCongregacaoStore';
import { useInstrumentoStore } from '@/stores/useInstrumentoStore';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { X, UserPlus, UserCircle, ArrowLeft } from 'lucide-react';

export const PassengerForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { passengers, createPassageiro, updatePassageiro, fetchPassageiros, loading } = usePassengerStore();
    const { congregacoes, fetchCongregacoes } = useCongregacaoStore();
    const {
        instruments: instrumentos,
        categorias,
        fetchInstrumentos,
        fetchCategorias
    } = useInstrumentoStore((state) => ({
        instruments: state.instrumentos,
        categorias: state.categorias,
        fetchInstrumentos: state.fetchInstrumentos,
        fetchCategorias: state.fetchCategorias
    }));
    const { showToast } = useToast();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        nome_completo: '',
        cpf_rg: '',
        telefone: '',
        comum_congregacao: '',
        idade: '',
        estado_civil: '',
        instrumento: '',
        auxiliar: '',
    });

    useEffect(() => {
        fetchCongregacoes();
        fetchCategorias();
        fetchInstrumentos();
        if (isEditing) {
            fetchPassageiros();
        }
    }, [isEditing, fetchPassageiros, fetchCongregacoes, fetchInstrumentos]);

    useEffect(() => {
        if (isEditing && id) {
            const passenger = passengers.find((p) => p.id === id);
            if (passenger) {
                setFormData({
                    nome_completo: passenger.nome_completo,
                    cpf_rg: passenger.cpf_rg,
                    telefone: passenger.telefone || '',
                    comum_congregacao: passenger.comum_congregacao || '',
                    idade: passenger.idade ? passenger.idade.toString() : '',
                    estado_civil: passenger.estado_civil || '',
                    instrumento: passenger.instrumento || '',
                    auxiliar: passenger.auxiliar || '',
                });
            }
        }
    }, [isEditing, id, passengers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const passengerData = {
                ...formData,
                idade: formData.idade ? parseInt(formData.idade) : undefined,
            };

            if (isEditing && id) {
                await updatePassageiro(id, passengerData);
                showToast('Passageiro atualizado com sucesso!', 'success');
            } else {
                await createPassageiro(passengerData);
                showToast('Passageiro cadastrado com sucesso!', 'success');
            }
            navigate('/passageiros');
        } catch (error) {
            showToast(`Erro ao ${isEditing ? 'atualizar' : 'cadastrar'} passageiro`, 'error');
        }
    };

    return (
        <div className="space-y-6 w-full fade-in duration-500">
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
                            value={formData.nome_completo}
                            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />

                        <Input
                            label="CPF ou RG"
                            value={formData.cpf_rg}
                            onChange={(e) => setFormData({ ...formData, cpf_rg: e.target.value })}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Congregação
                            </label>
                            <select
                                value={formData.comum_congregacao}
                                onChange={(e) => setFormData({ ...formData, comum_congregacao: e.target.value })}
                                className="input-base"
                            >
                                <option value="">Selecione...</option>
                                {congregacoes.map((cong) => (
                                    <option key={cong.id} value={cong.nome}>
                                        {cong.nome}
                                    </option>
                                ))}
                            </select>
                        </div>

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
                                value={formData.estado_civil}
                                onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                                className="input-base"
                            >
                                <option value="">Selecione...</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Instrumento
                            </label>
                            <select
                                value={formData.instrumento}
                                onChange={(e) => setFormData({ ...formData, instrumento: e.target.value })}
                                className="input-base"
                            >
                                <option value="">Selecione...</option>
                                <option value="Não toco">Não toco</option>
                                {categorias.map((categoria) => {
                                    const instrumentsInCategory = instrumentos.filter(i => i.categoria_id === categoria.id);
                                    if (instrumentsInCategory.length === 0) return null;

                                    return (
                                        <optgroup key={categoria.id} label={categoria.nome}>
                                            {instrumentsInCategory.map((inst) => (
                                                <option key={inst.id} value={inst.nome}>
                                                    {inst.nome}
                                                </option>
                                            ))}
                                        </optgroup>
                                    );
                                })}
                            </select>
                        </div>

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
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/passageiros')}
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
                            {isEditing ? <UserCircle size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
                            {loading ? (isEditing ? 'Atualizando...' : 'Salvando...') : (isEditing ? 'Atualizar Passageiro' : 'Salvar Passageiro')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div >
    );
};
