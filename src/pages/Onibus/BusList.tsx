import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit, Trash2, Bus as BusIcon, Hash, Users, ArrowRight } from 'lucide-react';
import { ProtectedAction } from '@/components/ProtectedAction';
import { Spinner } from '@/components/ui/Spinner';

export const BusList: React.FC = () => {
    const { buses, fetchOnibus, deleteOnibus, loading } = useBusStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchOnibus();
    }, [fetchOnibus]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteOnibus(deleteId);
            showToast('Ônibus excluído com sucesso!', 'success');
            setDeleteId(null);
        } catch (error) {
            showToast('Erro ao excluir ônibus', 'error');
        }
    };


    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <BusIcon className="text-white" size={20} />
                        </div>
                        Frota de Ônibus
                    </h1>
                    <p className="text-gray-500 text-sm ml-[52px]">Gerencie seus veículos e configurações de assentos.</p>
                </div>
                <ProtectedAction requiredPermission="create">
                    <Link to="/onibus/novo" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-11 px-6 rounded-xl shadow-orange-100 shadow-lg hover:shadow-xl transition-all">
                            <Plus size={20} className="mr-2" />
                            <span>Novo Ônibus</span>
                        </Button>
                    </Link>
                </ProtectedAction>
            </div>

            {loading ? (
                <div className="py-12"><Spinner size="lg" text="Carregando ônibus..." /></div>
            ) : buses.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-gray-100">
                        <BusIcon size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum ônibus na frota</h3>
                    <p className="text-gray-500 mb-8 max-w-xs">Comece cadastrando seu primeiro veículo para organizar suas viagens.</p>
                    <Link to="/onibus/novo">
                        <Button className="font-bold px-8">Cadastrar Primeiro Ônibus</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buses.map((bus) => (
                        <div key={bus.id} className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 overflow-hidden flex flex-col">
                            {/* Card Header / Image Area */}
                            <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100/50 p-6 flex justify-between items-start border-b border-gray-100 relative">


                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm ring-1 ring-gray-200 group-hover:ring-orange-200 transition-all z-10">
                                    <BusIcon size={24} className="text-orange-500" />
                                </div>

                                <div className="flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                                    <Link to={`/onibus/editar/${bus.id}`}>
                                        <button className="p-2.5 bg-white text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl shadow-sm border border-gray-100 transition-all active:scale-95" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                    </Link>
                                    <button
                                        onClick={() => setDeleteId(bus.id)}
                                        className="p-2.5 bg-white text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl shadow-sm border border-gray-100 transition-all active:scale-95"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-5 flex-1 flex flex-col pt-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 leading-tight mb-1 group-hover:text-orange-600 transition-colors">{bus.nome}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        <Hash size={12} />
                                        <span>{bus.placa}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 group-hover:bg-orange-50 group-hover:border-orange-100 transition-colors">
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Capacidade</p>
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-gray-400 group-hover:text-orange-500" />
                                            <span className="text-sm font-black text-gray-900">{bus.capacidade} assentos</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-auto border-t border-gray-50">
                                    <Link to={`/onibus/editar/${bus.id}`} className="flex items-center justify-between text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform">
                                        Configuração de Mapa
                                        <ArrowRight size={16} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este ônibus? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
