import React from 'react';
import { Bus, SeatAssignment, Passenger, SeatStatus } from '@/types';
import { Seat } from './Seat';
import { Bus as BusIcon, Droplet } from 'lucide-react';
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
    // Generate default configuration if not present
    const getConfiguration = () => {
        if ((bus as any).configuracaoAssentos) {
            return (bus as any).configuracaoAssentos;
        }
        // Default configuration based on capacity
        const columns = 4;
        const rows = Math.ceil(bus.capacidade / columns);
        return {
            rows,
            columns,
            corridorAfterColumn: 2,
            excludedSeats: [] as string[],
        };
    };

    const { rows, columns, corridorAfterColumn, excludedSeats } = getConfiguration();

    const getSeatAssignment = (seatCode: string): SeatAssignment | undefined => {
        return assignments.find((a) => a.assentoCodigo === seatCode);
    };

    const getPassengerName = (passengerId?: string): string | undefined => {
        if (!passengerId) return undefined;
        return passengers.find((p) => p.id === passengerId)?.nome_completo;
    };

    const renderRow = (rowNumber: number) => {
        const seats = [];
        for (let col = 0; col < columns; col++) {
            // Calculate sequential seat number: (row - 1) * columns + col + 1
            const seatNumber = (rowNumber - 1) * columns + col + 1;
            const seatCode = seatNumber.toString();
            const isExcluded = excludedSeats?.includes(seatCode);

            if (seatNumber > bus.capacidade) {
                // Render a placeholder to maintain grid alignment
                seats.push(
                    <div key={`ghost-${seatCode}`} className="w-10 h-10 sm:w-12 sm:h-12" />
                );
            } else if (isExcluded) {
                // Bathroom indicator
                seats.push(
                    <div
                        key={seatCode}
                        className="w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300 shadow-sm"
                        title="Banheiro"
                    >
                        <Droplet size={14} className="text-blue-600 sm:size-4" />
                        <span className="text-[7px] sm:text-[8px] font-bold text-blue-700">WC</span>
                    </div>
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
            if (corridorAfterColumn !== undefined && col === corridorAfterColumn - 1) {
                seats.push(
                    <div key={`corridor-${rowNumber}`} className="w-2 sm:w-4" />
                );
            }
        }
        return seats;
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

            {/* Seat Grid Container */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 overflow-x-hidden">
                {/* Front Indicator */}
                <div className="mb-6 pb-4 border-b-2 border-blue-500">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            <span className="text-sm font-semibold text-blue-900">Frente do Ônibus</span>
                        </div>
                    </div>
                </div>

                {/* Seats */}
                <div className="flex flex-col items-center gap-2 sm:gap-2.5">
                    {Array.from({ length: rows }, (_, i) => (
                        <div key={i + 1} className="flex gap-1.5 sm:gap-2">
                            {renderRow(i + 1)}
                        </div>
                    ))}
                </div>

                {/* Back Indicator */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center">
                        <p className="text-xs text-gray-500">Fundo do Ônibus</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
