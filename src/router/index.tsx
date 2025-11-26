import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout';
import { Login } from '@/pages/Login/Login';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { BusList } from '@/pages/Onibus/BusList';
import { BusForm } from '@/pages/Onibus/BusForm';
import { TripList } from '@/pages/Viagens/TripList';
import { TripForm } from '@/pages/Viagens/TripForm';
import { TripSeatMap } from '@/pages/Viagens/TripSeatMap';
import { PassengerList } from '@/pages/Passageiros/PassengerList';
import { PassengerForm } from '@/pages/Passageiros/PassengerForm';

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
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
                element: <BusList />,
            },
            {
                path: 'onibus/novo',
                element: <BusForm />,
            },
            {
                path: 'onibus/editar/:id',
                element: <BusForm />,
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
                element: <PassengerList />,
            },
            {
                path: 'passageiros/novo',
                element: <PassengerForm />,
            },
            {
                path: 'passageiros/editar/:id',
                element: <PassengerForm />,
            },
        ],
    },
]);
