import React from 'react';
import { Bus, SeatAssignment, Passenger, SeatStatus } from '@/types';
import { Seat } from './Seat';
import { Bus as BusIcon, Droplet } from 'lucide-react';

interface SeatMapProps {
    bus: Bus;
    assignments: SeatAssignment[];
    passengers: Passenger[];
    selectedSeat: string | null;
    onSeatClick: (seatCode: string) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
    bus,
    assignments,
    passengers,
    selectedSeat,
    onSeatClick,
}) => {
    const { rows, columns, corridorAfterColumn } = bus.configuracaoAssentos;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    const getSeatAssignment = (seatCode: string): SeatAssignment | undefined => {
        return assignments.find((a) => a.assentoCodigo === seatCode);
    };

    const getPassengerName = (passengerId?: string): string | undefined => {
        if (!passengerId) return undefined;
        return passengers.find((p) => p.id === passengerId)?.nome;
    };

    const renderRow = (rowNumber: number) => {
        const seats = [];
        for (let col = 0; col < columns; col++) {
            const seatCode = `${rowNumber}${letters[col]}`;
            const isExcluded = bus.configuracaoAssentos.excludedSeats?.includes(seatCode);

            if (isExcluded) {
                // Bathroom indicator
                seats.push(
                    <div
                        key={seatCode}
                        className="w-12 h-12 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border-2 border-blue-300 shadow-sm"
                        title="Banheiro"
                    >
                        <Droplet size={16} className="text-blue-600" />
                        <span className="text-[8px] font-bold text-blue-700">WC</span>
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
                    <div key={`corridor-${rowNumber}`} className="w-4" />
                );
            }
        }
        return seats;
    };

    return (
        <div className="w-full">
            {/* Bus Header */}
            <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <BusIcon size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Ônibus</p>
                            <p className="text-lg font-bold">{bus.nome}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm opacity-90">Placa</p>
                        <p className="text-lg font-bold">{bus.placa}</p>
                    </div>
                </div>
            </div>

            {/* Seat Grid Container */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
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
                <div className="flex flex-col items-center gap-2.5">
                    {Array.from({ length: rows }, (_, i) => (
                        <div key={i + 1} className="flex gap-2">
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
