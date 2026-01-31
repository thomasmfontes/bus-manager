import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtectedRoute } from './RoleProtectedRoute';
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout';
import { Login } from '@/pages/Login/Login';
import { AdminLogin } from '@/pages/Login/AdminLogin';
import { UserLogin } from '@/pages/Login/UserLogin';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { BusList } from '@/pages/Onibus/BusList';
import { BusForm } from '@/pages/Onibus/BusForm';
import { TripList } from '@/pages/Viagens/TripList';
import { TripForm } from '@/pages/Viagens/TripForm';
import { TripSeatMap } from '@/pages/Viagens/TripSeatMap';
import { PassengerList } from '@/pages/Passageiros/PassengerList';
import { PassengerForm } from '@/pages/Passageiros/PassengerForm';
import { Financeiro } from '@/pages/Financeiro/Financeiro';
import { Settings } from '@/pages/Settings/Settings';
import ExcursaoForm from '@/pages/ExcursaoForm';
import Success from '@/pages/Success';
import { TripPaymentCenter } from '@/pages/TripPaymentCenter';
import { Statement } from '@/pages/Financeiro/Statement';
import { UserRole } from '@/types';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/login/admin',
        element: <AdminLogin />,
    },
    {
        path: '/login/user',
        element: <UserLogin />,
    },
    {
        path: '/success',
        element: <Success />,
    },
    {
        path: '/excursao',
        element: <ExcursaoForm />,
    },
    {
        path: '/',
        element: <AuthenticatedLayout />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'pagamento',
                element: <TripPaymentCenter />,
            },
            {
                path: 'onibus',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <BusList />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'onibus/novo',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <BusForm />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'onibus/editar/:id',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <BusForm />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'viagens',
                element: (
                    <ProtectedRoute>
                        <TripList />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'viagens/nova',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <TripForm />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'viagens/:id',
                element: (
                    <ProtectedRoute>
                        <TripSeatMap />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'passageiros',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <PassengerList />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'passageiros/novo',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <PassengerForm />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'passageiros/editar/:id',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <PassengerForm />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'financeiro',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <Financeiro />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'extrato',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <Statement />
                    </RoleProtectedRoute>
                ),
            },
            {
                path: 'settings',
                element: (
                    <RoleProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PASSAGEIRO]}>
                        <Settings />
                    </RoleProtectedRoute>
                ),
            },
        ],
    },
]);
