-- Database tests for the access rules, booking constraints, price quotes and ratings.
-- Run with: npx supabase test db   (needs the local stack from `npx supabase start`)
begin;

create extension if not exists pgtap with schema extensions;

select plan(67);

-- ---------------------------------------------------------------------------
-- Fixtures (inserted as the database owner, so access rules don't apply here)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@ivstay.test', 'authenticated', 'authenticated'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'guest@ivstay.test', 'authenticated', 'authenticated');

update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000001';

insert into public.properties (
  id, slug, title, category, property_type, status, city,
  price_per_night_paise, weekend_price_per_night_paise, cleaning_fee_paise, service_fee_pct,
  base_guests, max_guests, extra_guest_fee_paise, min_nights
) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'test-active-villa', 'Test Active Villa', 'bnbs_and_villas', 'villa', 'active', 'Testville',
   1000000, 1500000, 200000, 10, 2, 4, 100000, 2),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'test-draft-villa', 'Test Draft Villa', 'bnbs_and_villas', 'villa', 'draft', 'Testville',
   500000, null, 0, 0, 2, 2, 0, 1);

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------

select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity),
  0,
  'Row level security is on for every public table'
);

select is(
  (select public from storage.buckets where id = 'property-images'),
  true,
  'The property-images bucket exists and is public'
);

select is(
  (select slug from public.properties where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  'test-active-villa',
  'An explicit slug is kept'
);

insert into public.properties (title, category, property_type, city, price_per_night_paise, max_guests)
values ('Sea View Cottage!', 'home_stays', 'home_stay', 'Testville', 300000, 2),
       ('Sea View Cottage', 'home_stays', 'home_stay', 'Elsewhere', 300000, 2);
select is(
  (select count(*)::int from public.properties where slug = 'sea-view-cottage'),
  1,
  'A missing slug is generated from the title'
);
select is(
  (select count(*)::int from public.properties where slug like 'sea-view-cottage-%'),
  1,
  'A clashing generated slug gets a short suffix'
);
delete from public.properties where title like 'Sea View Cottage%';

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000003', 'sneaky@ivstay.test', 'authenticated', 'authenticated',
   '{"full_name": "Sneaky", "role": "admin"}');
select results_eq(
  $$ select full_name, role from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000003' $$,
  $$ values ('Sneaky', 'guest') $$,
  'New accounts get a profile as guest, whatever their sign-up data says'
);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000004', 'asha@ivstay.test', 'authenticated', 'authenticated',
   '{"full_name": "Asha Rao", "phone": "+91 99999-11111"}'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'nophone@ivstay.test', 'authenticated', 'authenticated',
   '{"name": "Google Person", "phone": "call me"}');
select results_eq(
  $$ select full_name, phone, email from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000004' $$,
  $$ values ('Asha Rao', '+919999911111', 'asha@ivstay.test') $$,
  'Sign-up keeps the customer''s name, a tidied phone number and their email'
);
select results_eq(
  $$ select full_name, phone from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000005' $$,
  $$ values ('Google Person', null::text) $$,
  'Google names are used, and an unusable phone number is left out'
);

-- ---------------------------------------------------------------------------
-- Signed-out visitor
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select is(
  (select count(*)::int from public.properties where city = 'Testville'),
  1,
  'Visitors see active properties only'
);

select throws_ok($$ select * from public.bookings $$, '42501', null, 'Visitors cannot read bookings');
select throws_ok($$ select * from public.owners $$, '42501', null, 'Visitors cannot read owners');
select throws_ok($$ select * from public.payments $$, '42501', null, 'Visitors cannot read payments');
select throws_ok($$ select * from public.enquiries $$, '42501', null, 'Visitors cannot read enquiries');
select ok(
  public.submit_enquiry('list_property', 'Meera Host', '98765 11111', 'meera@example.com', 'I own a cottage in Kasauli.') is not null,
  'Visitors can send a contact / list-your-property message'
);
select throws_ok(
  $$ select public.submit_enquiry('contact', 'No Phone', null, 'x@example.com', 'Hello') $$,
  '22023', null,
  'A contact message needs a phone number'
);
select throws_ok(
  $$ select public.submit_enquiry('spam', 'Someone', '98765 11111', null, 'Hello') $$,
  '22023', null,
  'Unknown message types are refused'
);
select throws_ok($$ select * from public.admin_list_customers() $$, '42501', null, 'Visitors cannot list customers');

