import React, { useState } from 'react';

import { Bus, SeatAssignment, Passenger, SeatStatus, DeckConfiguration } from '@/types';

import { Seat } from './Seat';
import { Bus as BusIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface SeatMapProps {
    bus: Bus;
    assignments: SeatAssignment[];
    passengers: Passenger[];
    selectedSeat: string | null;
    onSeatClick: (seatCode: string) => void;
    allBuses?: Bus[];
    onBusSelect?: (id: string) => void;
    selectedBusId?: string;
}

export const SeatMap: React.FC<SeatMapProps> = ({
    bus,
    assignments,
    passengers,
    selectedSeat,
    onSeatClick,
    allBuses = [],
    onBusSelect,
    selectedBusId
}) => {
    const config = bus.configuracao_assentos;
    const isDD = config?.isDoubleDecker && config.superior && config.inferior;

    const [activeDeck, setActiveDeck] = useState<'superior' | 'inferior'>('superior');


    const getSeatAssignment = (seatCode: string): SeatAssignment | undefined => {
        return assignments.find((a) => a.assentoCodigo === String(seatCode));
    };

    const getPassengerName = (passengerId?: string): string | undefined => {
        if (!passengerId) return undefined;
        return passengers.find((p) => p.id === passengerId)?.nome_completo;
    };

    const renderDeckRow = (rowNumber: number, deckConfig: DeckConfiguration) => {

        const { colunas, corredor, inicioAssento, capacidade: deckCapacidade } = deckConfig;
        const seats = [];

        for (let col = 0; col < colunas; col++) {
            // Calculate sequential seat number
            const seatNumber = inicioAssento + ((rowNumber - 1) * colunas) + col;
            const seatCode = seatNumber.toString();

            // Check if this seat exceeds the deck's capacity or the total bus capacity
            // Note: in a deck, the last row might not be full
            const seatIndexInDeck = (rowNumber - 1) * colunas + col;

            if (seatIndexInDeck >= deckCapacidade) {
                // Render a placeholder to maintain grid alignment
                seats.push(
                    <div key={`ghost-${seatCode}-${col}`} className="w-10 h-10 sm:w-12 sm:h-12" />
                );
            } else {
                const assignment = getSeatAssignment(seatCode);
                const passengerName = getPassengerName(assignment?.passageiroId);

                seats.push(
                    <Seat
                        key={seatCode}
                        code={seatCode}
                        status={assignment?.status || SeatStatus.LIVRE}
                        passengerName={passengerName}
                        isSelected={selectedSeat === seatCode}
                        onClick={() => onSeatClick(seatCode)}
                    />
                );
            }

            // Add corridor space
            if (corredor !== undefined && col === corredor - 1) {
                seats.push(
                    <div key={`corridor-${rowNumber}-${col}`} className="w-2 sm:w-4" />
                );
            }
        }
        return seats;
    };

    const renderDeck = (deckConfig: DeckConfiguration, title?: string) => {

        const { colunas, capacidade } = deckConfig;
        const rows = Math.ceil(capacidade / colunas);

        return (
            <div className="space-y-4">
                {title && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100 w-fit mx-auto shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</span>
                    </div>
                )}
                <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    {Array.from({ length: rows }, (_, i) => (
                        <div key={i + 1} className="flex gap-1.5 sm:gap-2">
                            {renderDeckRow(i + 1, deckConfig)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Bus Header - Fused Selector Design */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-2.5 sm:p-4 shadow-lg border border-white/10 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 font-bold">
                    {/* Icon - Hidden on mobile if multiple buses to save space */}
                    {(!allBuses || allBuses.length <= 1) && (
                        <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                            <BusIcon size={20} className="text-white sm:w-6 sm:h-6" />
                        </div>
                    )}

                    {/* Selector Area */}
                    <div className="flex-1 min-w-0">
                        {allBuses.length > 1 ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 py-1 w-full">
                                {allBuses.map((b) => (
                                    <button
                                        key={b.id}
                                        onClick={() => onBusSelect?.(b.id)}
                                        className={cn(
                                            "flex-1 sm:flex-none px-4 py-3 sm:py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between sm:justify-center gap-4",
                                            selectedBusId === b.id
                                                ? "bg-white text-blue-600 shadow-lg"
                                                : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                                        )}
                                    >
                                        <span className="text-sm font-bold truncate">{b.nome}</span>
                                        <span className={cn(
                                            "text-[9px] uppercase tracking-widest font-black px-2 py-1 rounded-md shrink-0 border",
                                            selectedBusId === b.id
                                                ? "bg-blue-50 text-blue-400 border-blue-100"
                                                : "bg-white/5 text-white/30 border-white/5"
                                        )}>
                                            {b.placa || 'S/ PLACA'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between text-white pr-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-widest text-white/60 leading-none mb-1">Veículo Selecionado</p>
                                    <p className="text-sm sm:text-base font-bold truncate leading-tight">{bus.nome}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] uppercase tracking-widest text-white/60 leading-none mb-1">Placa</p>
                                    <p className="text-sm sm:text-base font-bold leading-tight">{bus.placa || '---'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deck Selector (Only for DD) */}
            {isDD && (
                <div className="flex justify-center my-6">
                    <div className="inline-flex p-1 bg-gray-100/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-inner">
                        <button
                            onClick={() => setActiveDeck('superior')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-[0.1em] min-w-[140px]",
                                activeDeck === 'superior' 
                                    ? "bg-white text-blue-600 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.15)] ring-1 ring-black/5" 
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Piso Superior
                        </button>
                        <button
                            onClick={() => setActiveDeck('inferior')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-[0.1em] min-w-[140px]",
                                activeDeck === 'inferior' 
                                    ? "bg-white text-blue-600 shadow-[0_4px_12px_-2px_rgba(37,99,235,0.15)] ring-1 ring-black/5" 
                                    : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            Piso Inferior
                        </button>
                    </div>
                </div>
            )}


            {/* Seat Grid Container */}

            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 overflow-x-hidden">
                {/* Front Indicator */}
                <div className="mb-8 pb-4 border-b-2 border-blue-500 relative">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-blue-900">Frente do Ônibus</span>
                        </div>
                    </div>
                </div>

                {/* Seats */}
                <div className="py-4 min-h-[300px] flex items-center justify-center">
                    {isDD ? (
                        <div className="animate-in fade-in zoom-in-95 duration-500 w-full">
                            {activeDeck === 'superior' ? (
                                renderDeck(config.superior!, "Piso Superior")
                            ) : (
                                renderDeck(config.inferior!, "Piso Inferior")
                            )}
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-500 w-full">
                            {renderDeck(config?.comum || {
                                capacidade: bus.capacidade,
                                colunas: 4,
                                corredor: 2,
                                inicioAssento: 1
                            })}
                        </div>
                    )}
                </div>


                {/* Back Indicator */}
                <div className="mt-8 pt-4 border-t border-gray-200">
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Fundo do Ônibus</p>
                    </div>
                </div>
            </div>
        </div>

    );
};
