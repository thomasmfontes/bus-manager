import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const PwaReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error: Error | any) {
            console.error('SW registration error', error)
        },
    });

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    if (!offlineReady && !needRefresh) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 w-80 max-w-[calc(100vw-2rem)]">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            {needRefresh ? (
                                <RefreshCw size={20} className="text-blue-500 animate-spin-slow" />
                            ) : (
                                <RefreshCw size={20} className="text-blue-500" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {needRefresh ? 'Nova versão disponível!' : 'App pronto offline!'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {needRefresh
                                    ? 'Clique no botão abaixo para atualizar o sistema.'
                                    : 'O sistema agora funciona sem internet.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        <X size={18} />
                    </button>
                </div>

                {needRefresh && (
                    <Button
                        onClick={() => updateServiceWorker(true)}
                        className="w-full py-2.5 rounded-xl font-bold bg-blue-500 hover:bg-blue-600 text-white"
                    >
                        Atualizar Agora
                    </Button>
                )}
            </div>
        </div>
    );
};
