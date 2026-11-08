export type UserRole = 'guest' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type PropertyCategory = 'bnbs_and_villas' | 'hotels' | 'home_stays';
export type PropertyType = 'villa' | 'bnb' | 'hotel' | 'resort' | 'home_stay';
export type PropertyStatus = 'active' | 'draft' | 'archived';

export interface Property {
  id: string;
  title: string;
  tagline: string;
  description: string;
  category: PropertyCategory;
  property_type: PropertyType;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  weekend_surge_price?: number;
  cleaning_fee: number;
  service_fee_pct: number; // e.g. 10 for 10%
  min_nights?: number;
  cancellation_policy?: 'Flexible' | 'Moderate' | 'Strict';
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  is_verified?: boolean;
  is_featured?: boolean;
  rating: number;
  review_count: number;
  host_name?: string;
  host_avatar?: string;
  host_joined?: string;
  blocked_dates?: string[]; // ISO format YYYY-MM-DD
  created_at: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded';
export type PaymentMethod = 'card' | 'netbanking' | 'upi';

export interface Booking {
  id: string;
  property_id: string;
  user_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  total_guests: number;
  adults: number;
  children: number;
  pets: number;
  nightly_price: number;
  total_nights: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  special_requests?: string;
  booking_status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  transaction_id?: string;
  customer_rate?: number;
  customer_payment_date?: string;
  customer_payment_status?: 'paid' | 'pending';
  owner_rate?: number;
  owner_payment_date?: string;
  owner_payment_status?: 'paid' | 'pending';
  created_at: string;
  // Joined preview property
  property_title?: string;
  property_image?: string;
  property_city?: string;
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
