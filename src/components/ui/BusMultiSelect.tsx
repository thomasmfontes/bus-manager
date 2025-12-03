import React from 'react';
import { Bus } from '@/types';
import { Check } from 'lucide-react';

interface BusMultiSelectProps {
    buses: Bus[];
    selectedBusIds: string[];
    onChange: (busIds: string[]) => void;
    label?: string;
    required?: boolean;
}

export const BusMultiSelect: React.FC<BusMultiSelectProps> = ({
    buses,
    selectedBusIds,
    onChange,
    label = 'Ônibus',
    required = false,
}) => {
    const toggleBus = (busId: string) => {
        if (selectedBusIds.includes(busId)) {
            onChange(selectedBusIds.filter(id => id !== busId));
        } else {
            onChange([...selectedBusIds, busId]);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {buses.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum ônibus cadastrado.</p>
            ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-white">
                    {buses.map((bus) => {
                        const isSelected = selectedBusIds.includes(bus.id);

                        return (
                            <label
                                key={bus.id}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                    ${isSelected
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }
                                `}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleBus(bus.id)}
                                    className="sr-only"
                                />

                                <div className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                    ${isSelected
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-gray-300 bg-white'
                                    }
                                `}>
                                    {isSelected && <Check size={14} className="text-white" />}
                                </div>

                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{bus.nome}</p>
                                    <p className="text-sm text-gray-500">
                                        {bus.placa} • {bus.capacidade} lugares
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

            {selectedBusIds.length > 0 && (
                <p className="text-sm text-gray-600">
                    {selectedBusIds.length} ônibus selecionado{selectedBusIds.length !== 1 ? 's' : ''}
                </p>
            )}
        </div>
    );
};
