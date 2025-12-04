import React from 'react';
import { Card } from '@/components/ui/Card';
import { useThemeStore } from '@/stores/useThemeStore';

export const SystemPreferences: React.FC = () => {
    const { theme } = useThemeStore();

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Video */}
            <div className="rounded-2xl overflow-hidden shadow-2xl">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                >
                    <source src="/Bus-em-breve.mp4" type="video/mp4" />
                    Seu navegador não suporta vídeos.
                </video>
            </div>

            {/* Theme Toggle Card (Disabled/Teaser) */}
            <Card className="p-6 opacity-75">
                <div className="flex items-center justify-between gap-6">
                    <div className="text-left">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Modo Escuro
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Em breve você poderá alternar entre temas!
                        </p>
                    </div>

                    <button
                        disabled
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-not-allowed opacity-50 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                        />
                    </button>
                </div>
            </Card>
        </div>
    );
};
