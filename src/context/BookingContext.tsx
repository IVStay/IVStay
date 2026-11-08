import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { AvailabilityBlock, Booking, BookingInput, Property } from '../types';
import { MOCK_BOOKINGS } from '../data/mockData';
import * as db from '../lib/db';
import type { BookingRequest } from '../lib/db';
import { quoteLocally } from '../lib/pricing';
import { useAuth } from './AuthContext';
import { dataSource } from './PropertyContext';

const BOOKINGS_STORAGE_KEY = 'ivstay_bookings_list';
const BLOCKS_STORAGE_KEY = 'ivstay_availability_blocks';

/** Statuses that hold the dates (an enquiry doesn't). */
export const HOLDING_STATUSES: Booking['booking_status'][] = ['awaiting_payment', 'confirmed'];

interface BookingContextType {
  /** All bookings (admins only; empty for visitors) */
  bookings: Booking[];
  blocks: AvailabilityBlock[];
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  createBooking: (input: BookingInput) => Promise<Booking>;
  updateBooking: (id: string, patch: Partial<BookingInput>) => Promise<Booking>;
  deleteBooking: (id: string) => Promise<void>;
  addBlock: (block: Omit<AvailabilityBlock, 'id'>) => Promise<void>;
  removeBlock: (id: string) => Promise<void>;
  /** A visitor's booking request from a stay page, saved as an enquiry. Returns its reference. */
  requestBooking: (request: BookingRequest, property: Property) => Promise<{ reference: string }>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Browser-storage mode helpers (mirror the database rules)
// ---------------------------------------------------------------------------

const overlapError = () =>
  Object.assign(new Error('Those dates overlap another booking or a blocked period.'), { code: '23P01' });

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)) || 0);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

/** Fills in fields that older saved bookings don't have. */
function normalizeLocalBooking(raw: Partial<Booking> & Record<string, unknown>): Booking {
  const status = raw.booking_status === ('pending' as string) ? 'enquiry' : raw.booking_status ?? 'enquiry';
  const checkIn = raw.check_in ?? '';
  const checkOut = raw.check_out ?? '';
  return {
    id: raw.id ?? `book-${Date.now()}`,
    reference: raw.reference ?? String(raw.id ?? 'IVS-0'),
    property_id: raw.property_id ?? '',
    guest_name: raw.guest_name ?? 'Guest',
    guest_email: raw.guest_email ?? null,
    guest_phone: raw.guest_phone ?? null,
    check_in: checkIn,
    check_out: checkOut,
    nights: nightsBetween(checkIn, checkOut),
    adults: raw.adults ?? 1,
    children: raw.children ?? 0,
    pets: raw.pets ?? 0,
    nightly_total: raw.nightly_total ?? 0,
    extra_guest_total: raw.extra_guest_total ?? 0,
    cleaning_fee: raw.cleaning_fee ?? 0,
    service_fee: raw.service_fee ?? 0,
    total_price: raw.total_price ?? 0,
    booking_status: status as Booking['booking_status'],
    payment_status: raw.payment_status ?? 'unpaid',
    source: raw.source ?? 'other',
    special_requests: raw.special_requests ?? null,
    admin_notes: raw.admin_notes ?? null,
    customer_rate: raw.customer_rate ?? null,
    customer_payment_date: raw.customer_payment_date ?? null,
    customer_payment_status: raw.customer_payment_status ?? 'pending',
    owner_rate: raw.owner_rate ?? null,
    owner_payment_date: raw.owner_payment_date ?? null,
    owner_payment_status: raw.owner_payment_status ?? 'pending',
    created_at: raw.created_at ?? new Date().toISOString(),
    property_title: raw.property_title,
    property_city: raw.property_city,
  };
}

function nextReference(list: Booking[]) {
  const highest = list.reduce((max, b) => Math.max(max, Number(b.reference.replace(/\D/g, '')) || 0), 1000);
  return `IVS-${highest + 1}`;
}

