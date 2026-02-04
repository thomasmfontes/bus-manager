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
import { calculateAge } from '@/utils/formatters';

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
        data_nascimento: '',
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
                    data_nascimento: passenger.data_nascimento || '',
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
            const calculatedAge = formData.data_nascimento ? calculateAge(formData.data_nascimento) : (formData.idade ? parseInt(formData.idade) : undefined);
            const passengerData = {
                ...formData,
                idade: calculatedAge ?? undefined,
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
        <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/passageiros')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm group"
                    aria-label="Voltar"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                        {isEditing ? 'Editar Passageiro' : 'Novo Passageiro'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {isEditing ? 'Atualize as informações do passageiro' : 'Cadastre um novo passageiro no sistema'}
                    </p>
                </div>
            </div>

            <Card className="w-full">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Input
                            label="Nome Completo"
                            labelClassName="font-bold ml-1"
                            value={formData.nome_completo}
                            onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />

                        <Input
                            label="CPF ou RG"
                            labelClassName="font-bold ml-1"
                            value={formData.cpf_rg}
                            onChange={(e) => setFormData({ ...formData, cpf_rg: e.target.value })}
                            placeholder="Ex: 123.456.789-00"
                            required
                        />

                        <Input
                            label="Telefone"
                            labelClassName="font-bold ml-1"
                            value={formData.telefone}
                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                            placeholder="Ex: (11) 98765-4321"
                            required
                        />

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Congregação
                            </label>
                            <select
                                value={formData.comum_congregacao}
                                onChange={(e) => setFormData({ ...formData, comum_congregacao: e.target.value })}
                                className="w-full h-[46px] px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-medium text-gray-700"
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
                            label="Data de Nascimento"
                            labelClassName="font-bold ml-1"
                            type="date"
                            value={formData.data_nascimento}
                            onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                        />

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Estado Civil
                            </label>
                            <select
                                value={formData.estado_civil}
                                onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                                className="w-full h-[46px] px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-medium text-gray-700"
                            >
                                <option value="">Selecione...</option>
                                <option value="Solteiro(a)">Solteiro(a)</option>
                                <option value="Casado(a)">Casado(a)</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Instrumento
                            </label>
                            <select
                                value={formData.instrumento}
                                onChange={(e) => setFormData({ ...formData, instrumento: e.target.value })}
                                className="w-full h-[46px] px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-medium text-gray-700"
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

                        <div className="space-y-1.5">
                            <label className="block text-sm font-bold text-gray-700 ml-1">
                                Auxiliar
                            </label>
                            <select
                                value={formData.auxiliar}
                                onChange={(e) => setFormData({ ...formData, auxiliar: e.target.value })}
                                className="w-full h-[46px] px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer text-sm font-medium text-gray-700"
                            >
                                <option value="">Selecione...</option>
                                <option value="Sim">Sim</option>
                                <option value="Não">Não</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/passageiros')}
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
                            {isEditing ? <UserCircle size={20} className="mr-2" /> : <UserPlus size={20} className="mr-2" />}
                            {loading ? (isEditing ? 'Atualizando...' : 'Salvando...') : (isEditing ? 'Atualizar Dados' : 'Cadastrar Passageiro')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div >
    );
};
