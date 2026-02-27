import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CalendarDays } from 'lucide-react';
import {
    generateGoogleCalendarUrl,
    generateOutlookCalendarUrl,
    downloadIcs
} from '@/utils/calendarUtils';

// User-provided Official Google Calendar Icon
const GoogleCalendarIcon = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" preserveAspectRatio="xMidYMid" fill="#000000">
        <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
        <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
        <g id="SVGRepo_iconCarrier">
            <g>
                <polygon fill="#FFFFFF" points="195.368421 60.6315789 60.6315789 60.6315789 60.6315789 195.368421 195.368421 195.368421"> </polygon>
                <polygon fill="#EA4335" points="195.368421 256 256 195.368421 225.684211 190.196005 195.368421 195.368421 189.835162 223.098002"> </polygon>
                <path d="M1.42108547e-14,195.368421 L1.42108547e-14,235.789474 C1.42108547e-14,246.955789 9.04421053,256 20.2105263,256 L60.6315789,256 L66.8568645,225.684211 L60.6315789,195.368421 L27.5991874,190.196005 L1.42108547e-14,195.368421 Z" fill="#188038"> </path>
                <path d="M256,60.6315789 L256,20.2105263 C256,9.04421053 246.955789,1.42108547e-14 235.789474,1.42108547e-14 L195.368421,1.42108547e-14 C191.679582,15.0358547 189.835162,26.1010948 189.835162,33.1957202 C189.835162,40.2903456 191.679582,49.4356319 195.368421,60.6315789 C208.777986,64.4714866 218.883249,66.3914404 225.684211,66.3914404 C232.485172,66.3914404 242.590435,64.4714866 256,60.6315789 Z" fill="#1967D2"> </path>
                <polygon fill="#FBBC04" points="256 60.6315789 195.368421 60.6315789 195.368421 195.368421 256 195.368421"> </polygon>
                <polygon fill="#34A853" points="195.368421 195.368421 60.6315789 195.368421 60.6315789 256 195.368421 256"> </polygon>
                <path d="M195.368421,0 L20.2105263,0 C9.04421053,0 0,9.04421053 0,20.2105263 L0,195.368421 L60.6315789,195.368421 L60.6315789,60.6315789 L195.368421,60.6315789 L195.368421,0 Z" fill="#4285F4"> </path>
                <path d="M88.2694737,165.153684 C83.2336842,161.751579 79.7473684,156.783158 77.8442105,150.214737 L89.5326316,145.397895 C90.5936842,149.44 92.4463158,152.572632 95.0905263,154.795789 C97.7178947,157.018947 100.917895,158.113684 104.656842,158.113684 C108.48,158.113684 111.764211,156.951579 114.509474,154.627368 C117.254737,152.303158 118.635789,149.338947 118.635789,145.751579 C118.635789,142.08 117.187368,139.082105 114.290526,136.757895 C111.393684,134.433684 107.755789,133.271579 103.410526,133.271579 L96.6568421,133.271579 L96.6568421,121.701053 L102.72,121.701053 C106.458947,121.701053 109.608421,120.690526 112.168421,118.669474 C114.728421,116.648421 116.008421,113.886316 116.008421,110.366316 C116.008421,107.233684 114.863158,104.741053 112.572632,102.871579 C110.282105,101.002105 107.385263,100.058947 103.865263,100.058947 C100.429474,100.058947 97.7010526,100.968421 95.68,102.804211 C93.6602819,104.644885 92.1418208,106.968942 91.2673684,109.557895 L79.6968421,104.741053 C81.2294737,100.395789 84.0421053,96.5557895 88.1684211,93.2378947 C92.2947368,89.92 97.5663158,88.2526316 103.966316,88.2526316 C108.698947,88.2526316 112.96,89.1621053 116.732632,90.9978947 C120.505263,92.8336842 123.469474,95.3768421 125.608421,98.6105263 C127.747368,101.861053 128.808421,105.498947 128.808421,109.541053 C128.808421,113.667368 127.814737,117.153684 125.827368,120.016842 C123.84,122.88 121.397895,125.069474 118.501053,126.602105 L118.501053,127.292632 C122.241568,128.834789 125.490747,131.367752 127.898947,134.618947 C130.341053,137.903158 131.570526,141.827368 131.570526,146.408421 C131.570526,150.989474 130.408421,155.082105 128.084211,158.669474 C125.76,162.256842 122.543158,165.086316 118.467368,167.141053 C114.374737,169.195789 109.776842,170.240124 104.673684,170.240124 C98.7621053,170.256842 93.3052632,168.555789 88.2694737,165.153684 L88.2694737,165.153684 Z M160.067368,107.149474 L147.233684,116.429474 L140.816842,106.694737 L163.84,90.0884211 L172.665263,90.0884211 L172.665263,168.421053 L160.067368,168.421053 L160.067368,107.149474 Z" fill="#4285F4"> </path>
            </g>
        </g>
    </svg>
);