// ---------------------------------------------------------------------------

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>(() =>
    dataSource === 'browser'
      ? (readLocal<unknown[]>(BOOKINGS_STORAGE_KEY, MOCK_BOOKINGS) as Array<Partial<Booking> & Record<string, unknown>>).map(
          normalizeLocalBooking
        )
      : []
  );
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>(() =>
    dataSource === 'browser' ? readLocal<AvailabilityBlock[]>(BLOCKS_STORAGE_KEY, []) : []
  );
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadRun = useRef(0);

  useEffect(() => {
    if (dataSource === 'browser') writeLocal(BOOKINGS_STORAGE_KEY, bookings);
  }, [bookings]);

  useEffect(() => {
    if (dataSource === 'browser') writeLocal(BLOCKS_STORAGE_KEY, blocks);
  }, [blocks]);

  const reload = useCallback(async () => {
    if (dataSource !== 'database') return;
    const run = ++loadRun.current;
    setLoading(true);
    try {
      const [bookingList, blockList] = await Promise.all([db.fetchBookings(), db.fetchBlocks()]);
      if (run !== loadRun.current) return;
      setBookings(bookingList);
      setBlocks(blockList);
      setLoadError(null);
    } catch (error) {
      if (run !== loadRun.current) return;
      setLoadError(db.describeError(error));
    } finally {
      if (run === loadRun.current) setLoading(false);
    }
  }, []);

  // Bookings are admin-only data: load them for admins, clear them otherwise.
  useEffect(() => {
    if (dataSource !== 'database' || authLoading) return;
    if (isAdmin) {
      void reload();
    } else {
      loadRun.current += 1;
      setBookings([]);
      setBlocks([]);
      setLoading(false);
    }
  }, [isAdmin, authLoading, reload]);

  /** Browser mode only: refuse overlaps the database would refuse. */
  const assertNoLocalConflict = useCallback(
    (candidate: Booking, ignoreId?: string) => {
      if (!HOLDING_STATUSES.includes(candidate.booking_status)) return;
      const clash =
        bookings.some(
          (b) =>
            b.id !== ignoreId &&
            b.property_id === candidate.property_id &&
            HOLDING_STATUSES.includes(b.booking_status) &&
            overlaps(b.check_in, b.check_out, candidate.check_in, candidate.check_out)
        ) ||
        blocks.some(
          (bl) =>
            bl.property_id === candidate.property_id &&
            overlaps(bl.starts_on, bl.ends_on, candidate.check_in, candidate.check_out)
        );
      if (clash) throw overlapError();
    },
    [bookings, blocks]
  );

  const createBooking = useCallback(
    async (input: BookingInput): Promise<Booking> => {
      if (dataSource === 'database') {
        try {
          const created = await db.createBooking(input);
          setBookings((prev) => [created, ...prev]);
          return created;
        } catch (error) {
          throw db.friendlyError(error);
        }
      }
      const created = normalizeLocalBooking({
        ...input,
        id: `book-${Date.now()}`,
        reference: nextReference(bookings),
        created_at: new Date().toISOString(),
      });
      assertNoLocalConflict(created);
      setBookings((prev) => [created, ...prev]);
      return created;
    },
    [bookings, assertNoLocalConflict]
  );

  const updateBooking = useCallback(
    async (id: string, patch: Partial<BookingInput>): Promise<Booking> => {
      if (dataSource === 'database') {
        try {
          const updated = await db.updateBooking(id, patch);
          setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
          return updated;
        } catch (error) {
          throw db.friendlyError(error);
        }
      }
      const current = bookings.find((b) => b.id === id);
      if (!current) throw new Error('That booking no longer exists.');
      const updated = normalizeLocalBooking({ ...current, ...patch });
      assertNoLocalConflict(updated, id);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return updated;
    },
    [bookings, assertNoLocalConflict]
  );

  const deleteBooking = useCallback(async (id: string) => {
    if (dataSource === 'database') {
      try {
        await db.deleteBooking(id);
      } catch (error) {
        throw db.friendlyError(error);
      }
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const addBlock = useCallback(
    async (block: Omit<AvailabilityBlock, 'id'>) => {
      if (dataSource === 'database') {
        try {
          const created = await db.addBlock(block);
          setBlocks((prev) => [...prev, created]);
          return;
        } catch (error) {
          throw db.friendlyError(error);
        }
      }
      const clash = bookings.some(
        (b) =>
          b.property_id === block.property_id &&
          HOLDING_STATUSES.includes(b.booking_status) &&
          overlaps(b.check_in, b.check_out, block.starts_on, block.ends_on)
      );
      if (clash) throw overlapError();
      setBlocks((prev) => [...prev, { ...block, id: `block-${Date.now()}` }]);
    },
    [bookings]
  );

  const removeBlock = useCallback(async (id: string) => {
    if (dataSource === 'database') {
      try {
        await db.removeBlock(id);
      } catch (error) {
        throw db.friendlyError(error);
      }
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const requestBooking = useCallback(
    async (request: BookingRequest, property: Property): Promise<{ reference: string }> => {
      if (dataSource === 'database') {
        try {
          const { reference } = await db.requestBooking(request);
          return { reference };
        } catch (error) {
          throw db.friendlyError(error);
        }
      }
      const quote = quoteLocally(property, request.checkIn, request.checkOut, request.adults, request.children);
      const created = normalizeLocalBooking({
        id: `book-${Date.now()}`,
        reference: nextReference(bookings),
        property_id: property.id,
        property_title: property.title,
        property_city: property.city,
        guest_name: request.guestName,
        guest_phone: request.guestPhone ?? null,
        guest_email: request.guestEmail ?? null,
        check_in: request.checkIn,
        check_out: request.checkOut,
        adults: request.adults,
        children: request.children,
        nightly_total: quote.nightly_total,
        extra_guest_total: quote.extra_guest_total,
        cleaning_fee: quote.cleaning_fee,
        service_fee: quote.service_fee,
        total_price: quote.total,
        booking_status: 'enquiry',
        source: 'website',
        special_requests: request.specialRequests ?? null,
      });
      setBookings((prev) => [created, ...prev]);
      return { reference: created.reference };
    },
    [bookings]
  );

  const value = useMemo<BookingContextType>(
    () => ({
      bookings,
      blocks,
      loading,
      loadError,
      reload,
      createBooking,
      updateBooking,
      deleteBooking,
      addBlock,
      removeBlock,
      requestBooking,
    }),
    [bookings, blocks, loading, loadError, reload, createBooking, updateBooking, deleteBooking, addBlock, removeBlock, requestBooking]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};
