import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookingStore = create(
  persist(
    (set) => ({
      selectedRoom: null,
      checkIn: null,
      checkOut: null,
      guests: 1,
      reservation: null,

      setSearchParams: (checkIn, checkOut, guests) =>
        set({ checkIn, checkOut, guests }),

      setSelectedRoom: (room) =>
        set({ selectedRoom: room }),

      setReservation: (reservation) =>
        set({ reservation }),

      clearBooking: () =>
        set({
          selectedRoom: null,
          checkIn: null,
          checkOut: null,
          guests: 1,
          reservation: null,
        }),
    }),
    {
      name: 'booking-storage',
    }
  )
);
