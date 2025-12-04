import React from 'react';
import { Card } from '@/components/ui/Card';
import { Settings } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';

export const SystemPreferences: React.FC = () => {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <div className="space-y-4 sm:space-y-6">
            <Card className="hover:shadow-soft-lg transition-all">
                <div className="flex items-start gap-3 sm:gap-4 mb-6">
                    <div className="p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm shrink-0">
                        <Settings className="text-white" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Aparência</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5">Personalize a aparência do sistema</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Modo Escuro
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Alterne entre tema claro e escuro para melhor conforto visual.
                            </p>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                            />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
};
