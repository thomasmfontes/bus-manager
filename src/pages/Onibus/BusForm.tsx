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
        isDoubleDecker: false,
        superior: { capacidade: 44, colunas: 4, corredor: 2, inicioAssento: 1 },
        inferior: { capacidade: 2, colunas: 4, corredor: 2, inicioAssento: 45 },
        comum: { capacidade: 46, colunas: 4, corredor: 2, inicioAssento: 1 },
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
                    isDoubleDecker: bus.configuracao_assentos?.isDoubleDecker || false,
                    superior: bus.configuracao_assentos?.superior || { capacidade: 44, colunas: 4, corredor: 2, inicioAssento: 1 },
                    inferior: bus.configuracao_assentos?.inferior || { capacidade: 2, colunas: 4, corredor: 2, inicioAssento: 45 },
                    comum: bus.configuracao_assentos?.comum || { capacidade: bus.capacidade || 46, colunas: 4, corredor: 2, inicioAssento: 1 },
                });
            }

        }
    }, [isEditing, id, buses]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const busData = {
            nome: formData.nome,
            placa: formData.placa,
            capacidade: formData.isDoubleDecker 
                ? (formData.superior.capacidade + formData.inferior.capacidade) 
                : formData.capacidade,
            configuracao_assentos: {
                isDoubleDecker: formData.isDoubleDecker,
                superior: formData.isDoubleDecker ? formData.superior : undefined,
                inferior: formData.isDoubleDecker ? formData.inferior : undefined,
                comum: !formData.isDoubleDecker ? formData.comum : undefined,
            }
        };


        try {
            if (formData.isDoubleDecker) {
                const totalCalculado = formData.superior.capacidade + formData.inferior.capacidade;
                if (totalCalculado !== formData.capacidade && formData.capacidade !== totalCalculado) {
                    // We auto-calculate capacity in busData, but let's ensure the user is aware or just use the sum
                }
            }

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

                    <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={formData.isDoubleDecker}
                                onChange={(e) => setFormData({ ...formData, isDoubleDecker: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="font-bold text-gray-700">Ônibus de Dois Andares</span>
                    </div>

                    {!formData.isDoubleDecker ? (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <h3 className="font-black text-blue-600 uppercase tracking-widest text-xs">Configuração do Layout</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <Input
                                    type="number"
                                    label="Total Assentos"
                                    value={formData.comum.capacidade}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        capacidade: parseInt(e.target.value) || 0,
                                        comum: { ...formData.comum, capacidade: parseInt(e.target.value) || 0 }
                                    })}
                                />
                                <Input
                                    type="number"
                                    label="Início Num."
                                    value={formData.comum.inicioAssento}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        comum: { ...formData.comum, inicioAssento: parseInt(e.target.value) || 0 }
                                    })}
                                />
                                <Input
                                    type="number"
                                    label="Colunas"
                                    value={formData.comum.colunas}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        comum: { ...formData.comum, colunas: parseInt(e.target.value) || 0 }
                                    })}
                                />
                                <Input
                                    type="number"
                                    label="Corredor"
                                    value={formData.comum.corredor}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        comum: { ...formData.comum, corredor: parseInt(e.target.value) || 0 }
                                    })}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            {/* Superior */}
                            <div className="space-y-4">
                                <h3 className="font-black text-blue-600 uppercase tracking-widest text-xs">Piso Superior</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Assentos"
                                        value={formData.superior.capacidade}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            superior: { ...formData.superior, capacidade: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                    <Input
                                        type="number"
                                        label="Início Num."
                                        value={formData.superior.inicioAssento}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            superior: { ...formData.superior, inicioAssento: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Colunas"
                                        value={formData.superior.colunas}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            superior: { ...formData.superior, colunas: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                    <Input
                                        type="number"
                                        label="Corredor"
                                        value={formData.superior.corredor}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            superior: { ...formData.superior, corredor: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                            </div>

                            {/* Inferior */}
                            <div className="space-y-4">
                                <h3 className="font-black text-indigo-600 uppercase tracking-widest text-xs">Piso Inferior</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Assentos"
                                        value={formData.inferior.capacidade}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            inferior: { ...formData.inferior, capacidade: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                    <Input
                                        type="number"
                                        label="Início Num."
                                        value={formData.inferior.inicioAssento}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            inferior: { ...formData.inferior, inicioAssento: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="number"
                                        label="Colunas"
                                        value={formData.inferior.colunas}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            inferior: { ...formData.inferior, colunas: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                    <Input
                                        type="number"
                                        label="Corredor"
                                        value={formData.inferior.corredor}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            inferior: { ...formData.inferior, corredor: parseInt(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 pt-2 border-t border-gray-200">
                                <p className="text-sm font-bold text-gray-500 text-center">
                                    Capacidade Total: <span className="text-blue-600">{formData.superior.capacidade + formData.inferior.capacidade} assentos</span>
                                </p>
                            </div>
                        </div>
                    ) }


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
