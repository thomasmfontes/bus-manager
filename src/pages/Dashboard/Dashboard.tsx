import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card } from '@/components/ui/Card';
import { Bus, MapPin, Users, Calendar, ArrowRight, Eye } from 'lucide-react';
import { UserRole } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';

export const Dashboard: React.FC = () => {
    const { buses, fetchOnibus } = useBusStore();
    const { trips, fetchViagens } = useTripStore();
    const { passengers, fetchPassageiros } = usePassengerStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchOnibus();
        fetchViagens();
        fetchPassageiros();
    }, [fetchOnibus, fetchViagens, fetchPassageiros]);

    // Calculate stats
    const totalBuses = buses.length;
    const totalTrips = trips.length;
    const totalPassengers = passengers.length;
    // Count passengers with assigned seats
    const occupiedSeats = passengers.filter((p) => p.assento !== null && p.assento !== undefined).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingTrips = trips
        .filter((trip) => {
            if (!trip.data_ida) return false;
            const tripDate = new Date(trip.data_ida);
            return tripDate >= today;
        })
        .sort((a, b) => new Date(a.data_ida).getTime() - new Date(b.data_ida).getTime())
        .slice(0, 5);

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


    const stats = [
        {
            label: 'Total de Ônibus',
            value: totalBuses,
            icon: Bus,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Total de Viagens',
            value: totalTrips,
            icon: MapPin,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            ...(upcomingTrips.length > 0 && { trend: `${upcomingTrips.length} próximas` })
        },
        {
            label: 'Total de Passageiros',
            value: totalPassengers,
            icon: Users,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
        {
            label: 'Assentos Ocupados',
            value: occupiedSeats,
            icon: Calendar,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            ...(totalPassengers > 0 && { trend: `de ${totalPassengers} total` })
        },
    ];

    return (
        <div className="space-y-8 animate-fade-in w-full">
            {/* Registration Banner */}
            {user?.role === UserRole.USER && !user.id && (
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

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500">Visão geral do sistema</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        iconBg={stat.iconBg}
                        iconColor={stat.iconColor}
                        trend={stat.trend}
                        delay={index * 100}
                    />
                ))}
            </div>

            {/* Upcoming Trips */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Próximas Viagens</h2>
                        <p className="text-sm text-gray-500 mt-1">Viagens agendadas para os próximos dias</p>
                    </div>
                    <Link
                        to="/viagens"
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors group"
                    >
                        <span className="hidden sm:inline">Ver todas</span>
                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>

                {upcomingTrips.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Calendar className="text-gray-400" size={32} />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">Nenhuma viagem agendada</p>
                        <p className="text-sm text-gray-500">Crie uma nova viagem para começar</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingTrips.map((trip) => (
                            <div
                                key={trip.id}
                                className="flex items-start sm:items-center justify-between p-5 sm:p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group border border-gray-100 hover:border-gray-200 gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-3 mb-3">
                                        <MapPin size={20} className="text-blue-600 shrink-0 mt-0.5" />
                                        <span className="font-semibold text-gray-900 leading-snug">
                                            {trip.nome}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 ml-8">
                                        <span className="flex items-center gap-2">
                                            <Calendar size={16} className="shrink-0" />
                                            {formatDate(trip.data_ida)}
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Bus size={16} className="shrink-0" />
                                            {trip.onibus_ids?.length
                                                ? `${trip.onibus_ids.length} ônibus`
                                                : (trip.onibus_id ? '1 ônibus' : 'Nenhum ônibus')}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to={`/viagens/${trip.id}`}
                                    className="px-3 sm:px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 group shrink-0 self-start sm:self-center"
                                >
                                    <span className="hidden sm:inline">Ver Mapa</span>
                                    <Eye size={20} className="sm:hidden" />
                                    <ArrowRight size={16} className="hidden sm:block transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};
