import { http, HttpResponse } from 'msw';
import {
    mockBuses,
    mockPassengers,
    mockTrips,
    mockSeatAssignments,
    initializeSeatsForTrip,
} from './data';
import { Bus, Passenger, Trip, SeatAssignment } from '@/types';

// In-memory storage
// We need to use the imported mutable arrays directly or keep local references consistent
// For simplicity in this mock setup, we'll assume the imported arrays are the source of truth
// but since we can't easily mutate imports, we'll use local variables initialized from them.
// Note: In a real app with HMR, this state resets on reload.
let buses = [...mockBuses];
let passengers = [...mockPassengers];
let trips = [...mockTrips];
let seatAssignments = [...mockSeatAssignments];

export const handlers = [
    // Buses endpoints
    http.get('/api/onibus', () => {
        return HttpResponse.json(buses);
    }),

    http.post('/api/onibus', async ({ request }) => {
        const newBus = (await request.json()) as Omit<Bus, 'id'>;
        const bus: Bus = {
            ...newBus,
            id: String(buses.length + 1),
        };
        buses.push(bus);
        return HttpResponse.json(bus, { status: 201 });
    }),

    http.put('/api/onibus/:id', async ({ params, request }) => {
        const { id } = params;
        const updates = (await request.json()) as Partial<Bus>;
        const index = buses.findIndex((b) => b.id === id);
        if (index !== -1) {
            buses[index] = { ...buses[index], ...updates };
            return HttpResponse.json(buses[index]);
        }
        return HttpResponse.json({ error: 'Bus not found' }, { status: 404 });
    }),

    http.delete('/api/onibus/:id', ({ params }) => {
        const { id } = params;
        buses = buses.filter((b) => b.id !== id);
        return HttpResponse.json({ success: true });
    }),

    // Passengers endpoints
    http.get('/api/passageiros', () => {
        return HttpResponse.json(passengers);
    }),

    http.post('/api/passageiros', async ({ request }) => {
        const newPassenger = (await request.json()) as Omit<Passenger, 'id'>;
        const passenger: Passenger = {
            ...newPassenger,
            id: String(passengers.length + 1),
        };
        passengers.push(passenger);
        return HttpResponse.json(passenger, { status: 201 });
    }),

    http.put('/api/passageiros/:id', async ({ params, request }) => {
        const { id } = params;
        const updates = (await request.json()) as Partial<Passenger>;
        const index = passengers.findIndex((p) => p.id === id);
        if (index !== -1) {
            passengers[index] = { ...passengers[index], ...updates };
            return HttpResponse.json(passengers[index]);
        }
        return HttpResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }),

    http.delete('/api/passageiros/:id', ({ params }) => {
        const { id } = params;
        passengers = passengers.filter((p) => p.id !== id);
        return HttpResponse.json({ success: true });
    }),

    // Delete all passengers
    http.delete('/api/passageiros', () => {
        passengers = [];
        return HttpResponse.json({ success: true });
    }),

    // Trips endpoints
    http.get('/api/viagens', () => {
        return HttpResponse.json(trips);
    }),

    http.post('/api/viagens', async ({ request }) => {
        const newTrip = (await request.json()) as Omit<Trip, 'id'>;
        const trip: Trip = {
            ...newTrip,
            id: String(trips.length + 1),
        };
        trips.push(trip);

        // Initialize seats for the new trip
        const tripBuses = buses.filter((b) => trip.onibusIds.includes(b.id));
        const newSeats = initializeSeatsForTrip(trip.id, tripBuses);
        seatAssignments = [...seatAssignments, ...newSeats];

        return HttpResponse.json(trip, { status: 201 });
    }),

    http.put('/api/viagens/:id', async ({ params, request }) => {
        const { id } = params;
        const updates = (await request.json()) as Partial<Trip>;
        const index = trips.findIndex((t) => t.id === id);
        if (index !== -1) {
            trips[index] = { ...trips[index], ...updates };
            return HttpResponse.json(trips[index]);
        }
        return HttpResponse.json({ error: 'Trip not found' }, { status: 404 });
    }),

    http.delete('/api/viagens/:id', ({ params }) => {
        const { id } = params;
        trips = trips.filter((t) => t.id !== id);
        seatAssignments = seatAssignments.filter((s) => s.viagemId !== id);
        return HttpResponse.json({ success: true });
    }),

    // Seat assignments endpoints
    http.get('/api/viagens/:id/assentos', ({ params }) => {
        const { id } = params;
        const trip = trips.find((t) => t.id === id);
        if (!trip) {
            return HttpResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        const tripBuses = buses.filter((b) => trip.onibusIds.includes(b.id));

        // Ensure all seats are initialized
        // In a real app, this would be done at trip creation or on demand
        // Here we mix in-memory state with the helper
        // We need to check if we already have assignments for this trip in our local state
        const existingSeats = seatAssignments.filter((s) => s.viagemId === id);

        if (existingSeats.length === 0 && tripBuses.length > 0) {
            const newSeats = initializeSeatsForTrip(id as string, tripBuses);
            seatAssignments = [...seatAssignments, ...newSeats];
            return HttpResponse.json(newSeats);
        }

        return HttpResponse.json(existingSeats);
    }),

    http.post('/api/viagens/:id/assentos', async ({ params, request }) => {
        const { id } = params;
        const data = (await request.json()) as Partial<SeatAssignment>;

        const existingIndex = seatAssignments.findIndex(
            (s) => s.viagemId === id && s.onibusId === data.onibusId && s.assentoCodigo === data.assentoCodigo
        );

        const assignment: SeatAssignment = {
            viagemId: id as string,
            onibusId: data.onibusId!,
            assentoCodigo: data.assentoCodigo!,
            passageiroId: data.passageiroId,
            status: data.status!,
        };

        if (existingIndex !== -1) {
            seatAssignments[existingIndex] = assignment;
        } else {
            seatAssignments.push(assignment);
        }

        return HttpResponse.json(assignment, { status: 201 });
    }),

    http.put('/api/viagens/:id/assentos/:seatCode', async ({ params, request }) => {
        const { id, seatCode } = params;
        const updates = (await request.json()) as Partial<SeatAssignment>;

        // We need onibusId to identify the seat uniquely
        const onibusId = updates.onibusId;
        if (!onibusId) {
            return HttpResponse.json({ error: 'onibusId is required' }, { status: 400 });
        }

        const index = seatAssignments.findIndex(
            (s) => s.viagemId === id && s.assentoCodigo === seatCode && s.onibusId === onibusId
        );

        if (index !== -1) {
            seatAssignments[index] = { ...seatAssignments[index], ...updates };
            return HttpResponse.json(seatAssignments[index]);
        }

        return HttpResponse.json({ error: 'Seat assignment not found' }, { status: 404 });
    }),
];
