import React, { useEffect } from 'react';
import { useTripStore } from '@/stores/useTripStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';
import { MapPin, Globe, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const TripContextModal: React.FC = () => {
    const {
        trips,
        fetchViagens,
        selectedTripId,
        setSelectedTripId,
        isContextModalOpen,
        setIsContextModalOpen
    } = useTripStore();
    const { user } = useAuthStore();

    useEffect(() => {
        if (isContextModalOpen) {
            fetchViagens();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isContextModalOpen, fetchViagens]);

    if (!isContextModalOpen) return null;

    const isAdmin = user?.role === UserRole.ADMIN;

    // Filter future trips or trips the passenger is in
    const availableTrips = trips.filter(t => {
        const tripDate = new Date(t.data_ida);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return tripDate >= today;
    });

    const handleSelect = (id: string | null) => {
        setSelectedTripId(id);
        setIsContextModalOpen(false);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-300">
            {/* Backdrop with extreme blur and dark tint */}
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl transition-all" />

            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl shadow-blue-500/10 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 delay-150">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                {/* Content Header */}
                <div className="px-8 pt-10 pb-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400 shadow-inner">
                        <MapPin size={32} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                        Contexto de Viagem
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Para melhor organizar suas informações, selecione a viagem que deseja gerenciar agora.
                    </p>
                </div>

                {/* Selection List */}
                <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    {/* Admin "All Trips" Option */}
                    {isAdmin && (
                        <button
                            onClick={() => handleSelect(null)}
                            className={cn(
                                "w-full group flex items-center gap-4 p-5 rounded-2xl transition-all border-2 text-left",
                                !selectedTripId
                                    ? "bg-blue-50 border-blue-500/50 dark:bg-blue-500/10 dark:border-blue-400/50 shadow-md"
                                    : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 dark:bg-gray-700/30 dark:hover:bg-gray-700/50"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                                !selectedTripId ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-400 group-hover:text-blue-500"
                            )}>
                                <Globe size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={cn(
                                    "font-bold text-lg leading-tight truncate",
                                    !selectedTripId ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
                                )}>
                                    Todas as Viagens
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Visão geral do sistema</p>
                            </div>
                            {!selectedTripId ? (
                                <CheckCircle2 size={24} className="text-blue-600 dark:text-blue-400 block" />
                            ) : (
                                <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                            )}
                        </button>
                    )}

                    <div className="pt-2 px-2 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Próximas Viagens</span>
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700" />
                    </div>

                    {availableTrips.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 dark:bg-gray-700/20 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                            <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium italic">Nenhuma viagem agendada...</p>
                        </div>
                    ) : (
                        availableTrips.map((trip) => (
                            <button
                                key={trip.id}
                                onClick={() => handleSelect(trip.id)}
                                className={cn(
                                    "w-full group flex items-center gap-4 p-5 rounded-2xl transition-all border-2 text-left",
                                    selectedTripId === trip.id
                                        ? "bg-blue-50 border-blue-500/50 dark:bg-blue-500/10 dark:border-blue-400/50 shadow-md"
                                        : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 dark:bg-gray-700/30 dark:hover:bg-gray-700/50 shadow-none"
                                )}
                            >
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm",
                                    selectedTripId === trip.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 text-gray-400 group-hover:text-blue-500"
                                )}>
                                    <MapPin size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={cn(
                                        "font-bold text-lg leading-tight truncate",
                                        selectedTripId === trip.id ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
                                    )}>
                                        {trip.nome}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-medium text-gray-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} className="text-gray-300 shrink-0" />
                                            {formatDate(trip.data_ida)}
                                        </span>
                                        <span className="hidden sm:inline text-gray-300">•</span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-gray-300 shrink-0 sm:hidden" />
                                            {trip.destino}
                                        </span>
                                    </div>
                                </div>
                                {selectedTripId === trip.id ? (
                                    <CheckCircle2 size={24} className="text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-400 transition-all group-hover:translate-x-1" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Footer Insight */}
                <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700/50 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        Você poderá trocar de contexto a qualquer momento no menu lateral
                    </p>
                </div>
            </div>
        </div>
    );
};
