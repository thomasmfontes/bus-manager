import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        const mql = window.matchMedia('(display-mode: standalone)');
        setIsStandalone(mql.matches || (navigator as any).standalone === true);

        // Listen for standard PWA install prompt (Android/Desktop)
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check for iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIPhoneOrIPad = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIPhoneOrIPad);

        // Check if dismissed in the last 7 days
        const dismissedAt = localStorage.getItem('pwa_prompt_dismissed_at');
        if (dismissedAt) {
            const dismissedDate = new Date(dismissedAt).getTime();
            const now = new Date().getTime();
            const daysSinceDismissed = (now - dismissedDate) / (1000 * 3600 * 24);
            if (daysSinceDismissed < 7) {
                setIsDismissed(true);
            }
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('pwa_prompt_dismissed_at', new Date().toISOString());
    };

    // Do not show if already installed, if dismissed recently, or if not on iOS and no prompt is available
    if (isStandalone || isDismissed || (!deferredPrompt && !isIOS)) {
        return null;
    }

    // iOS Safari Instructions
    if (isIOS) {
        return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border border-gray-100 dark:border-gray-700 relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                <Download size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Instalador iOS</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Adicione o App à sua Tela de Início</p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white text-gray-600 text-xs font-bold border border-gray-200 shadow-sm">1</span>
                                <p>Toque em Compartilhar <Share size={14} className="inline mb-0.5" /></p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white text-gray-600 text-xs font-bold border border-gray-200 shadow-sm">2</span>
                                <p>Selecione <strong>Adicionar à Tela de Início</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Android/Desktop Chrome Prompt
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] w-[90%] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Download size={20} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">Instalar Excursão</h3>
                    <p className="text-xs text-gray-500 truncate">Use como app</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleInstallClick}
                        className="text-sm font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        Instalar
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
