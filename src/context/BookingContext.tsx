import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, BookingStatus, PaymentStatus, PaymentMethod } from '../types';
import { MOCK_BOOKINGS } from '../data/mockData';

const BOOKINGS_STORAGE_KEY = 'ivstay_bookings_list';

interface DraftBooking {
  propertyId: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children: number;
  pets: number;
}

interface BookingContextType {
  bookings: Booking[];
  draftBooking: DraftBooking | null;
  setDraftBooking: (draft: DraftBooking | null) => void;
  createBooking: (
    data: Omit<Booking, 'id' | 'created_at' | 'booking_status'>
  ) => Booking;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  getBookingById: (id: string) => Booking | undefined;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
    } catch {
      return MOCK_BOOKINGS;
    }
  });

  const [draftBooking, setDraftBooking] = useState<DraftBooking | null>(null);

  useEffect(() => {
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const createBooking = (
    data: Omit<Booking, 'id' | 'created_at' | 'booking_status'>
  ): Booking => {
    const newBooking: Booking = {
      ...data,
      id: 'book-' + Math.floor(1000 + Math.random() * 9000),
      booking_status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    setBookings((prev) => [newBooking, ...prev]);
    return newBooking;
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, booking_status: status } : b))
    );
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, payment_status: status } : b))
    );
  };

  const cancelBooking = (id: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, booking_status: 'cancelled', payment_status: 'refunded' } : b
      )
    );
  };

  const updateBooking = (id: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBooking = (id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  };

  const getBookingById = (id: string) => bookings.find((b) => b.id === id);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        draftBooking,
        setDraftBooking,
        createBooking,
        updateBookingStatus,
        updatePaymentStatus,
        updateBooking,
        deleteBooking,
        cancelBooking,
        getBookingById,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
