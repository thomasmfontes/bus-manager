import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { Plus, Eye, Trash2, MapPin, Calendar, ArrowRight, LayoutDashboard } from 'lucide-react';
import { ProtectedAction } from '@/components/ProtectedAction';
import { cn } from '@/utils/cn';

export const TripList: React.FC = () => {
    const { trips, fetchViagens, deleteViagem, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { showToast } = useToast();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('future');

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

    const now = new Date();
    const sortedTrips = [...trips].sort((a, b) =>
        new Date(a.data_ida).getTime() - new Date(b.data_ida).getTime()
    );

    const filteredByTime = sortedTrips.filter(t => {
        if (timeFilter === 'all') return true;
        const isFuture = new Date(t.data_ida) >= now;
        return timeFilter === 'future' ? isFuture : !isFuture;
    });

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
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <MapPin className="text-blue-600" size={28} />
                        Viagens
                    </h1>
                    <p className="text-gray-500">Gerenciamento de roteiros e itinerários</p>
                </div>

                {/* Unified Toolbar Container */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                        {/* Filter Tabs Block */}
                        <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                            {[
                                { id: 'future', label: 'Próximas', icon: Calendar },
                                { id: 'past', label: 'Passadas', icon: ArrowRight },
                                { id: 'all', label: 'Todas', icon: LayoutDashboard }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setTimeFilter(tab.id as any)}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                        timeFilter === tab.id
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <tab.icon size={18} />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:block w-px h-8 bg-gray-200/50 mx-2" />
                    </div>

                    {/* Action Button Integrated - Pushed to the right */}
                    <ProtectedAction requiredPermission="create">
                        <Link to="/viagens/nova" className="w-full sm:w-auto">
                            <Button className="w-full sm:w-auto h-11 px-6 rounded-xl shadow-blue-100 shadow-lg hover:shadow-xl transition-all">
                                <Plus size={20} className="mr-2" />
                                <span>Nova Viagem</span>
                            </Button>
                        </Link>
                    </ProtectedAction>
                </div>
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
                                    {filteredByTime.map((trip) => {
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
                                                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver mapa">
                                                                <Eye size={20} />
                                                            </button>
                                                        </Link>
                                                        <ProtectedAction requiredPermission="delete">
                                                            <button
                                                                onClick={() => setDeleteId(trip.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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

                        <div className="md:hidden space-y-4">
                            {filteredByTime.map((trip) => {
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
