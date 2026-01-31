import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Calendar, Eye, Trash2, Users, AlertCircle, CreditCard } from 'lucide-react';
import { GoHistory } from 'react-icons/go';
import { CiGlobe } from 'react-icons/ci';
import { useTripStore } from '@/stores/useTripStore';
import { useBusStore } from '@/stores/useBusStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ProtectedAction } from '@/components/ProtectedAction';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { Trip, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';

export const TripList: React.FC = () => {
    const { trips, fetchViagens, deleteViagem, loading } = useTripStore();
    const { buses, fetchOnibus } = useBusStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { user } = useAuthStore();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<'future' | 'past' | 'all'>('future');
    const [paymentModalTrip, setPaymentModalTrip] = useState<Trip | null>(null);
    const [checkingPayment, setCheckingPayment] = useState(false);

    useEffect(() => {
        fetchViagens();
        fetchOnibus();
        fetchPassageiros();
    }, [fetchViagens, fetchOnibus, fetchPassageiros]);

    const handleTripClick = async (trip: Trip) => {
        // Admins always have access
        if (user?.role === UserRole.ADMIN) {
            navigate(`/viagens/${trip.id}`);
            return;
        }

        // For non-admins (passengers), check payment
        setCheckingPayment(true);
        try {
            // Check if there's a confirmed payment for this passenger in this trip
            const { data: results, error } = await supabase
                .from('passageiros')
                .select('id, pagamento')
                .eq('viagem_id', trip.id)
                .or(`nome_completo.eq."${user?.full_name}",telefone.eq."${user?.email}"`) // Email is often phone for passengers
                .in('pagamento', ['Pago', 'Realizado']);

            if (error) throw error;

            if (results && results.length > 0) {
                // Payment confirmed, go to map
                navigate(`/viagens/${trip.id}`);
            } else {
                // No payment confirmed, show blocking modal
                setPaymentModalTrip(trip);
            }
        } catch (err) {
            console.error('Error checking payment:', err);
            showToast('Erro ao verificar status de pagamento', 'error');
        } finally {
            setCheckingPayment(false);
        }
    };

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
        <div className="space-y-6 w-full fade-in duration-500">
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
                                { id: 'past', label: 'Passadas', icon: GoHistory },
                                { id: 'all', label: 'Todas', icon: CiGlobe }
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

                                                        <button
                                                            onClick={() => handleTripClick(trip)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                            title="Ver mapa"
                                                            disabled={checkingPayment}
                                                        >
                                                            <Eye size={20} />
                                                        </button>
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

                                                <button
                                                    onClick={() => handleTripClick(trip)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Ver mapa"
                                                    disabled={checkingPayment}
                                                >
                                                    <Eye size={20} />
                                                </button>
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

            {/* Modal de Pagamento Obrigatório - UI Premium */}
            <Modal
                isOpen={paymentModalTrip !== null}
                onClose={() => setPaymentModalTrip(null)}
                title="Acesso Restrito"
                size="sm"
                footer={
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setPaymentModalTrip(null)}
                            className="flex-1 order-2 sm:order-1"
                        >
                            Voltar para Viagens
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                const tripId = paymentModalTrip?.id;
                                setPaymentModalTrip(null);
                                navigate(`/pagamento?v=${tripId}&search=${encodeURIComponent(user?.full_name || '')}`);
                            }}
                            className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-blue-200 shadow-lg"
                        >
                            <CreditCard size={18} className="mr-2" />
                            Ir para Pagamento
                        </Button>
                    </div>
                }
            >
                <div className="relative -mt-2 space-y-6">
                    {/* Header Ilustrativo */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
                            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200">
                                <CreditCard size={40} className="text-white" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-50">
                                <AlertCircle size={24} className="text-amber-500" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-gray-900">Pagamento Necessário</h3>
                            <p className="text-gray-500 max-w-[280px]">
                                Para garantir sua vaga e escolher um assento, precisamos confirmar seu pagamento.
                            </p>
                        </div>
                    </div>

                    {/* Vagas Disponíveis Card */}
                    {paymentModalTrip && (
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vagas Disponíveis</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-blue-600">
                                    {(getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id))}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Route Info Section */}
                    {paymentModalTrip && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <MapPin size={16} className="text-blue-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Origem</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate">{paymentModalTrip.nome}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <MapPin size={16} className="text-green-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Destino</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate">{paymentModalTrip.destino}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info Alert */}
                    <div className="flex gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800">
                        <AlertCircle size={20} className="shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed">
                            O mapa de assentos será liberado **imediatamente** após a confirmação do seu pagamento via Pix.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
