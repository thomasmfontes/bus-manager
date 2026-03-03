import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Bus, MapPin, Users, Calendar, ArrowRight, ChevronDown, Filter, Map as MapIcon, LayoutDashboard, AlertCircle, CreditCard, CheckCircle2 } from 'lucide-react';
import { GoHistory } from 'react-icons/go';
import { CiGlobe } from 'react-icons/ci';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { UserRole } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { CalendarOptionsModal } from '@/components/dashboard/CalendarOptionsModal';

export const Dashboard: React.FC = () => {
    const { buses, fetchOnibus } = useBusStore();
    const { trips, fetchViagens, selectedTripId, setSelectedTripId } = useTripStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [timeFilter, setTimeFilter] = React.useState<'future' | 'past' | 'all'>('future');
    const [mapModalOpen, setMapModalOpen] = React.useState(false);
    const [calendarModalOpen, setCalendarModalOpen] = React.useState(false);
    const [paymentModalTrip, setPaymentModalTrip] = React.useState<any | null>(null);
    const [modalStep, setModalStep] = React.useState<'interest' | 'payment'>('interest');
    const [isSubmittingInterest, setIsSubmittingInterest] = React.useState(false);
    const [mapTarget, setMapTarget] = React.useState<{
        origin: string;
        destination: string;
        originLabel: string;
        destinationLabel: string;
    } | null>(null);

    useEffect(() => {
        fetchOnibus();
        fetchViagens();
        fetchPassageiros();
    }, [fetchOnibus, fetchViagens, fetchPassageiros]);

    const isUserOccupiedInTrip = (tripId: string) => {
        const { enrollments } = usePassengerStore.getState();
        const activeTrip = trips.find(t => t.id === tripId);
        if (!activeTrip) return false;
        const activeBusIds = activeTrip.onibus_ids || (activeTrip.onibus_id ? [activeTrip.onibus_id] : []);

        return enrollments.some(e =>
            e.viagem_id === tripId &&
            (e.passageiro_id === user?.id || e.pago_por === user?.id) &&
            ((e.assento && e.onibus_id && activeBusIds.includes(e.onibus_id)) || (e.pagamento === 'Pago' || e.pagamento === 'Realizado'))
        );
    };

    // Filter trips and passengers based on selection
    const getTotalSeats = (busIds?: string[]) => {
        if (!busIds || busIds.length === 0) return 0;
        return busIds.reduce((total, busId) => {
            const bus = buses.find((b) => b.id === busId);
            return total + (bus ? bus.capacidade : 0);
        }, 0);
    };

    const getOccupiedSeats = (tripId: string) => {
        const { enrollments } = usePassengerStore.getState();
        const trip = trips.find(t => t.id === tripId);
        if (!trip) return 0;

        const activeBusIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);

        return enrollments.filter((e) => {
            if (e.viagem_id !== tripId) return false;

            // Occupied if has a seat OR is confirmed paid
            const isAssigned = e.assento && e.onibus_id && activeBusIds.includes(e.onibus_id);
            const isPaid = e.pagamento === 'Pago' || e.pagamento === 'Realizado';

            return isAssigned || isPaid;
        }).length;
    };

    const now = new Date();

    // Dynamically sort trips based on the current context/filter
    const getSortedTrips = (tripsList: any[], filter: 'future' | 'past' | 'all') => {
        return [...tripsList].sort((a, b) => {
            const dateA = new Date(a.data_ida).getTime();
            const dateB = new Date(b.data_ida).getTime();

            if (filter === 'future') {
                return dateA - dateB;
            } else if (filter === 'past') {
                return dateB - dateA;
            } else {
                return dateB - dateA;
            }
        });
    };

    const futureTrips = getSortedTrips(trips.filter(t => new Date(t.data_ida) >= now), 'future');
    const pastTrips = getSortedTrips(trips.filter(t => new Date(t.data_ida) < now), 'past');
    const allTrips = getSortedTrips(trips, 'all');

    // For Passengers, force future trips only. For Admins, use the timeFilter.
    const effectiveTimeFilter = user?.role === UserRole.ADMIN ? timeFilter : 'future';

    const tripsInView = effectiveTimeFilter === 'future'
        ? futureTrips
        : effectiveTimeFilter === 'past'
            ? pastTrips
            : allTrips;

    const filteredTrips = !selectedTripId || selectedTripId === 'all'
        ? tripsInView
        : trips.filter(t => t.id === selectedTripId);

    const filteredPassengers = !selectedTripId || selectedTripId === 'all'
        ? (effectiveTimeFilter === 'all' ? passengers : passengers.filter(p => {
            if (!p.enrollment) return false;
            const passengerTrip = trips.find(t => t.id === p.enrollment?.viagem_id);
            if (!passengerTrip) return false;
            const isFuture = new Date(passengerTrip.data_ida) >= now;
            return effectiveTimeFilter === 'future' ? isFuture : !isFuture;
        }))
        : passengers.filter(p => p.enrollment?.viagem_id === selectedTripId);

    // Calculate stats
    const totalBuses = buses.length;
    const totalTrips = trips.length;
    // Calculate total unique passengers (identities) - exclude the technical "BLOQUEADO" identity
    const uniquePassengerIdentities = new Set(
        passengers
            .filter(p => p.nome_completo !== 'BLOQUEADO')
            .map(p => `${p.nome_completo.trim().toLowerCase()}-${(p.cpf_rg || '').trim()}`)
    );
    const totalPassengers = uniquePassengerIdentities.size;

    // Count passengers with assigned seats in the filtered group (exclude BLOQUEADO)
    const blockedIdentityId = passengers.find(p => p.nome_completo === 'BLOQUEADO')?.id;

    const occupiedSeats = (!selectedTripId || selectedTripId === 'all')
        ? usePassengerStore.getState().enrollments.filter(e => {
            if (!e.assento || !e.viagem_id || !e.onibus_id) return false;
            // Exclude blocks from occupancy count
            if (blockedIdentityId && e.passageiro_id === blockedIdentityId) return false;

            const trip = trips.find(t => t.id === e.viagem_id);
            if (!trip) return false;
            const activeBusIds = trip.onibus_ids || (trip.onibus_id ? [trip.onibus_id] : []);
            return activeBusIds.includes(e.onibus_id);
        }).length
        : filteredPassengers.filter((p) => {
            if (p.nome_completo === 'BLOQUEADO') return false;
            const e = p.enrollment;
            if (!e || !e.assento || !e.viagem_id || !e.onibus_id) return false;

            const passengerTrip = trips.find(t => t.id === e.viagem_id);
            if (!passengerTrip) return false;

            const activeBusIds = passengerTrip.onibus_ids || (passengerTrip.onibus_id ? [passengerTrip.onibus_id] : []);
            return activeBusIds.includes(e.onibus_id);
        }).length;

    // Calculate capacity for the selected trip(s)
    const currentCapacity = filteredTrips.reduce((acc: number, trip: any) => {
        const busIds = trip.onibus_ids || [];
        const tripCapacity = busIds.reduce((busAcc: number, busId: string) => {
            const bus = buses.find(b => b.id === busId);
            return busAcc + (bus?.capacidade || 0);
        }, 0);
        return acc + tripCapacity;
    }, 0);

    // Dashboard card displays limited set when in 'all' mode
    const displayTrips = (!selectedTripId || selectedTripId === 'all') ? tripsInView.slice(0, 10) : filteredTrips;

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrettyDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = date.getDate();
        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const handleTripClick = async (trip: any) => {
        if (user?.role === UserRole.ADMIN) {
            navigate(`/viagens/${trip.id}`);
            return;
        }

        try {
            const { data: results, error } = await supabase
                .from('viagem_passageiros')
                .select('id, pagamento')
                .eq('viagem_id', trip.id)
                .or(`pago_por.eq.${user?.id},passageiro_id.eq.${user?.id}`);

            if (error) throw error;

            const paidEnrollment = results?.find(r => ['Pago', 'Realizado'].includes(r.pagamento));
            const pendingEnrollment = results?.find(r => r.pagamento === 'Pendente');

            if (paidEnrollment) {
                navigate(`/viagens/${trip.id}`);
            } else if (pendingEnrollment) {
                setModalStep('payment');
                setPaymentModalTrip(trip);
            } else {
                setModalStep('interest');
                setPaymentModalTrip(trip);
            }
        } catch (err) {
            console.error('Error checking payment:', err);
            showToast('Erro ao verificar status de pagamento', 'error');
        }
    };

    const handleInterestClick = async () => {
        if (!paymentModalTrip || !user?.id) return;

        setIsSubmittingInterest(true);
        try {
            // Check if already has a record (to avoid duplicates)
            const { data: existing } = await supabase
                .from('viagem_passageiros')
                .select('id')
                .eq('viagem_id', paymentModalTrip.id)
                .eq('passageiro_id', user.id)
                .maybeSingle();

            if (!existing) {
                const { error } = await supabase
                    .from('viagem_passageiros')
                    .insert([{
                        viagem_id: paymentModalTrip.id,
                        passageiro_id: user.id,
                        pagamento: 'Pendente',
                        valor_pago: 0
                    }]);

                if (error) throw error;
            }

            // Move to payment step
            setModalStep('payment');
            showToast('Interesse registrado! Agora você pode prosseguir para o pagamento.', 'success');
        } catch (err) {
            console.error('Error registering interest:', err);
            showToast('Erro ao registrar interesse', 'error');
        } finally {
            setIsSubmittingInterest(false);
        }
    };

    const handleOpenMap = (trip: any) => {
        if (!trip.destino) return;
        setMapTarget({
            origin: trip.origem_endereco || trip.nome,
            destination: trip.destino_endereco || trip.destino,
            originLabel: trip.nome,
            destinationLabel: trip.destino
        });
        setMapModalOpen(true);
    };


    // Final stats array based on selection
    const stats = (!selectedTripId || selectedTripId === 'all')
        ? [
            {
                label: 'Total de Ônibus',
                value: totalBuses,
                icon: Bus,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                trend: totalBuses === 0 ? 'Nenhum cadastrado' : totalBuses === 1 ? '1 cadastrado' : `${totalBuses} cadastrados`
            },
            {
                label: 'Total de Viagens',
                value: totalTrips,
                icon: MapPin,
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                trend: futureTrips.length > 0 ? `${futureTrips.length} próximas` : totalTrips === 0 ? 'Nenhuma cadastrada' : 'Nenhuma próxima'
            },
            {
                label: 'Passageiros (Total)',
                value: totalPassengers,
                icon: Users,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                trend: totalPassengers === 0 ? 'Nenhum cadastrado' : totalPassengers === 1 ? '1 cadastrado' : `${totalPassengers} cadastrados`
            },
            {
                label: 'Assentos Ocupados',
                value: occupiedSeats,
                icon: Calendar,
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                trend: currentCapacity > 0 ? `de ${currentCapacity} assentos` : 'Nenhum assento disponível'
            },
        ]
        : (filteredTrips[0] ? [
            {
                label: 'Ônibus na Viagem',
                value: filteredTrips[0].onibus_ids?.length || (filteredTrips[0].onibus_id ? 1 : 0),
                icon: Bus,
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
                trend: (filteredTrips[0].onibus_ids?.length || (filteredTrips[0].onibus_id ? 1 : 0)) === 1 ? '1 ônibus escalado' : `${filteredTrips[0].onibus_ids?.length || 0} ônibus escalados`
            },
            {
                label: 'Destino',
                value: filteredTrips[0].destino || 'Não informado',
                icon: MapPin,
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
                trend: 'Local de desembarque',
                onIconClick: filteredTrips[0].destino ? () => handleOpenMap(filteredTrips[0]) : undefined
            },
            {
                label: filteredTrips[0].data_volta ? 'Partida / Retorno' : 'Partida',
                value: formatPrettyDate(filteredTrips[0].data_ida),
                icon: Calendar,
                iconBg: 'bg-purple-100',
                iconColor: 'text-purple-600',
                trend: filteredTrips[0].data_volta
                    ? `Partida: ${new Date(filteredTrips[0].data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Retorno: ${new Date(filteredTrips[0].data_volta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                    : `Partida às ${new Date(filteredTrips[0].data_ida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
                onIconClick: () => {
                    setCalendarModalOpen(true);
                }
            },
            {
                label: 'Ocupação',
                value: occupiedSeats,
                icon: Users,
                iconBg: 'bg-orange-100',
                iconColor: 'text-orange-600',
                trend: currentCapacity > 0 ? `de ${currentCapacity} assentos` : 'Nenhum assento disponível'
            }
        ] : []);


    return (
        <div className="space-y-8 fade-in duration-500 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Registration Banner */}
            {user?.role === UserRole.PASSAGEIRO && !user.id && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-2 text-center sm:text-left">
                        <h2 className="text-2xl font-bold">Complete seu Cadastro!</h2>
                        <p className="text-blue-100 max-w-xl">
                            Você está visualizando como visitante. Para poder selecionar e reservar assentos,
                            é necessário completar seu cadastro de passageiro.
                        </p>
                    </div>
                    <Link
                        to="/excursao"
                        className="whitespace-nowrap px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
                    >
                        Cadastrar Agora
                    </Link>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <LayoutDashboard className="text-white" size={20} />
                            </div>
                            Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm ml-[52px]">Visão geral das excursões.</p>
                    </div>
                </div>

                {/* Unified Filter Container (Matched to User Image) */}
                <div className="flex flex-col gap-4 bg-white/50 p-2 rounded-2xl border border-gray-100 backdrop-blur-sm shadow-sm">
                    {/* Time Filter Tabs - Only for Admins */}
                    {user?.role === UserRole.ADMIN && (
                        <div className="flex p-1 bg-gray-100/80 rounded-xl w-full sm:w-fit">
                            {[
                                { id: 'future', label: 'Próximas', icon: Calendar },
                                { id: 'past', label: 'Passadas', icon: GoHistory },
                                { id: 'all', label: 'Todas', icon: CiGlobe }
                            ].map((filterItem) => (
                                <button
                                    key={filterItem.id}
                                    onClick={() => {
                                        setTimeFilter(filterItem.id as any);
                                        setSelectedTripId(null);
                                    }}
                                    className={cn(
                                        "flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200",
                                        timeFilter === filterItem.id
                                            ? "bg-white text-blue-600 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <filterItem.icon size={18} />
                                    <span className="hidden sm:inline">{filterItem.label}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Integrated Trip Selector */}
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Filter size={18} />
                        </div>
                        <select
                            value={selectedTripId || 'all'}
                            onChange={(e) => setSelectedTripId(e.target.value === 'all' ? null : e.target.value)}
                            className="w-full pl-11 pr-10 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm hover:border-gray-300 focus:ring-4 focus:ring-blue-50/50 focus:border-blue-500 transition-all outline-none font-medium text-gray-700 appearance-none cursor-pointer text-sm"
                        >
                            <option value="all">Filtro de Viagem...</option>
                            {tripsInView.map(trip => (
                                <option key={trip.id} value={trip.id}>
                                    {trip.nome} — {formatPrettyDate(trip.data_ida)}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                            <ChevronDown size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.length > 0 && stats.map((stat, index) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        iconBg={stat.iconBg}
                        iconColor={stat.iconColor}
                        trend={stat.trend}
                        delay={index * 100}
                        onIconClick={(stat as any).onIconClick}
                    />
                ))}
            </div>

            {/* Upcoming Trips */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {selectedTripId !== 'all'
                                ? 'Detalhes da Viagem'
                                : effectiveTimeFilter === 'future' ? 'Próximas Viagens'
                                    : effectiveTimeFilter === 'past' ? 'Viagens Passadas'
                                        : 'Todas as Viagens'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {selectedTripId !== 'all'
                                ? 'Dados específicos da viagem selecionada'
                                : `Visualizando ${effectiveTimeFilter === 'future' ? 'os próximos embarques' : 'histórico de viagens'}`}
                        </p>
                    </div>
                    {(!selectedTripId || selectedTripId === 'all') && (
                        <Link
                            to="/viagens"
                            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
                        >
                            <span className="hidden sm:inline">Ver todas</span>
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                    )}
                </div>

                {displayTrips.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Calendar className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">Nenhuma viagem encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayTrips.map((trip) => {
                            const occupied = getOccupiedSeats(trip.id);
                            const total = getTotalSeats(trip.onibus_ids);
                            const occupancyRate = total > 0 ? (occupied / total) * 100 : 0;

                            return (
                                <div
                                    key={trip.id}
                                    onClick={() => handleTripClick(trip)}
                                    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-6 bg-white rounded-2xl hover:shadow-xl hover:border-blue-200 transition-all group border border-gray-100 gap-6 cursor-pointer active:scale-[0.99]"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-900 leading-tight">
                                                    {trip.nome}
                                                </h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">{trip.destino}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 xs:grid-cols-2 md:flex md:flex-wrap gap-x-6 gap-y-3 ml-1">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Partida</span>
                                                <span className="text-sm font-black text-gray-700">{formatDate(trip.data_ida)}</span>
                                            </div>
                                            {trip.data_volta && (
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Retorno</span>
                                                    <span className="text-sm font-black text-gray-700">{formatDate(trip.data_volta)}</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Frota</span>
                                                <span className="text-sm font-black text-gray-700">
                                                    {trip.onibus_ids?.length
                                                        ? `${trip.onibus_ids.length} ônibus`
                                                        : (trip.onibus_id ? '1 ônibus' : 'Pendente')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2 w-full sm:w-48 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocupação</span>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-blue-600">{occupied}</span>
                                                <span className="text-xs font-bold text-gray-300 ml-1">/ {total}</span>
                                            </div>
                                        </div>
                                        <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden shadow-inner border border-gray-100/50">
                                            <div
                                                className={cn(
                                                    "h-full transition-all duration-1000",
                                                    occupancyRate > 90 ? "bg-orange-500" : "bg-blue-600"
                                                )}
                                                style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 group-hover:bg-blue-50 text-gray-300 group-hover:text-blue-600 transition-all">
                                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
            {/* Google Maps Modal */}
            <Modal
                isOpen={mapModalOpen}
                onClose={() => setMapModalOpen(false)}
                title="Visualização da Rota"
                footer={
                    <div className="flex justify-center w-full">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(mapTarget?.origin || '')}&destination=${encodeURIComponent(mapTarget?.destination || '')}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto"
                        >
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm px-8"
                            >
                                <MapIcon size={18} className="mr-2" />
                                Abrir Maps
                            </Button>
                        </a>
                    </div>
                }
            >
                <div className="space-y-4">
                    {/* Route Info Header */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />
                            <p className="text-sm font-medium text-gray-600 truncate">
                                <span className="text-gray-400 mr-2">Origem:</span>
                                {mapTarget?.originLabel}
                            </p>
                        </div>
                        <div className="ml-[4.5px] flex flex-col items-center w-0.5 gap-1 py-1">
                            <div className="w-0.5 h-1 bg-gray-300 rounded-full" />
                            <div className="w-0.5 h-1 bg-gray-300 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] shrink-0" />
                            <p className="text-sm font-bold text-gray-900 truncate">
                                <span className="text-gray-400 font-medium mr-1">Destino:</span>
                                {mapTarget?.destinationLabel}
                            </p>
                        </div>
                    </div>

                    <div className="w-full aspect-video min-h-[300px] sm:min-h-[400px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shadow-inner relative">
                        {mapTarget ? (
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://maps.google.com/maps?saddr=${encodeURIComponent(mapTarget.origin)}&daddr=${encodeURIComponent(mapTarget.destination)}&output=embed`}
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-gray-400">Carregando mapa...</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Modal de Interesse/Pagamento - UI Premium */}
            <Modal
                isOpen={paymentModalTrip !== null}
                onClose={() => setPaymentModalTrip(null)}
                title={
                    paymentModalTrip && (getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) <= 0 && !isUserOccupiedInTrip(paymentModalTrip.id) && modalStep === 'interest'
                        ? "Reservas Encerradas"
                        : modalStep === 'interest'
                            ? "Deseja participar?"
                            : "Acesso Restrito"
                }
                size="sm"
                footer={
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                            variant="secondary"
                            onClick={() => setPaymentModalTrip(null)}
                            className="flex-1 order-2 sm:order-1"
                        >
                            Voltar
                        </Button>
                        {paymentModalTrip && ((getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) > 0 || isUserOccupiedInTrip(paymentModalTrip.id) || modalStep === 'payment') && (
                            modalStep === 'interest' ? (
                                <Button
                                    variant="primary"
                                    onClick={handleInterestClick}
                                    isLoading={isSubmittingInterest}
                                    className="flex-1 order-1 sm:order-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-blue-200 shadow-lg"
                                >
                                    <CheckCircle2 size={18} className="mr-2" />
                                    Demonstrar Interesse
                                </Button>
                            ) : (
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
                            )
                        )}
                    </div>
                }
            >
                <div className="relative -mt-2 space-y-6">
                    {paymentModalTrip && ((getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) > 0 || isUserOccupiedInTrip(paymentModalTrip.id) || modalStep === 'payment') ? (
                        <>
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
                                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200">
                                        {modalStep === 'interest' ? <Users size={40} className="text-white" /> : <CreditCard size={40} className="text-white" />}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-blue-50">
                                        <AlertCircle size={24} className="text-amber-500" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {modalStep === 'interest' ? 'Tenho Interesse!' : 'Pagamento Necessário'}
                                    </h3>
                                    <p className="text-gray-500 max-w-[280px]">
                                        {modalStep === 'interest'
                                            ? 'Demonstre seu interesse nesta excursão para que possamos entrar em contato e garantir sua vaga.'
                                            : 'Para garantir sua vaga e escolher um assento, precisamos confirmar seu pagamento.'}
                                    </p>
                                </div>
                            </div>

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
                                        {Math.max(0, (getTotalSeats(paymentModalTrip.onibus_ids) - getOccupiedSeats(paymentModalTrip.id)) + (isUserOccupiedInTrip(paymentModalTrip.id) ? 1 : 0))}
                                    </span>
                                </div>
                            </div>

                            {/* Route Info Section */}
                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
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

                        </>
                    ) : (
                        paymentModalTrip && (
                            <div className="flex flex-col items-center py-4 space-y-6">
                                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <AlertCircle size={40} />
                                </div>
                                <div className="flex gap-3 px-6 py-4 bg-red-50 border border-red-100 rounded-2xl text-red-800 text-center">
                                    <p className="text-base font-bold leading-relaxed">
                                        Reservas Encerradas: Todas as vagas para esta excursão já foram preenchidas.
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </Modal>

            <CalendarOptionsModal
                isOpen={calendarModalOpen}
                onClose={() => setCalendarModalOpen(false)}
                trip={selectedTripId && selectedTripId !== 'all' ? filteredTrips[0] : futureTrips[0]}
            />
        </div>
    );
};