-- Phone numbers (free checks)
select results_eq(
  $$ select public.normalize_phone(x) from unnest(array['98765 43210', '098765-43210', '919876543210', '+91 (98765) 43210']) x $$,
  $$ values ('+919876543210'), ('+919876543210'), ('+919876543210'), ('+919876543210') $$,
  'Indian mobiles are stored as +91 and 10 digits, however they are typed'
);
select results_eq(
  $$ select public.is_valid_phone(public.normalize_phone(x)) from unnest(array['58765 43210', '12345', '+44 20 7946 0958', '+91 12345 67890']) x $$,
  $$ values (false), (false), (true), (false) $$,
  'Indian mobiles must start with 6-9; other countries need + and the country code'
);
select throws_ok(
  $$ select public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-01', '2027-01-04',
       'Fake Number', '12345 67890', null, 2, 0, null) $$,
  '22023', null,
  'A booking request with an impossible mobile number is refused'
);
select throws_ok($$ select * from public.profiles $$, '42501', null, 'Visitors cannot read profiles');
select throws_ok(
  $$ insert into public.properties (slug, title, category, property_type, city, price_per_night_paise, max_guests)
     values ('sneaky', 'Sneaky', 'hotels', 'hotel', 'X', 1, 1) $$,
  '42501', null,
  'Visitors cannot add properties'
);

-- Quote: check in Friday 2027-01-01, out Monday 2027-01-04 = Fri + Sat weekend nights, Sun weekday.
-- Nightly 10,000 + 2 x 15,000 = 40,000; 1 extra guest x 1,000 x 3 nights = 3,000;
-- service 10% of 43,000 = 4,300; cleaning 2,000; total 49,300 rupees.
select is(
  (public.quote_stay('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-01', '2027-01-04', 3, 0) ->> 'weekend_nights')::int,
  2,
  'Quote counts Friday and Saturday as weekend nights'
);
select is(
  (public.quote_stay('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-01', '2027-01-04', 3, 0) ->> 'total_paise')::bigint,
  4930000::bigint,
  'Quote total includes weekend rates, extra guests, cleaning and service fee'
);
select ok(
  (public.quote_stay('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-04', '2027-01-05', 2, 0) -> 'problems') ? 'Minimum stay is 2 nights',
  'Quote flags stays shorter than the minimum'
);
select ok(
  (public.quote_stay('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-04', '2027-01-07', 5, 0) -> 'problems') ? 'This stay sleeps up to 4 guests',
  'Quote flags too many guests'
);
select is(
  public.quote_stay('bbbbbbbb-0000-0000-0000-000000000002', '2027-01-04', '2027-01-07', 2, 0) ->> 'ok',
  'false',
  'Visitors cannot get quotes for draft properties'
);

-- Booking requests from the website
select matches(
  public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-01', '2027-01-04',
    'Rhea Kapoor', '+91 98765-43210', null, 3, 0, 'Late check-in') ->> 'reference',
  '^IVS-[0-9]+$',
  'Visitors can send a booking request and get a reference'
);
select throws_ok(
  $$ select public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-01', '2027-01-04',
       'Rhea Kapoor', null, null, 2, 0, null) $$,
  '22023', null,
  'A booking request needs a phone number or email'
);
select throws_ok(
  $$ select public.request_booking('bbbbbbbb-0000-0000-0000-000000000002', '2027-01-04', '2027-01-07',
       'Rhea Kapoor', '+919876543210', null, 2, 0, null) $$,
  '22023', null,
  'Requests for unpublished stays are refused'
);
select throws_ok(
  $$ select public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2020-01-01', '2020-01-04',
       'Rhea Kapoor', '+919876543210', null, 2, 0, null) $$,
  '22023', null,
  'Requests for past dates are refused'
);
select lives_ok(
  $$ do $body$ begin
       perform public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-08', '2027-01-10',
         'Rhea Kapoor', '+919876543210', null, 2, 0, null)
       from generate_series(1, 4);
     end $body$ $$,
  'The same contact can send up to five requests an hour'
);
select throws_ok(
  $$ select public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-01-08', '2027-01-10',
       'Rhea Kapoor', '+91 98765 43210', null, 2, 0, null) $$,
  'P0001', null,
  'A sixth request from the same contact within the hour is refused'
);

