-- Local development seed (runs on `supabase start` / `supabase db reset`).
-- It does NOT run on the hosted project automatically. To load the same listings there,
-- paste this file into the Supabase SQL editor once, then run scripts/upload-listing-photos.mjs.
--
-- These are the real listings that were written into the partner pages
-- (partner_frontend/src/app/villas/[id]/page.tsx and hotels/[id]/page.tsx).
-- Unknown details (beds, bathrooms, fees, coordinates) are left empty on purpose:
-- fill them in from the admin console rather than guessing.

insert into public.properties (
  id, slug, title, tagline, description, category, property_type, status,
  city, state, price_per_night_paise, base_guests, max_guests, bedrooms, amenities
) values
(
  '6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e01',
  'pinewood-manor-kasauli',
  'Pinewood Manor in Kasauli',
  '',
  'Nestled in the serene hills of Kasauli, Pinewood Manor offers breathtaking mountain views and a peaceful retreat from city life. This premium 3-bedroom property features cozy interiors, modern amenities, a beautiful garden, and a dedicated caretaker to ensure a comfortable stay. Wake up to the sound of birds and sip your morning tea on the balcony overlooking the majestic valleys.',
  'bnbs_and_villas', 'villa', 'active',
  'Kasauli', 'Himachal Pradesh',
  899900, 6, 10, 3,
  array['Mountain View', 'Free Wi-Fi', 'Air Conditioning & Heating', 'Fully Equipped Kitchen',
        'Bonfire / BBQ setup available', 'Dedicated Caretaker', 'Power Backup', 'Free Parking',
        'Outdoor Dining Area', 'Television']
),
(
  '6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02',
  'pax-and-opis-mussoorie',
  'Pax & Opis Luxury Stays',
  '',
  'Experience the ultimate luxury at Pax & Opis in the heart of Mussoorie. With 6 spacious bedrooms, this magnificent villa offers a perfect blend of modern comfort and natural beauty. Enjoy panoramic views of the Doon Valley, an expansive terrace, and luxurious living spaces ideal for large families or corporate retreats.',
  'bnbs_and_villas', 'villa', 'active',
  'Mussoorie', 'Uttarakhand',
  1499900, 12, 20, 6,
  array['Valley View', 'Free Wi-Fi', 'Air Conditioning & Heating', 'Fully Equipped Kitchen',
        'Private Chef Available', 'Dedicated Caretaker', 'Power Backup', 'Free Parking',
        'Spacious Terrace', 'Indoor Games']
),
(
  -- Kept as a draft: the old page only had stock photos, not pictures of this hotel.
  '6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e03',
  'the-ambience-hotel-waknaghat',
  'The Ambience Hotel',
  '',
  'Welcome to The Ambience Hotel, a beautiful retreat nestled in the hills of Waknaghat. Experience unparalleled hospitality, breathtaking views, and modern comforts. Whether you are seeking a peaceful getaway or an adventure in the hills, our hotel offers the perfect setting with luxurious rooms and top-notch facilities.',
  'hotels', 'hotel', 'draft',
  'Waknaghat', 'Himachal Pradesh',
  599900, 2, 4, null,
  array['Hill View Rooms', 'Free Wi-Fi', 'In-house Restaurant', 'Air Conditioning & Heating',
        'Room Service', 'Conference Hall', 'Power Backup', 'Free Parking', 'Laundry Service',
        '24/7 Front Desk']
);

-- Photos. Files for the two villas come from partner_frontend/public/images and are uploaded
-- to the property-images bucket by scripts/upload-listing-photos.mjs.
insert into public.property_images (property_id, storage_path, alt_text, sort_order) values
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e01', 'pinewood-manor/media_1790249276700.jpg', 'Pinewood Manor in Kasauli, photo 1', 0),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e01', 'pinewood-manor/media_1790249386218.jpg', 'Pinewood Manor in Kasauli, photo 2', 1),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e01', 'pinewood-manor/media_1790249386258.jpg', 'Pinewood Manor in Kasauli, photo 3', 2),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02', 'pax-and-opis/media_1790250925861.jpg', 'Pax & Opis Luxury Stays, photo 1', 0),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02', 'pax-and-opis/media_1790250925882.jpg', 'Pax & Opis Luxury Stays, photo 2', 1),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02', 'pax-and-opis/media_1790250925936.jpg', 'Pax & Opis Luxury Stays, photo 3', 2),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02', 'pax-and-opis/media_1790250925960.jpg', 'Pax & Opis Luxury Stays, photo 4', 3),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e02', 'pax-and-opis/media_1790250925967.jpg', 'Pax & Opis Luxury Stays, photo 5', 4);

-- Stock photos from the old hotel page, kept only so the draft isn't empty. Replace before publishing.
insert into public.property_images (property_id, external_url, alt_text, sort_order) values
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e03', 'https://images.unsplash.com/photo-1542314831-c6a4d14d8376?q=80&w=2070&auto=format&fit=crop', 'Placeholder stock photo', 0),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e03', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', 'Placeholder stock photo', 1),
  ('6f2d8a52-3c1e-4b7a-9d0f-1a2b3c4d5e03', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop', 'Placeholder stock photo', 2);
