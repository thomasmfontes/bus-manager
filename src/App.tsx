import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { router } from '@/router';
import { useThemeStore } from '@/stores/useThemeStore';

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
        </ToastProvider>
    );
}

export default App;