-- ---------------------------------------------------------------------------
-- Admin who has only typed the password (no two-step code yet)
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);

select is(public.is_admin(), false, 'An admin without two-step verification is not treated as admin');
select is(
  (select count(*)::int from public.properties where city = 'Testville'),
  1,
  'Without two-step verification an admin cannot see drafts'
);
select is(
  (select role from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'admin',
  'An admin can read their own profile before verifying (so the app knows to ask for the code)'
);

-- ---------------------------------------------------------------------------
-- Verified admin
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);

select is(public.is_admin(), true, 'A verified admin is treated as admin');
select is(
  (select count(*)::int from public.admin_list_customers()),
  4,
  'A verified admin sees every customer account, and not admin accounts'
);
select results_eq(
  $$ select kind, phone from public.enquiries where name = 'Meera Host' $$,
  $$ values ('list_property', '+919876511111') $$,
  'A verified admin sees contact messages, with a tidied phone number'
);
select ok(
  public.admin_set_phone_verified('aaaaaaaa-0000-0000-0000-000000000004', true) is not null,
  'An admin can mark a customer''s phone number as verified'
);
select results_eq(
  $$ select status, source, guest_phone, total_paise, special_requests
     from public.bookings where guest_name = 'Rhea Kapoor' and check_in = '2027-01-01' $$,
  $$ values ('enquiry', 'website', '+919876543210', 4930000::bigint, 'Late check-in') $$,
  'A website request is saved as an enquiry, priced on the server, with a tidied phone number'
);
select is(
  (select count(*)::int from public.properties where city = 'Testville'),
  2,
  'A verified admin sees drafts too'
);

