// Everything that reads or writes the Supabase database lives here.
// The app works in rupees; the database stores whole paise (₹1 = 100). Conversions happen here.

import { supabase } from './supabase';
import type { Database, Json } from '../types/database';
import type {
  AvailabilityBlock,
  Booking,
  BookingInput,
  Property,
  PropertyInput,
  PropertyPhoto,
  StayQuote,
  UnavailableRange,
} from '../types';

type Tables = Database['public']['Tables'];
type PropertyRow = Tables['properties']['Row'];
type BookingRow = Tables['bookings']['Row'];

export const PHOTO_BUCKET = 'property-images';

const PROPERTY_SELECT = '*, property_images(storage_path, external_url, alt_text, sort_order)' as const;
const BOOKING_SELECT = '*, property:properties(title, city)' as const;

const toPaise = (rupees: number | null | undefined) => Math.round((rupees ?? 0) * 100);
const toRupees = (paise: number | null | undefined) => (paise ?? 0) / 100;
const toOptionalPaise = (rupees: number | null | undefined) =>
  rupees == null || Number.isNaN(rupees) ? null : Math.round(rupees * 100);
const toOptionalRupees = (paise: number | null | undefined) => (paise == null ? null : paise / 100);

function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/** An Error with a readable message that keeps the database error code (e.g. 22023). */
export function friendlyError(error: unknown): Error & { code?: string } {
  const code = (error as { code?: string } | null)?.code;
  return Object.assign(new Error(describeError(error)), { code });
}

/** Turns database errors into messages an admin or guest can act on. */
export function describeError(error: unknown): string {
  const e = (error ?? {}) as { code?: string; message?: string };
  switch (e.code) {
    case '23P01':
      return 'Those dates overlap another booking or a blocked period.';
    case '23503':
      return 'This stay still has bookings, so it can\'t be deleted. Archive it instead.';
    case '42501':
      return "You don't have permission to do that. Try signing in again.";
    case '23514':
      return 'Some details are missing or invalid.';
    case '23505':
      return 'That already exists.';
    default:
      break;
  }
  if (/failed to fetch|network|load failed/i.test(e.message ?? '')) {
    return "Can't reach the server. Check your internet connection and try again.";
  }
  return e.message || 'Something went wrong.';
}

// ---------------------------------------------------------------------------
// Properties and photos
// ---------------------------------------------------------------------------

export function photoUrl(photo: Pick<PropertyPhoto, 'storage_path' | 'external_url'>): string {
  if (photo.storage_path) return db().storage.from(PHOTO_BUCKET).getPublicUrl(photo.storage_path).data.publicUrl;
  return photo.external_url ?? '';
}

type ImageRow = { storage_path: string | null; external_url: string | null; alt_text: string; sort_order: number };

