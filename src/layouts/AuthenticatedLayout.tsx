import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LayoutDashboard, Bus, MapPin, Users, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { UserRole } from '@/types';

export const AuthenticatedLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
        navigate('/login');
    };

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/onibus', icon: Bus, label: 'Ônibus' },
        { path: '/viagens', icon: MapPin, label: 'Viagens' },
        { path: '/passageiros', icon: Users, label: 'Passageiros' },
    ];

    const isActive = (path: string) => location.pathname.startsWith(path);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16 px-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Toggle menu"
                    >
                        {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="font-bold text-gray-900 text-lg">Bus Manager</span>
                </div>
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
                    'lg:translate-x-0'
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

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin">
                    {menuItems
                        .filter((item) => {
                            // Hide Passageiros and Ônibus for non-admin users
                            if (user?.role !== UserRole.ADMIN) {
                                if (item.path === '/passageiros' || item.path === '/onibus') {
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
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-gray-600">
                            <span className="text-white font-bold text-sm">
                                {user?.email?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                    user?.role === UserRole.ADMIN && "bg-blue-500/20 text-blue-300",
                                    user?.role === UserRole.PASSAGEIRO && "bg-green-500/20 text-green-300",
                                    user?.role === UserRole.VISUALIZADOR && "bg-gray-500/20 text-gray-300"
                                )}>
                                    {user?.role === UserRole.ADMIN && "Admin"}
                                    {user?.role === UserRole.PASSAGEIRO && "Passageiro"}
                                    {user?.role === UserRole.VISUALIZADOR && "Visualizador"}
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
            <div className="lg:ml-72 min-h-screen">
                <main className="pt-20 lg:pt-8 px-4 py-6 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
