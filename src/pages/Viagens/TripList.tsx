import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Eye, Trash2, MapPin } from 'lucide-react';
import { ProtectedAction } from '@/components/ProtectedAction';

export const TripList: React.FC = () => {
    const { trips, fetchViagens, deleteViagem, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
        fetchPassageiros();
    }, [fetchViagens, fetchOnibus, fetchPassageiros]);

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

    const getBusNames = (busIds?: string[]): string[] => {
        if (!busIds || busIds.length === 0) return [];
        return busIds.map(id => {
            const bus = buses.find((b) => b.id === id);
            return bus ? bus.nome : 'Ônibus não encontrado';
        });
    };

    const getOccupiedSeats = (tripId: string) => {
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return 0;

        const activeBusIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

        return passengers.filter((p) => {
            if (p.viagem_id !== tripId) return false;
            // Only count if the passenger has a seat AND the assigned bus is still in the trip
            return p.assento && p.onibus_id && activeBusIds.includes(p.onibus_id);
        }).length;
    };

    const getTotalSeats = (busIds?: string[]) => {
        if (!busIds || busIds.length === 0) return 0;
        return busIds.reduce((total, busId) => {
            const bus = buses.find((b) => b.id === busId);
            return total + (bus ? bus.capacidade : 0);
        }, 0);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Data inválida';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Data inválida';
            }
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
                <h1 className="text-3xl font-bold text-gray-dark flex items-center gap-3">
                    <MapPin className="text-emerald-600" size={32} />
                    Viagens
                </h1>
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
                                        <th className="text-left py-3 px-4">Nome</th>
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
                                        const total = getTotalSeats(trip.onibus_ids);
                                        return (
                                            <tr key={trip.id} className="border-b hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium">{trip.nome}</td>
                                                <td className="py-3 px-4 font-medium">{trip.destino}</td>
                                                <td className="py-3 px-4">{formatDate(trip.data_ida)}</td>
                                                <td className="py-3 px-4">
                                                    {trip.onibus_ids && trip.onibus_ids.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {getBusNames(trip.onibus_ids).map((name, idx) => (
                                                                <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">Nenhum ônibus</span>
                                                    )}
                                                </td>
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
                                                        <ProtectedAction requiredPermission="delete">
                                                            <button
                                                                onClick={() => setDeleteId(trip.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </ProtectedAction>
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
                                const total = getTotalSeats(trip.onibus_ids);
                                return (
                                    <div key={trip.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-800">
                                                    {trip.nome} → {trip.destino}
                                                </h3>
                                                <p className="text-sm text-gray-500">{formatDate(trip.data_ida)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Link to={`/viagens/${trip.id}`}>
                                                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Ver mapa">
                                                        <Eye size={20} />
                                                    </button>
                                                </Link>
                                                <ProtectedAction requiredPermission="delete">
                                                    <button
                                                        onClick={() => setDeleteId(trip.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </ProtectedAction>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <p className="text-gray-500">Ônibus</p>
                                                {trip.onibus_ids && trip.onibus_ids.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {getBusNames(trip.onibus_ids).map((name, idx) => (
                                                            <span key={idx} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="font-medium text-gray-500">Nenhum ônibus</p>
                                                )}
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
