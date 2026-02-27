import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export const PwaReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error: Error | any) {
            console.error('SW registration error', error)
        },
        onRegistered(r) {
            if (r) {
                // Check for updates every hour silently
                setInterval(() => {
                    r.update()
                }, 60 * 60 * 1000);

                // Check for updates immediately when app comes back to foreground
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        r.update();
                    }
                });
            }
        }
    });

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    if (!offlineReady && !needRefresh) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm">
            <div className="bg-gray-900 dark:bg-gray-800 rounded-xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        {needRefresh ? (
                            <RefreshCw size={16} className="text-blue-400 animate-spin-slow" />
                        ) : (
                            <RefreshCw size={16} className="text-blue-400" />
                        )}
                    </div>
                    <div className="truncate">
                        <p className="text-sm font-medium text-white truncate">
                            {needRefresh ? 'Nova versão disponível' : 'App pronto offline'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors px-2 py-1"
                        >
                            Atualizar
                        </button>
                    )}
                    <button
                        onClick={close}
                        className="text-gray-400 hover:text-gray-200 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
