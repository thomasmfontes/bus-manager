import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { useSeatAssignmentStore } from '@/stores/useSeatAssignmentStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { SeatStatus } from '@/types';
import { ProtectedAction } from '@/components/ProtectedAction';

export const TripList: React.FC = () => {
    const { trips, fetchViagens, deleteViagem, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { assignments } = useSeatAssignmentStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
    }, [fetchViagens, fetchOnibus]);

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await deleteViagem(deleteId);
            showToast('Viagem excluída com sucesso!', 'success');
            setDeleteId(null);
        } catch (error) {
            showToast('Erro ao excluir viagem', 'error');
        }
    };

    const getBusNames = (busIds: string[]) => {
        const tripBuses = buses.filter((b) => busIds.includes(b.id));
        if (tripBuses.length === 0) return 'Nenhum ônibus';
        if (tripBuses.length === 1) return tripBuses[0].nome;
        return `${tripBuses.length} ônibus`;
    };

    const getOccupiedSeats = (tripId: string) => {
        return assignments.filter(
            (a) => a.viagemId === tripId && a.status === SeatStatus.OCUPADO
        ).length;
    };

    const getTotalSeats = (busIds: string[]) => {
        const tripBuses = buses.filter((b) => busIds.includes(b.id));
        return tripBuses.reduce((total, bus) => total + bus.totalAssentos, 0);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data inválida';

        try {
            // Cria o objeto Date a partir do ISO string (UTC) do Supabase
            const date = new Date(dateString);

            // Verifica se a data é válida
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }

            // Formata usando o timezone local do navegador (automático)
            return date.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Data inválida';
        }
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-dark">Viagens</h1>
                <ProtectedAction requiredPermission="create">
                    <Link to="/viagens/nova">
                        <Button>
                            <Plus size={20} className="md:mr-2" />
                            <span className="hidden md:inline">Nova Viagem</span>
                        </Button>
                    </Link>
                </ProtectedAction>
            </div>

            <Card>
                {loading ? (
                    <p className="text-gray-500">Carregando...</p>
                ) : trips.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhuma viagem cadastrada</p>
                        <Link to="/viagens/nova">
                            <Button>Cadastrar Primeira Viagem</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Origem</th>
                                        <th className="text-left py-3 px-4">Destino</th>
                                        <th className="text-left py-3 px-4">Data/Hora</th>
                                        <th className="text-left py-3 px-4">Ônibus</th>
                                        <th className="text-left py-3 px-4">Ocupação</th>
                                        <th className="text-right py-3 px-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {trips.map((trip) => {
                                        const occupied = getOccupiedSeats(trip.id);
                                        const total = getTotalSeats(trip.onibusIds || []);
                                        return (
                                            <tr key={trip.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{trip.origem}</td>
                                                <td className="py-3 px-4 font-medium">{trip.destino}</td>
                                                <td className="py-3 px-4">{formatDate(trip.data)}</td>
                                                <td className="py-3 px-4">{getBusNames(trip.onibusIds || [])}</td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm">
                                                        {occupied} / {total}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-end gap-2">
                                                        <Link to={`/viagens/${trip.id}`}>
                                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver mapa">
                                                                <Eye size={20} />
                                                            </button>
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteId(trip.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={20} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {trips.map((trip) => {
                                const occupied = getOccupiedSeats(trip.id);
                                const total = getTotalSeats(trip.onibusIds || []);
                                return (
                                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-800">
                                                    {trip.origem} → {trip.destino}
                                                </h3>
                                                <p className="text-sm text-gray-500">{formatDate(trip.data)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Link to={`/viagens/${trip.id}`}>
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver mapa">
                                                        <Eye size={20} />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => setDeleteId(trip.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">Ônibus</p>
                                                <p className="font-medium">{getBusNames(trip.onibusIds || [])}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Ocupação</p>
                                                <p className="font-medium">{occupied} / {total}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </Card>

            <ConfirmModal
                isOpen={deleteId !== null}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita."
            />
        </div>
    );
};