select lives_ok(
  $$ insert into public.bookings (property_id, guest_name, guest_phone, check_in, check_out, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Guest A', '+910000000001', '2027-02-01', '2027-02-05', 'confirmed') $$,
  'A verified admin can add a confirmed booking'
);
select matches(
  (select reference from public.bookings where guest_name = 'Guest A'),
  '^IVS-[0-9]+$',
  'Bookings get an IVS- reference'
);
select throws_ok(
  $$ insert into public.bookings (property_id, guest_name, guest_phone, check_in, check_out, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Guest B', '+910000000002', '2027-02-04', '2027-02-06', 'confirmed') $$,
  '23P01', null,
  'An overlapping confirmed booking is rejected'
);
select lives_ok(
  $$ insert into public.bookings (property_id, guest_name, guest_phone, check_in, check_out, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Guest C', '+910000000003', '2027-02-05', '2027-02-07', 'awaiting_payment') $$,
  'A booking can start on the previous booking''s checkout day'
);
select lives_ok(
  $$ insert into public.bookings (property_id, guest_name, guest_phone, check_in, check_out, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Guest D', '+910000000004', '2027-02-02', '2027-02-03', 'enquiry') $$,
  'Enquiries do not hold dates, so they may overlap'
);
select lives_ok(
  $$ insert into public.availability_blocks (property_id, starts_on, ends_on, reason)
     values ('bbbbbbbb-0000-0000-0000-000000000001', '2027-03-01', '2027-03-03', 'maintenance') $$,
  'A verified admin can block dates'
);
select throws_ok(
  $$ insert into public.bookings (property_id, guest_name, guest_phone, check_in, check_out, status)
     values ('bbbbbbbb-0000-0000-0000-000000000001', 'Guest E', '+910000000005', '2027-03-02', '2027-03-04', 'awaiting_payment') $$,
  '23P01', null,
  'A booking that holds dates cannot overlap a block'
);
select throws_ok(
  $$ insert into public.availability_blocks (property_id, starts_on, ends_on)
     values ('bbbbbbbb-0000-0000-0000-000000000001', '2027-02-03', '2027-02-04') $$,
  '23P01', null,
  'A block cannot cover dates a booking already holds'
);
select is(
  public.is_available('bbbbbbbb-0000-0000-0000-000000000001', '2027-02-06', '2027-02-08'),
  false,
  'Availability accounts for held bookings'
);
select is(
  public.is_available('bbbbbbbb-0000-0000-0000-000000000001', '2027-02-07', '2027-02-09'),
  true,
  'Dates after the last checkout are available'
);

-- Ratings only come from published reviews
update public.properties set rating = 5, review_count = 99
where id = 'bbbbbbbb-0000-0000-0000-000000000001';
select is(
  (select review_count from public.properties where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0,
  'Direct rating edits are ignored'
);

insert into public.reviews (property_id, author_name, rating, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Reviewer 1', 4, 'published'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Reviewer 2', 5, 'published'),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Reviewer 3', 1, 'pending');
select results_eq(
  $$ select rating, review_count from public.properties where id = 'bbbbbbbb-0000-0000-0000-000000000001' $$,
  $$ values (4.50::numeric(3, 2), 2) $$,
  'The rating is the average of published reviews only'
);

-- ---------------------------------------------------------------------------
-- Signed-in guest (not an admin)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated","aal":"aal2"}', true);

select is((select count(*)::int from public.bookings), 0, 'A guest cannot see other people''s bookings');
select is(
  (select count(*)::int from public.profiles),
  1,
  'A guest sees only their own profile'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  '42501', null,
  'Nobody can make themselves an admin'
);
select lives_ok(
  $$ update public.profiles set full_name = 'New Name' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  'People can change their own name'
);
select throws_ok(
  $$ insert into public.properties (slug, title, category, property_type, city, price_per_night_paise, max_guests)
     values ('guest-made', 'Guest Made', 'hotels', 'hotel', 'X', 1, 1) $$,
  '42501', null,
  'A guest cannot add properties'
);
select throws_ok($$ select * from public.admin_list_customers() $$, '42501', null, 'A guest cannot list customers');
select throws_ok(
  $$ select public.admin_set_phone_verified('aaaaaaaa-0000-0000-0000-000000000002', true) $$,
  '42501', null,
  'A customer cannot mark their own number as verified'
);
select throws_ok(
  $$ update public.profiles set phone = 'not a phone' where id = 'aaaaaaaa-0000-0000-0000-000000000002' $$,
  '23514', null,
  'A profile phone number must be a real number'
);

-- A signed-in customer's request is linked to their account and shows in "My bookings"
select set_config('request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000002","role":"authenticated","aal":"aal1","email":"guest@ivstay.test"}', true);
select is(
  (select count(*)::int from public.my_bookings()),
  0,
  'A new customer has no bookings yet'
);
select matches(
  public.request_booking('bbbbbbbb-0000-0000-0000-000000000001', '2027-04-01', '2027-04-04',
    'New Name', '+91 91234 56789', null, 2, 0, null) ->> 'reference',
  '^IVS-[0-9]+$',
  'A signed-in customer can send a booking request'
);
select results_eq(
  $$ select property_title, check_in, status from public.my_bookings() $$,
  $$ values ('Test Active Villa', '2027-04-01'::date, 'enquiry') $$,
  'The request appears in the customer''s bookings'
);
select is(
  (select phone from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  '+919123456789',
  'The first phone number a customer gives is saved to their profile'
);

-- Changing a verified number clears the verification
reset role;
update public.profiles set phone = '+91 99999 22222' where id = 'aaaaaaaa-0000-0000-0000-000000000004';
select ok(
  (select phone_verified_at is null and phone = '+919999922222' from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000004'),
  'A new phone number has to be verified again'
);

select * from finish();
rollback;
