import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LayoutDashboard, Bus, MapPin, Users, LogOut, Menu, X, Settings, CircleDollarSign, CreditCard } from 'lucide-react';
import { AiOutlineUnorderedList } from 'react-icons/ai';
import { cn } from '@/utils/cn';
import { UserRole } from '@/types';
import { RegistrationModal } from '@/components/RegistrationModal';
import { GlobalTripSelector } from '@/components/layout/GlobalTripSelector';
import { TripContextModal } from '@/components/layout/TripContextModal';
import { MissingDetailsModal } from '@/components/layout/MissingDetailsModal';
import { useTripStore } from '@/stores/useTripStore';
import { usePassengerStore } from '@/stores/usePassengerStore';

export const AuthenticatedLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const { selectedTripId, setIsContextModalOpen, hasPromptedContext, setHasPromptedContext } = useTripStore();
    const { fetchPassageiros } = usePassengerStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showRegistrationModal, setShowRegistrationModal] = useState(false);
    const [showMissingDetailsModal, setShowMissingDetailsModal] = useState(false);
    const [avatarError, setAvatarError] = useState(false);

    useEffect(() => {
        // Auto-open trip context modal if no trip is selected AND we haven't prompted yet in this session
        const timer = setTimeout(() => {
            if (user && !selectedTripId && !hasPromptedContext) {
                setIsContextModalOpen(true);
                setHasPromptedContext(true);
            } else if (user && selectedTripId) {
                // If a trip is already selected (e.g. from persistence), mark as prompted
                setHasPromptedContext(true);
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [user, selectedTripId, hasPromptedContext, setIsContextModalOpen, setHasPromptedContext]);

    useEffect(() => {
        // Check for missing birth date if user is a passenger
        if (user?.role === UserRole.PASSAGEIRO && user.id) {
            const checkData = async () => {
                // Ensure we have current passenger data
                await fetchPassageiros();
                const passenger = usePassengerStore.getState().passengers.find(p => p.id === user.id);

                if (passenger && (!passenger.data_nascimento || !passenger.lgpd_consent_at)) {
                    setShowMissingDetailsModal(true);
                }
            };
            checkData();
        }
    }, [user, fetchPassageiros]);

    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [sidebarOpen]);

    const handleLogout = () => {
        logout();
        setHasPromptedContext(false);
        navigate('/login');
    };

    const isAdmin = user?.role === UserRole.ADMIN;

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/onibus', icon: Bus, label: 'Ônibus' },
        { path: '/viagens', icon: MapPin, label: 'Viagens' },
        { path: '/passageiros', icon: Users, label: 'Passageiros' },
        { path: '/financeiro', icon: CircleDollarSign, label: 'Financeiro' },
        {
            path: isAdmin ? '/extrato' : '/pagamento',
            icon: isAdmin ? AiOutlineUnorderedList : CreditCard,
            label: isAdmin ? 'Extrato' : 'Pagamentos'
        },
        { path: '/settings', icon: Settings, label: 'Configurações' },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 h-16 px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    {user && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Toggle menu"
                        >
                            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    )}
                    <span className="font-bold text-gray-900 dark:text-white text-lg">Bus Manager</span>
                </div>

                {user && (
                    <Link to="/settings" className="lg:hidden">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md ring-2 ring-gray-100 overflow-hidden">
                            {user.avatar_url && user.avatar_url.trim() !== '' && !avatarError ? (
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <span className="text-white font-bold text-xs">
                                    {(user.full_name || user.email)?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </Link>
                )}
            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white z-40',
                    'transition-transform duration-300 ease-out',
                    'flex flex-col shadow-2xl lg:shadow-none border-r border-gray-700',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0',
                    !user && 'hidden lg:hidden'
                )}
            >
                {/* Logo */}
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                            <Bus size={24} className="text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-white">
                            Bus Manager
                        </h1>
                    </div>
                    <p className="text-xs text-gray-400 pl-13">Sistema de Gerenciamento</p>
                </div>

                {/* Global Trip Context Selector */}
                <div className="mt-6">
                    <GlobalTripSelector />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
                    {menuItems
                        .filter((item) => {
                            // Hide Admin-only sections for non-admin users
                            if (!isAdmin) {
                                if (['/passageiros', '/onibus', '/financeiro', '/extrato'].includes(item.path)) {
                                    return false;
                                }
                            }
                            return true;
                        })
                        .map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all group',
                                        'text-sm font-medium',
                                        active
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                            : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                    )}
                                >
                                    <Icon size={20} className={cn(
                                        'transition-transform',
                                        active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                    )} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-700/50 bg-gray-800/50">
                    <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-gray-700/30">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-gray-600 overflow-hidden">
                            {user?.avatar_url && user.avatar_url.trim() !== '' && !avatarError ? (
                                <img
                                    src={user.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <span className="text-white font-bold text-sm">
                                    {(user?.full_name || user?.email)?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    user?.role === UserRole.ADMIN && "bg-blue-500/20 text-blue-300",
                                    user?.role === UserRole.PASSAGEIRO && "bg-green-500/20 text-green-300"
                                )}>
                                    {user?.role === UserRole.ADMIN && "Admin"}
                                    {user?.role === UserRole.PASSAGEIRO && "Passageiro"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40"
                    >
                        <LogOut size={18} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    'min-h-screen',
                    user ? 'lg:ml-72' : 'lg:ml-0',
                    'pt-20 px-2 pb-8 lg:px-4'
                )}
            >
                <Outlet />
            </main>

            <RegistrationModal
                isOpen={showRegistrationModal}
                onClose={() => setShowRegistrationModal(false)}
            />

            <TripContextModal />

            {user?.role === UserRole.PASSAGEIRO && user.id && (
                <MissingDetailsModal
                    isOpen={showMissingDetailsModal}
                    passengerId={user.id}
                    onSuccess={() => setShowMissingDetailsModal(false)}
                />
            )}
        </div>
    );
};
