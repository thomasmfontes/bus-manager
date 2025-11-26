import React from 'react';
import { CheckSquare, XSquare, Square } from 'lucide-react';

export const SeatLegend: React.FC = () => {
    const legendItems = [
        { icon: Square, label: 'Livre', color: 'bg-green-500', textColor: 'text-green-700' },
        { icon: XSquare, label: 'Ocupado', color: 'bg-red-500', textColor: 'text-red-700' },
        { icon: CheckSquare, label: 'Selecionado', color: 'bg-blue-600', textColor: 'text-blue-700' },
        { icon: Square, label: 'Bloqueado', color: 'bg-gray-300', textColor: 'text-gray-600' },
    ];

    return (
        <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Legenda</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {legendItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.label}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                        >
                            <div className={`w-6 h-6 ${item.color} rounded flex items-center justify-center`}>
                                <Icon size={14} className="text-white" />
                            </div>
                            <span className={`text-xs font-medium ${item.textColor}`}>
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