function toProperty(row: PropertyRow & { property_images?: ImageRow[] | null }): Property {
  const photos: PropertyPhoto[] = [...(row.property_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => ({
      storage_path: img.storage_path,
      external_url: img.external_url,
      alt_text: img.alt_text,
      url: photoUrl(img),
    }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    category: row.category as Property['category'],
    property_type: row.property_type as Property['property_type'],
    address: row.address,
    city: row.city,
    state: row.state,
    zip_code: row.zip_code,
    latitude: row.latitude,
    longitude: row.longitude,
    price_per_night: toRupees(row.price_per_night_paise),
    weekend_surge_price: toOptionalRupees(row.weekend_price_per_night_paise),
    cleaning_fee: toRupees(row.cleaning_fee_paise),
    service_fee_pct: Number(row.service_fee_pct),
    base_guests: row.base_guests,
    extra_guest_fee: toRupees(row.extra_guest_fee_paise),
    min_nights: row.min_nights,
    cancellation_policy: row.cancellation_policy as Property['cancellation_policy'],
    max_guests: row.max_guests,
    bedrooms: row.bedrooms,
    beds: row.beds,
    bathrooms: row.bathrooms == null ? null : Number(row.bathrooms),
    amenities: row.amenities ?? [],
    images: photos.map((p) => p.url).filter(Boolean),
    photos,
    status: row.status as Property['status'],
    is_verified: row.is_verified,
    is_featured: row.is_featured,
    rating: Number(row.rating),
    review_count: row.review_count,
    host_name: row.host_name,
    created_at: row.created_at,
  };
}

// The slug is left out: the database makes one from the title on insert and keeps it stable after.
function toPropertyRow(input: PropertyInput): Omit<Tables['properties']['Insert'], 'slug'> {
  return {
    title: input.title.trim(),
    tagline: input.tagline.trim(),
    description: input.description.trim(),
    category: input.category,
    property_type: input.property_type,
    status: input.status,
    address: input.address.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    zip_code: input.zip_code?.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    price_per_night_paise: toPaise(input.price_per_night),
    // 0 or empty means "same as the normal price"
    weekend_price_per_night_paise: input.weekend_surge_price ? toOptionalPaise(input.weekend_surge_price) : null,
    cleaning_fee_paise: toPaise(input.cleaning_fee),
    service_fee_pct: input.service_fee_pct,
    base_guests: input.base_guests,
    max_guests: input.max_guests,
    extra_guest_fee_paise: toPaise(input.extra_guest_fee),
    min_nights: input.min_nights,
    cancellation_policy: input.cancellation_policy,
    bedrooms: input.bedrooms,
    beds: input.beds,
    bathrooms: input.bathrooms,
    amenities: input.amenities,
    is_verified: input.is_verified,
    is_featured: input.is_featured,
    host_name: input.host_name?.trim() || null,
  };
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await db()
    .from('properties')
    .select(PROPERTY_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toProperty);
}

/** Saves the photo list for a stay: new rows first, then removes the old ones and unused files. */
async function replacePhotos(propertyId: string, photos: PropertyPhoto[]) {
  const client = db();
  const { data: existing, error: readError } = await client
    .from('property_images')
    .select('id, storage_path')
    .eq('property_id', propertyId);
  if (readError) throw readError;

  if (photos.length) {
    const { error } = await client.from('property_images').insert(
      photos.map((photo, index) => ({
        property_id: propertyId,
        storage_path: photo.storage_path || null,
        external_url: photo.storage_path ? null : photo.external_url || photo.url,
        alt_text: photo.alt_text ?? '',
        sort_order: index,
      }))
    );
    if (error) throw error;
  }

  const oldIds = (existing ?? []).map((row) => row.id);
  if (oldIds.length) {
    const { error } = await client.from('property_images').delete().in('id', oldIds);
    if (error) throw error;
  }

  const kept = new Set(photos.map((p) => p.storage_path).filter(Boolean));
  const unused = (existing ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => !!path && !kept.has(path));
  if (unused.length) {
    // Best effort: a leftover file is harmless
    await client.storage.from(PHOTO_BUCKET).remove(unused);
  }
}

/** Creates a stay (existingId omitted) or updates one, including its photos. */
export async function saveProperty(input: PropertyInput, existingId?: string): Promise<Property> {
  const client = db();
  const row = toPropertyRow(input);
  const result = existingId
    ? await client.from('properties').update(row).eq('id', existingId).select('id').single()
    : await client.from('properties').insert({ ...row, slug: '' }).select('id').single();
  if (result.error) throw result.error;

  await replacePhotos(result.data.id, input.photos);

  const { data, error } = await client.from('properties').select(PROPERTY_SELECT).eq('id', result.data.id).single();
  if (error) throw error;
  return toProperty(data);
}

export async function updatePropertyFields(
  id: string,
  fields: Partial<Pick<PropertyInput, 'status' | 'is_featured' | 'is_verified'>>
): Promise<void> {
  const { error } = await db().from('properties').update(fields).eq('id', id);
  if (error) throw error;
}

export async function deleteProperty(id: string): Promise<void> {
  const client = db();
  const { data: images } = await client.from('property_images').select('storage_path').eq('property_id', id);
  const { error } = await client.from('properties').delete().eq('id', id);
  if (error) throw error;
  const paths = (images ?? []).map((row) => row.storage_path).filter((p): p is string => !!p);
  if (paths.length) await client.storage.from(PHOTO_BUCKET).remove(paths);
}

/** Uploads one photo to storage. It's attached to a stay when the stay is saved. */
export async function uploadPhoto(file: File): Promise<PropertyPhoto> {
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `uploads/${crypto.randomUUID()}.${extension}`;
  const { error } = await db()
    .storage.from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, cacheControl: '31536000' });
  if (error) throw error;
  return { storage_path: path, url: photoUrl({ storage_path: path }), alt_text: '' };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

function toBooking(row: BookingRow & { property?: { title: string; city: string } | null }): Booking {
  return {
    id: row.id,
    reference: row.reference,
    property_id: row.property_id,
    guest_name: row.guest_name,
    guest_email: row.guest_email,
    guest_phone: row.guest_phone,
    check_in: row.check_in,
    check_out: row.check_out,
    nights: row.nights ?? 0,
    adults: row.adults,
    children: row.children,
    pets: row.pets,
    nightly_total: toRupees(row.nightly_total_paise),
    extra_guest_total: toRupees(row.extra_guest_total_paise),
    cleaning_fee: toRupees(row.cleaning_fee_paise),
    service_fee: toRupees(row.service_fee_paise),
    total_price: toRupees(row.total_paise),
    booking_status: row.status as Booking['booking_status'],
    payment_status: row.payment_status as Booking['payment_status'],
    source: row.source as Booking['source'],
    special_requests: row.special_requests,
    admin_notes: row.admin_notes,
    customer_rate: toOptionalRupees(row.customer_rate_paise),
    customer_payment_date: row.customer_payment_date,
    customer_payment_status: row.customer_payment_status as Booking['customer_payment_status'],
    owner_rate: toOptionalRupees(row.owner_rate_paise),
    owner_payment_date: row.owner_payment_date,
    owner_payment_status: row.owner_payment_status as Booking['owner_payment_status'],
    created_at: row.created_at,
    property_title: row.property?.title,
    property_city: row.property?.city,
  };
}

function toBookingRow(input: Partial<BookingInput>): Tables['bookings']['Update'] {
  const row: Tables['bookings']['Update'] = {};
  if (input.property_id !== undefined) row.property_id = input.property_id;
  if (input.guest_name !== undefined) row.guest_name = input.guest_name.trim();
  if (input.guest_email !== undefined) row.guest_email = input.guest_email?.trim() || null;
  if (input.guest_phone !== undefined) row.guest_phone = input.guest_phone?.trim() || null;
  if (input.check_in !== undefined) row.check_in = input.check_in;
  if (input.check_out !== undefined) row.check_out = input.check_out;
  if (input.adults !== undefined) row.adults = input.adults;
  if (input.children !== undefined) row.children = input.children;
  if (input.booking_status !== undefined) row.status = input.booking_status;
  if (input.payment_status !== undefined) row.payment_status = input.payment_status;
  if (input.source !== undefined) row.source = input.source;
  if (input.special_requests !== undefined) row.special_requests = input.special_requests || null;
  if (input.admin_notes !== undefined) row.admin_notes = input.admin_notes || null;
  if (input.customer_rate !== undefined) row.customer_rate_paise = toOptionalPaise(input.customer_rate);
  if (input.customer_payment_date !== undefined) row.customer_payment_date = input.customer_payment_date || null;
  if (input.customer_payment_status !== undefined) row.customer_payment_status = input.customer_payment_status;
  if (input.owner_rate !== undefined) row.owner_rate_paise = toOptionalPaise(input.owner_rate);
  if (input.owner_payment_date !== undefined) row.owner_payment_date = input.owner_payment_date || null;
  if (input.owner_payment_status !== undefined) row.owner_payment_status = input.owner_payment_status;
  return row;
}

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await db().from('bookings').select(BOOKING_SELECT).order('check_in', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toBooking);
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const { data, error } = await db()
    .from('bookings')
    .insert(toBookingRow(input) as Tables['bookings']['Insert'])
    .select(BOOKING_SELECT)
    .single();
  if (error) throw error;
  return toBooking(data);
}

