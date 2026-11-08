import { Property, User, Booking, Review } from '../types';

export const INITIAL_ADMIN_USER: User = {
  id: 'user_admin_1',
  email: 'arnavaggarwal3095@gmail.com',
  full_name: 'Arnav Aggarwal',
  phone: '+1 (555) 019-2834',
  role: 'admin',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  created_at: '2024-01-01T08:00:00Z',
};

export const INITIAL_GUEST_USER: User = {
  id: 'user_guest_1',
  email: 'guest@ivstay.com',
  full_name: 'Elena Rostova',
  phone: '+1 (555) 987-6543',
  role: 'guest',
  avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  created_at: '2024-02-15T10:30:00Z',
};

export const MOCK_PROPERTIES: Property[] = [];

export const MOCK_BOOKINGS: Booking[] = [];

export const MOCK_REVIEWS: Review[] = [];
