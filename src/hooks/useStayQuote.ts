import { useEffect, useMemo, useState } from 'react';
import type { Property, StayQuote, UnavailableRange } from '../types';
import { dataSource } from '../context/PropertyContext';
import { HOLDING_STATUSES, useBookings } from '../context/BookingContext';
import { quoteLocally } from '../lib/pricing';
import * as db from '../lib/db';

/**
 * Price and availability for a stay. Shows an instant estimate (same rules as the database),
 * then the server's quote once it arrives. Without Supabase, the local result is final.
 */
export function useStayQuote(
  property: Property | undefined,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number
): { quote: StayQuote | null; isEstimate: boolean; unavailable: UnavailableRange[] } {
  const { bookings, blocks } = useBookings();
  const [serverRanges, setServerRanges] = useState<UnavailableRange[]>([]);
  const [serverQuote, setServerQuote] = useState<StayQuote | null>(null);
  const propertyId = property?.id;

  // Dates already taken (database mode)
  useEffect(() => {
    if (!propertyId || dataSource !== 'database') return;
    let active = true;
    db.fetchUnavailableRanges(propertyId)
      .then((ranges) => active && setServerRanges(ranges))
      .catch(() => active && setServerRanges([]));
    return () => {
      active = false;
    };
  }, [propertyId]);

  // Dates already taken (browser mode)
  const localRanges = useMemo<UnavailableRange[]>(() => {
    if (!propertyId || dataSource !== 'browser') return [];
    return [
      ...bookings
        .filter((b) => b.property_id === propertyId && HOLDING_STATUSES.includes(b.booking_status))
        .map((b) => ({ starts_on: b.check_in, ends_on: b.check_out })),
      ...blocks.filter((bl) => bl.property_id === propertyId).map((bl) => ({ starts_on: bl.starts_on, ends_on: bl.ends_on })),
    ].sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  }, [propertyId, bookings, blocks]);

  const unavailable = dataSource === 'database' ? serverRanges : localRanges;

  const estimate = useMemo(
    () => (property ? quoteLocally(property, checkIn, checkOut, adults, children, unavailable) : null),
    [property, checkIn, checkOut, adults, children, unavailable]
  );

  // The server's quote, fetched shortly after the inputs stop changing
  useEffect(() => {
    setServerQuote(null);
    if (!propertyId || dataSource !== 'database' || !checkIn || !checkOut || checkOut <= checkIn) return;
    let active = true;
    const timer = setTimeout(() => {
      db.quoteStay({ propertyId, checkIn, checkOut, adults, children })
        .then((quote) => active && setServerQuote(quote))
        .catch(() => {
          /* keep showing the estimate */
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [propertyId, checkIn, checkOut, adults, children]);

  return {
    quote: serverQuote ?? estimate,
    isEstimate: dataSource === 'database' && !serverQuote,
    unavailable,
  };
}
