export type UserRole = 'guest' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  /** The IvStay team has confirmed this number belongs to the customer */
  phone_verified?: boolean;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type PropertyCategory = 'bnbs_and_villas' | 'hotels' | 'home_stays';
export type PropertyType = 'villa' | 'bnb' | 'hotel' | 'resort' | 'home_stay';
export type PropertyStatus = 'active' | 'draft' | 'archived';

export type CancellationPolicy = 'Flexible' | 'Moderate' | 'Strict';

/** One listing photo: uploaded to storage, or hosted elsewhere. */
export interface PropertyPhoto {
  /** Path inside the property-images bucket, for uploaded photos */
  storage_path?: string | null;
  /** Full URL, for photos hosted elsewhere */
  external_url?: string | null;
  /** The URL to display */
  url: string;
  alt_text?: string;
}

/**
 * A stay as the app uses it. Money is in rupees here; the database stores whole paise
 * (see src/lib/db.ts for the conversion).
 */
export interface Property {
  id: string;
  /** Readable URL name, e.g. pinewood-manor-kasauli */
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: PropertyCategory;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  zip_code?: string | null;
  latitude: number | null;
  longitude: number | null;
  price_per_night: number;
  /** Friday and Saturday nights; null means the normal price */
  weekend_surge_price?: number | null;
  cleaning_fee: number;
  service_fee_pct: number; // e.g. 10 for 10%
  /** Guests included in the nightly price */
  base_guests: number;
  /** Per extra guest above base_guests, per night */
  extra_guest_fee: number;
  min_nights: number;
  cancellation_policy: CancellationPolicy;
  max_guests: number;
  /** null = not specified */
  bedrooms: number | null;
  beds: number | null;
  bathrooms: number | null;
  amenities: string[];
  /** Display URLs in order; the first is the cover photo */
  images: string[];
  photos: PropertyPhoto[];
  status: PropertyStatus;
  is_verified: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
  host_name?: string | null;
  host_avatar?: string;
  host_joined?: string;
  created_at: string;
}

/** What the admin wizard saves (everything the admin can edit). */
export type PropertyInput = Omit<Property, 'id' | 'slug' | 'images' | 'rating' | 'review_count' | 'created_at'>;

/**
 * enquiry: a request; doesn't hold the dates.
 * awaiting_payment: payment link sent; dates held.
 * confirmed / completed / cancelled: as named.
 */
export type BookingStatus = 'enquiry' | 'awaiting_payment' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
export type BookingSource = 'website' | 'whatsapp' | 'phone' | 'walk_in' | 'other';
export type LedgerStatus = 'pending' | 'paid';

/** A booking as the app uses it. Money is in rupees. */
export interface Booking {
  id: string;
  /** Human-friendly reference, e.g. IVS-1001 */
  reference: string;
  property_id: string;
  guest_name: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD (the guest leaves; this night is free)
  nights: number;
  adults: number;
  children: number;
  pets: number;
  nightly_total: number;
  extra_guest_total: number;
  cleaning_fee: number;
  service_fee: number;
  /** The quoted total for the stay */
  total_price: number;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  source: BookingSource;
  special_requests?: string | null;
  admin_notes?: string | null;
  // Ledger: what the guest pays IvStay, and what IvStay pays the owner
  customer_rate?: number | null;
  customer_payment_date?: string | null;
  customer_payment_status: LedgerStatus;
  owner_rate?: number | null;
  owner_payment_date?: string | null;
  owner_payment_status: LedgerStatus;
  created_at: string;
  // From the linked property
  property_title?: string;
  property_city?: string;
}

/** What the admin ledger can set when creating or editing a booking. */
export type BookingInput = Pick<
  Booking,
  | 'property_id'
  | 'guest_name'
  | 'guest_email'
  | 'guest_phone'
  | 'check_in'
  | 'check_out'
  | 'adults'
  | 'children'
  | 'booking_status'
  | 'payment_status'
  | 'source'
  | 'special_requests'
  | 'admin_notes'
  | 'customer_rate'
  | 'customer_payment_date'
  | 'customer_payment_status'
  | 'owner_rate'
  | 'owner_payment_date'
  | 'owner_payment_status'
>;

/** Dates an admin has closed (maintenance or owner use). ends_on is exclusive. */
export interface AvailabilityBlock {
  id: string;
  property_id: string;
  starts_on: string;
  ends_on: string;
  reason: 'maintenance' | 'owner_use' | 'other';
  note?: string | null;
}

/** A price quote, in rupees. */
export interface StayQuote {
  ok: boolean;
  problems: string[];
  nights: number;
  weekend_nights: number;
  guests: number;
  extra_guests: number;
  nightly_total: number;
  extra_guest_total: number;
  cleaning_fee: number;
  service_fee: number;
  total: number;
}

/** A date range that can't be booked (from bookings or blocks). ends_on is exclusive. */
export interface UnavailableRange {
  starts_on: string;
  ends_on: string;
}

export interface ReviewSubRatings {
  cleanliness: number;
  accuracy: number;
  communication: number;
  location: number;
  value: number;
}

export interface Review {
  id: string;
  property_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  sub_ratings: ReviewSubRatings;
  comment: string;
  created_at: string;
}

export interface FilterState {
  category: 'all' | 'bnbs_and_villas' | 'hotels' | 'home_stays';
  destination: string;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  priceRange: [number, number];
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  instantBookOnly: boolean;
}