// User-provided Official Microsoft Outlook Icon
const OutlookIcon = ({ size = 32 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#40c4ff" d="M31.323,8.502L7.075,23.872l-2.085-3.29v-2.835c0-1.032,0.523-1.994,1.389-2.556l14.095-9.146	c2.147-1.393,4.914-1.394,7.061-0.001L31.323,8.502z" />
        <path fill="#1976d2" d="M27.317,5.911c0.073,0.043,0.145,0.088,0.217,0.135l11,7.136L11.259,30.47l-4.185-6.603	l20.017-12.713C28.988,9.95,29.071,7.241,27.317,5.911z" />
        <path fill="#0d47a1" d="M22.142,33.771L11.26,30.47l23.136-14.666c1.949-1.235,1.944-4.08-0.009-5.308l-0.104-0.065	l0.3,0.186l7.041,4.568c0.866,0.562,1.389,1.524,1.389,2.556v2.744L22.142,33.771z" />
        <path fill="#29b6f6" d="M20.886,43h15.523c3.646,0,6.602-2.956,6.602-6.602V17.797c0,1.077-0.554,2.079-1.466,2.652	l-23.09,14.498c-1.246,0.782-2.001,2.15-2.001,3.62C16.454,41.016,18.438,43,20.886,43z" />
        <defs>
            <radialGradient id="outlook_grad_user" cx="-509.142" cy="-26.522" r=".07" gradientTransform="matrix(-170.8609 259.7254 674.0181 443.4041 -69097.734 144024.688)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#49deff" />
                <stop offset=".724" stopColor="#29c3ff" />
            </radialGradient>
        </defs>
        <path fill="url(#outlook_grad_user)" d="M27.198,42.999H11.589c-3.646,0-6.602-2.956-6.602-6.602V17.783	c0,1.076,0.552,2.076,1.461,2.649l23.067,14.543c1.263,0.796,2.029,2.185,2.029,3.678C31.544,41.053,29.598,42.999,27.198,42.999z" />
        <path fill="#80d8ff" d="M27.198,42.999H11.589c-3.646,0-6.602-2.956-6.602-6.602V17.783c0,1.076,0.552,2.076,1.461,2.649	l23.067,14.543c1.263,0.796,2.029,2.185,2.029,3.678C31.544,41.053,29.598,42.999,27.198,42.999z" />
        <path fill="#fff" d="M11.282,36.236c-1.398,0-2.545-0.437-3.442-1.312c-0.897-0.874-1.346-2.015-1.346-3.423	c0-1.486,0.455-2.689,1.366-3.607c0.911-0.918,2.103-1.377,3.577-1.377c1.393,0,2.526,0.439,3.401,1.318	c0.879,0.879,1.319,2.037,1.319,3.475c0,1.478-0.456,2.669-1.366,3.574C13.885,35.786,12.716,36.236,11.282,36.236z M11.323,34.381	c0.762,0,1.375-0.26,1.839-0.78c0.464-0.52,0.696-1.244,0.696-2.171c0-0.966-0.226-1.718-0.676-2.256	c-0.451-0.538-1.053-0.806-1.805-0.806c-0.775,0-1.4,0.278-1.873,0.833c-0.473,0.551-0.71,1.281-0.71,2.19	c0,0.923,0.237,1.653,0.71,2.19C9.977,34.114,10.583,34.381,11.323,34.381z" />
        <path fill="#1565c0" d="M6.453,23h10.094C18.454,23,20,24.546,20,26.453v10.094C20,38.454,18.454,40,16.547,40H6.453	C4.546,40,3,38.454,3,36.547V26.453C3,24.546,4.546,23,6.453,23z" />
        <path fill="#fff" d="M11.453,36.518c-1.4,0-2.55-0.452-3.449-1.355c-0.899-0.903-1.348-2.082-1.348-3.537	c0-1.536,0.456-2.778,1.369-3.726c0.913-0.949,2.107-1.423,3.584-1.423c1.396,0,2.532,0.454,3.408,1.362	c0.881,0.908,1.321,2.105,1.321,3.591c0,1.527-0.456,2.758-1.369,3.692C14.061,36.053,12.889,36.518,11.453,36.518z M11.493,34.601	c0.763,0,1.378-0.269,1.843-0.806c0.465-0.538,0.698-1.285,0.698-2.243c0-0.998-0.226-1.775-0.677-2.331	c-0.452-0.556-1.055-0.833-1.809-0.833c-0.777,0-1.403,0.287-1.877,0.861c-0.474,0.569-0.711,1.323-0.711,2.263	c0,0.953,0.237,1.707,0.711,2.263C10.145,34.326,10.752,34.601,11.493,34.601z" />
    </svg>
);

interface CalendarOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: {
        nome: string;
        destino: string;
        data_ida: string;
        data_volta?: string;
        destino_endereco?: string;
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
        description: `Excursão para ${trip.destino}${trip.destino_endereco ? ` (${trip.destino_endereco})` : ''}. Organizado via Bus Manager.`,
        location: trip.destino_endereco || trip.destino,
        startDate: trip.data_ida,
        endDate: trip.data_volta,
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
            <div className="p-0 sm:p-1 space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-5 text-center px-2 sm:px-4">
                    Escolha onde você deseja salvar este evento:
                </p>

                <button
                    onClick={() => handleOption('google')}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-50/50 dark:bg-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden px-1">
                        <GoogleCalendarIcon size={32} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">Google Agenda</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">Abre direto no navegador</p>
                    </div>
                </button>

                <button
                    onClick={() => handleOption('outlook')}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 hover:border-sky-200 transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-50/50 dark:bg-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden px-1">
                        <OutlookIcon size={32} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">Outlook / Office 365</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">Abre direto no navegador</p>
                    </div>
                </button>

                <button
                    onClick={() => handleOption('universal')}
                    className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden px-1">
                        <CalendarDays size={32} strokeWidth={1.5} className="text-gray-700 dark:text-gray-300" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <p className="font-bold text-sm sm:text-base text-gray-900 dark:text-white truncate">Apple / Samsung / Outros</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">Baixa arquivo .ics universal</p>
                    </div>
                </button>

                <div className="mt-4 sm:mt-6 pt-3 sm:pt-4">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="w-full rounded-lg sm:rounded-xl py-2.5 sm:py-3 font-bold border-none bg-gray-100 hover:bg-gray-200 text-gray-600 shadow-none text-sm sm:text-base"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
