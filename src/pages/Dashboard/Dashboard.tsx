import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBusStore } from '@/stores/useBusStore';
import { useTripStore } from '@/stores/useTripStore';
import { useSeatAssignmentStore } from '@/stores/useSeatAssignmentStore';
import { usePassengerStore } from '@/stores/usePassengerStore';
import { Card } from '@/components/ui/Card';
import { Bus, MapPin, Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { SeatStatus } from '@/types';
import { cn } from '@/utils/cn';

export const Dashboard: React.FC = () => {
    const { buses, fetchOnibus } = useBusStore();
    const { trips, fetchViagens } = useTripStore();
    const { assignments } = useSeatAssignmentStore();
    const { passengers, fetchPassageiros } = usePassengerStore();

    useEffect(() => {
        fetchOnibus();
        fetchViagens();
        fetchPassageiros();
    }, [fetchOnibus, fetchViagens, fetchPassageiros]);

    // Calculate stats
    const totalBuses = buses.length;
    const totalTrips = trips.length;
    const totalPassengers = passengers.length;
    const occupiedSeats = assignments.filter((a) => a.status === SeatStatus.OCUPADO).length;

    const today = new Date().toISOString().split('T')[0];
    const upcomingTrips = trips
        .filter((trip) => trip.data >= today)
        .sort((a, b) => a.data.localeCompare(b.data))
        .slice(0, 5);

    const formatDate = (dateString: string) => {
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
            trend: '+2 este mês'
        },
        {
            label: 'Total de Viagens',
            value: totalTrips,
            icon: MapPin,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            trend: `${upcomingTrips.length} próximas`
        },
        {
            label: 'Total de Passageiros',
            value: totalPassengers,
            icon: Users,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
            trend: 'Cadastrados'
        },
        {
            label: 'Assentos Ocupados',
            value: occupiedSeats,
            icon: Calendar,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            trend: 'Reservados'
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Visão geral do sistema de gerenciamento</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label} hover className="group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                                <div className={cn('p-3 rounded-xl', stat.iconBg)}>
                                    <Icon className={stat.iconColor} size={24} />
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <TrendingUp size={14} className={stat.iconColor} />
                                <span>{stat.trend}</span>
                            </div>
                        </Card>
                    );
                })}
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
                        Ver todas
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
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group border border-gray-100 hover:border-gray-200"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={18} className="text-blue-600" />
                                        <span className="font-semibold text-gray-900">
                                            {trip.origem} → {trip.destino}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {formatDate(trip.data)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Bus size={14} />
                                            {trip.onibusIds.length} ônibus
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    to={`/viagens/${trip.id}`}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5 group"
                                >
                                    Ver Mapa
                                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};
