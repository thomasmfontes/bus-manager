import React, { useEffect } from 'react';
import { useTripStore } from '@/stores/useTripStore';
import { MapPin, ChevronDown, Check, Globe } from 'lucide-react';
import { cn } from '@/utils/cn';

export const GlobalTripSelector: React.FC = () => {
    const { trips, fetchViagens, selectedTripId, setSelectedTripId } = useTripStore();
    const [isOpen, setIsOpen] = React.useState(false);

    useEffect(() => {
        if (trips.length === 0) {
            fetchViagens();
        }
    }, [fetchViagens, trips.length]);

    const selectedTrip = trips.find(t => t.id === selectedTripId);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    };

    return (
        <div className="px-4 relative">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 px-1">
                Contexto de Viagem
            </p>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border text-left",
                    "bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/60 hover:border-gray-600",
                    isOpen && "ring-2 ring-blue-500/50 border-blue-500/50 bg-gray-800"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                    selectedTrip ? "bg-blue-500/10 text-blue-400" : "bg-gray-700/50 text-gray-400"
                )}>
                    {selectedTrip ? <MapPin size={18} /> : <Globe size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate leading-tight">
                        {selectedTrip ? selectedTrip.nome : "Todas as Viagens"}
                    </p>
                    {selectedTrip && (
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                            {formatDate(selectedTrip.data_ida)}
                        </p>
                    )}
                </div>

                <ChevronDown
                    size={16}
                    className={cn(
                        "text-gray-500 transition-transform duration-200",
                        isOpen && "rotate-180 text-blue-400"
                    )}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[60]"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-4 right-4 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                            {/* Option: All Trips */}
                            <button
                                onClick={() => {
                                    setSelectedTripId(null);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left",
                                    !selectedTripId ? "bg-blue-500/5" : ""
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                    !selectedTripId ? "bg-blue-500/20 text-blue-400" : "bg-gray-700/30 text-gray-500"
                                )}>
                                    <Globe size={18} />
                                </div>
                                <span className={cn(
                                    "flex-1 text-sm font-medium",
                                    !selectedTripId ? "text-blue-400" : "text-gray-300"
                                )}>
                                    Todas as Viagens
                                </span>
                                {!selectedTripId && <Check size={16} className="text-blue-400" />}
                            </button>

                            <div className="border-t border-gray-700/50 my-1" />

                            {/* Trip Options */}
                            {trips.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-xs text-gray-500">Nenhuma viagem encontrada</p>
                                </div>
                            ) : (
                                trips
                                    .filter(t => new Date(t.data_ida) >= new Date(new Date().setHours(0, 0, 0, 0)))
                                    .map((trip) => (
                                        <button
                                            key={trip.id}
                                            onClick={() => {
                                                setSelectedTripId(trip.id);
                                                setIsOpen(false);
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors text-left",
                                                selectedTripId === trip.id ? "bg-blue-500/5" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                                selectedTripId === trip.id ? "bg-blue-500/20 text-blue-400" : "bg-gray-700/30 text-gray-500"
                                            )}>
                                                <MapPin size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    selectedTripId === trip.id ? "text-blue-400" : "text-gray-300"
                                                )}>
                                                    {trip.nome}
                                                </p>
                                                <p className="text-[10px] text-gray-500">
                                                    {formatDate(trip.data_ida)} • {trip.destino}
                                                </p>
                                            </div>
                                            {selectedTripId === trip.id && <Check size={16} className="text-blue-400" />}
                                        </button>
                                    ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
