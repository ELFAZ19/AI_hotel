import { create } from 'zustand';

export const useBookingStore = create((set) => ({
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
}));
