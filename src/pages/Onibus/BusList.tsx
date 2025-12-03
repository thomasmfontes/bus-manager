import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { ProtectedAction } from '@/components/ProtectedAction';

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

    const getLayoutDescription = (bus: any) => {
        if (!bus.configuracaoAssentos) {
            return 'Padrão';
        }
        const { rows, columns, corridorAfterColumn } = bus.configuracaoAssentos;
        return `${rows}x${columns}${corridorAfterColumn ? ' com corredor' : ''}`;
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-dark">Ônibus</h1>
                <ProtectedAction requiredPermission="create">
                    <Link to="/onibus/novo">
                        <Button>
                            <Plus size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Novo Ônibus</span>
                        </Button>
                    </Link>
                </ProtectedAction>
            </div>

            <Card>
                {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                ) : buses.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhum ônibus cadastrado</p>
                        <Link to="/onibus/novo">
                            <Button>Cadastrar Primeiro Ônibus</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Nome</th>
                                        <th className="text-left py-3 px-4">Placa</th>
                                        <th className="text-left py-3 px-4">Layout</th>
                                        <th className="text-left py-3 px-4">Total de Assentos</th>
                                        <th className="text-right py-3 px-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buses.map((bus) => (
                                        <tr key={bus.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium">{bus.nome}</td>
                                            <td className="py-3 px-4">{bus.placa}</td>
                                            <td className="py-3 px-4">{getLayoutDescription(bus)}</td>
                                            <td className="py-3 px-4">{bus.capacidade}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link to={`/onibus/editar/${bus.id}`}>
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Editar"
                                                        >
                                                            <Edit size={20} />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(bus.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {buses.map((bus) => (
                                <div key={bus.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800">{bus.nome}</h3>
                                            <p className="text-sm text-gray-500">{bus.placa}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Link to={`/onibus/editar/${bus.id}`}>
                                                <button
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Editar"
                                                >
                                                    <Edit size={20} />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setDeleteId(bus.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Excluir"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-gray-500">Layout</p>
                                            <p className="font-medium">{getLayoutDescription(bus)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Assentos</p>
                                            <p className="font-medium">{bus.capacidade}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </Card>

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
