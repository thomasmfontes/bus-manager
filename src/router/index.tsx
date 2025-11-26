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
        path: '/',
        element: (
            <ProtectedRoute>
                <AuthenticatedLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />,
            },
            {
                path: 'dashboard',
                element: <Dashboard />,
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
                element: <TripList />,
            },
            {
                path: 'viagens/nova',
                element: <TripForm />,
            },
            {
                path: 'viagens/:id',
                element: <TripSeatMap />,
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
        ],
    },
]);
