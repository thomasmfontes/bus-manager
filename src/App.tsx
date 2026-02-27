import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { router } from '@/router';
import { useThemeStore } from '@/stores/useThemeStore';
import { PwaReloadPrompt } from '@/components/pwa/PwaReloadPrompt';
import { PwaInstallPrompt } from '@/components/pwa/PwaInstallPrompt';

function App() {
    const { theme } = useThemeStore();

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);

    return (
        <ToastProvider>
            <RouterProvider router={router} />
            <PwaReloadPrompt />
            <PwaInstallPrompt />
        </ToastProvider>
    );
}

export default App;
