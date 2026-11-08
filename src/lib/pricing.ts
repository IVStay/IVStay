import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Property, StayQuote, UnavailableRange } from '../types';

const emptyQuote = (problem: string): StayQuote => ({
  ok: false,
  problems: [problem],
  nights: 0,
  weekend_nights: 0,
  guests: 0,
  extra_guests: 0,
  nightly_total: 0,
  extra_guest_total: 0,
  cleaning_fee: 0,
  service_fee: 0,
  total: 0,
});

/**
 * The same rules as the database's quote_stay function: Friday and Saturday nights use the
 * weekend price, guests above base_guests pay the extra-guest fee per night, and the service fee
 * is a percentage of those two. Used when there's no Supabase, and as an instant estimate while
 * the server's quote loads. Calculated in paise to round exactly like the database.
 */
export function quoteLocally(
  property: Property,
  checkIn: string,
  checkOut: string,
  adults: number,
  children: number,
  unavailable: UnavailableRange[] = []
): StayQuote {
  if (!checkIn || !checkOut) return emptyQuote('Choose your dates');
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
  if (!Number.isFinite(nights) || nights < 1) return emptyQuote('Check-out must be after check-in');
  if (nights > 90) return emptyQuote('Stays longer than 90 nights need a custom quote');

  const guests = Math.max(adults, 0) + Math.max(children, 0);
  const problems: string[] = [];
  if (checkIn < format(new Date(), 'yyyy-MM-dd')) problems.push('Check-in is in the past');
  if (adults < 1) problems.push('At least one adult is required');
  if (nights < property.min_nights) problems.push(`Minimum stay is ${property.min_nights} nights`);
  if (guests > property.max_guests) problems.push(`This stay sleeps up to ${property.max_guests} guests`);
  if (unavailable.some((r) => r.starts_on < checkOut && r.ends_on > checkIn)) {
    problems.push('Those dates are not available');
  }

  let weekendNights = 0;
  for (let i = 0; i < nights; i += 1) {
    const day = addDays(parseISO(checkIn), i).getDay();
    if (day === 5 || day === 6) weekendNights += 1;
  }

  const paise = (rupees: number | null | undefined) => Math.round((rupees ?? 0) * 100);
  const weekday = paise(property.price_per_night);
  const weekend = property.weekend_surge_price ? paise(property.weekend_surge_price) : weekday;
  const nightly = (nights - weekendNights) * weekday + weekendNights * weekend;
  const extraGuests = Math.max(guests - property.base_guests, 0);
  const extra = extraGuests * paise(property.extra_guest_fee) * nights;
  const service = Math.round(((nightly + extra) * property.service_fee_pct) / 100);
  const cleaning = paise(property.cleaning_fee);

  return {
    ok: problems.length === 0,
    problems,
    nights,
    weekend_nights: weekendNights,
    guests,
    extra_guests: extraGuests,
    nightly_total: nightly / 100,
    extra_guest_total: extra / 100,
    cleaning_fee: cleaning / 100,
    service_fee: service / 100,
    total: (nightly + extra + cleaning + service) / 100,
  };
}
