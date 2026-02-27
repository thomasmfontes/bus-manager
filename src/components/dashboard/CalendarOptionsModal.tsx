import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Mail, Smartphone } from 'lucide-react';
import { SiGooglecalendar } from 'react-icons/si';
import {
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
    downloadIcs
} from '@/utils/calendarUtils';

interface CalendarOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: {
        nome: string;
        destino: string;
        data_ida: string;
    };
}

export const CalendarOptionsModal: React.FC<CalendarOptionsModalProps> = ({
    isOpen,
    onClose,
    trip
}) => {
    if (!trip) return null;

    const eventData = {
        title: `Excursão: ${trip.nome}`,
        description: `Viagem para ${trip.destino}. Organizado via Bus Manager.`,
        location: trip.destino,
        startDate: trip.data_ida,
    };

    const handleOption = (type: 'google' | 'outlook' | 'universal') => {
        if (type === 'google') {
            window.open(generateGoogleCalendarUrl(eventData), '_blank');
        } else if (type === 'outlook') {
            window.open(generateOutlookCalendarUrl(eventData), '_blank');
        } else {
            downloadIcs(eventData);
        }
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adicionar ao Calendário"
            size="sm"
        >
            <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-4 text-center">
                    Escolha onde você deseja salvar este evento:
                </p>

                <button
                    onClick={() => handleOption('google')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-blue-500">
                        <SiGooglecalendar size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Google Agenda</p>
                        <p className="text-xs text-gray-500">Abre direto no navegador</p>
                    </div>
                </button>

                <button
                    onClick={() => handleOption('outlook')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-sky-50 dark:hover:bg-sky-900/20 hover:border-sky-200 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-sky-600">
                        <Mail size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Outlook / Office 365</p>
                        <p className="text-xs text-gray-500">Abre direto no navegador</p>
                    </div>
                </button>

                <button
                    onClick={() => handleOption('universal')}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 transition-all group"
                >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-purple-600">
                        <Smartphone size={24} />
                    </div>
                    <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white">Apple / Samsung / Outros</p>
                        <p className="text-xs text-gray-500">Baixa arquivo .ics universal</p>
                    </div>
                </button>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="w-full"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