export async function updateBooking(id: string, patch: Partial<BookingInput>): Promise<Booking> {
  const { data, error } = await db().from('bookings').update(toBookingRow(patch)).eq('id', id).select(BOOKING_SELECT).single();
  if (error) throw error;
  return toBooking(data);
}

export async function deleteBooking(id: string): Promise<void> {
  const { error } = await db().from('bookings').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Availability blocks
// ---------------------------------------------------------------------------

export async function fetchBlocks(): Promise<AvailabilityBlock[]> {
  const { data, error } = await db().from('availability_blocks').select('*').order('starts_on');
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, reason: row.reason as AvailabilityBlock['reason'] }));
}

export async function addBlock(block: Omit<AvailabilityBlock, 'id'>): Promise<AvailabilityBlock> {
  const { data, error } = await db().from('availability_blocks').insert(block).select('*').single();
  if (error) throw error;
  return { ...data, reason: data.reason as AvailabilityBlock['reason'] };
}

export async function removeBlock(id: string): Promise<void> {
  const { error } = await db().from('availability_blocks').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Public functions: quotes, availability and booking requests
// ---------------------------------------------------------------------------

function toQuote(json: Json): StayQuote {
  const q = (json ?? {}) as Record<string, unknown>;
  const rupees = (key: string) => toRupees(Number(q[key] ?? 0));
  return {
    ok: q.ok === true,
    problems: Array.isArray(q.problems) ? (q.problems as string[]) : [],
    nights: Number(q.nights ?? 0),
    weekend_nights: Number(q.weekend_nights ?? 0),
    guests: Number(q.guests ?? 0),
    extra_guests: Number(q.extra_guests ?? 0),
    nightly_total: rupees('nightly_total_paise'),
    extra_guest_total: rupees('extra_guest_total_paise'),
    cleaning_fee: rupees('cleaning_fee_paise'),
    service_fee: rupees('service_fee_paise'),
    total: rupees('total_paise'),
  };
}

export async function quoteStay(args: {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): Promise<StayQuote> {
  const { data, error } = await db().rpc('quote_stay', {
    p_property_id: args.propertyId,
    p_check_in: args.checkIn,
    p_check_out: args.checkOut,
    p_adults: args.adults,
    p_children: args.children,
  });
  if (error) throw error;
  return toQuote(data);
}

export async function fetchUnavailableRanges(propertyId: string): Promise<UnavailableRange[]> {
  const { data, error } = await db().rpc('get_unavailable_ranges', { p_property_id: propertyId });
  if (error) throw error;
  return (data ?? []) as UnavailableRange[];
}

export interface BookingRequest {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  adults: number;
  children: number;
  specialRequests?: string;
}

/** Saves a website booking request (an enquiry). Returns its reference and the server's quote. */
export async function requestBooking(request: BookingRequest): Promise<{ reference: string; quote: StayQuote }> {
  const { data, error } = await db().rpc('request_booking', {
    p_property_id: request.propertyId,
    p_check_in: request.checkIn,
    p_check_out: request.checkOut,
    p_guest_name: request.guestName,
    p_guest_phone: request.guestPhone || undefined,
    p_guest_email: request.guestEmail || undefined,
    p_adults: request.adults,
    p_children: request.children,
    p_special_requests: request.specialRequests || undefined,
  });
  if (error) throw error;
  const result = (data ?? {}) as { reference?: string; quote?: Json };
  return { reference: result.reference ?? '', quote: toQuote(result.quote ?? {}) };
}

/** Asks the notify-booking Edge Function to email the team (and the guest). Never throws. */
export async function notifyBooking(reference: string): Promise<void> {
  try {
    const { error } = await db().functions.invoke('notify-booking', { body: { reference } });
    if (error) console.warn('Booking alert email was not sent:', error.message);
  } catch (error) {
    console.warn('Booking alert email was not sent:', error);
  }
}

// ---------------------------------------------------------------------------
// Customer accounts
// ---------------------------------------------------------------------------

export interface MyBooking {
  reference: string;
  property_id: string;
  property_title: string;
  property_slug: string;
  property_city: string;
  check_in: string;
  check_out: string;
  nights: number;
  adults: number;
  children: number;
  total: number;
  status: string;
  created_at: string;
}

/** The signed-in customer's booking requests and stays. */
export async function fetchMyBookings(): Promise<MyBooking[]> {
  const { data, error } = await db().rpc('my_bookings');
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, total: toRupees(row.total_paise) }));
}

export interface Customer {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  phone_verified_at: string | null;
  provider: string;
  created_at: string;
  last_sign_in_at: string | null;
  booking_count: number;
  last_request_at: string | null;
}

/** Every customer account (admins only). */
export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await db().rpc('admin_list_customers');
  if (error) throw error;
  return (data ?? []).map((row) => ({ ...row, booking_count: Number(row.booking_count) }));
}

/** Marks a customer's phone number as confirmed by the team, or clears it (admins only). */
export async function setPhoneVerified(userId: string, verified: boolean): Promise<string | null> {
  const { data, error } = await db().rpc('admin_set_phone_verified', { p_user_id: userId, p_verified: verified });
  if (error) throw error;
  return (data as string | null) ?? null;
}
