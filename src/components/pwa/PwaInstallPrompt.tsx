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
            // Only prevent default if we haven't already handled/captured the prompt
            // This avoids the 'preventDefault() called' console spam if the browser
            // keeps firing the event (e.g., after a dismissal or state change).
            if (!deferredPrompt) {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
            }
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
        if (!deferredPrompt) {
            if (import.meta.env.DEV) {
                alert("Simulação (Modo Dev): O botão chamaria o instalador nativo do Android/Chrome aqui. Em localhost o navegador bloqueia a instalação real por segurança.");
            }
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            handleDismiss(); // Closes the modal after successful installation
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('pwa_prompt_dismissed_at', new Date().toISOString());
    };

    // Force visibility in DEV mode for UI testing, otherwise rely on standard checks
    const isVisible = (!isStandalone && !isDismissed && (deferredPrompt || isIOS)) || (import.meta.env.DEV && !isDismissed);

    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isVisible]);

    // Do not show if already installed, if dismissed recently, or if not on iOS and no prompt is available
    if (!isVisible) {
        return null;
    }

    // iOS Safari Instructions
    if (isIOS) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm relative animate-in zoom-in-95 duration-300">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex flex-col items-center text-center gap-4 mt-2">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mb-2">
                            <Download size={32} className="text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Instalador iOS</h3>
                            <p className="text-sm text-gray-500 mt-1">Adicione o App à sua Tela de Início para continuar com a melhor experiência</p>
                        </div>

                        <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl flex flex-col gap-3 w-full text-left mt-2 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white text-gray-900 text-xs font-bold shadow-sm">1</span>
                                <p>Toque em Compartilhar <Share size={16} className="inline mb-1 mx-1 text-blue-500" /></p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white text-gray-900 text-xs font-bold shadow-sm">2</span>
                                <p>Selecione <strong>Adicionar à Tela de Início</strong></p>
                            </div>
                        </div>

                        <div className="w-full flex flex-col gap-3 mt-4">
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                Continuar no navegador
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Android/Desktop Chrome Prompt (Modal)
    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center text-center gap-4 relative animate-in zoom-in-95 duration-300">
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2"
                >
                    <X size={20} />
                </button>
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-2 mb-2">
                    <Download size={32} className="text-blue-500" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Instalar Excursão</h3>
                    <p className="text-sm text-gray-500 mt-1">Instale o aplicativo para ter uma experiência mais rápida, fluida e amigável no seu celular.</p>
                </div>
                <div className="w-full flex flex-col gap-3 mt-4">
                    <button
                        onClick={handleInstallClick}
                        className="w-full text-base font-bold bg-blue-500 hover:bg-blue-600 text-white transition-colors py-3 rounded-xl shadow-md"
                    >
                        Instalar Agora
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        Continuar no navegador
                    </button>
                </div>
            </div>
        </div>
    );
};
