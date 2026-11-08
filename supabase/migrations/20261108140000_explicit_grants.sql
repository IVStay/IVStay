-- Explicit permissions for the API roles.
--
-- Supabase projects created after 30 May 2026 no longer open new tables to the API roles
-- automatically. Without these grants the website (anon / authenticated) gets
-- "permission denied" and shows no stays. Row level security still decides which rows each
-- role sees or changes: these grants only open the doors that the policies then guard.
-- Safe to run on older projects too (granting an existing right does nothing).

grant usage on schema public to anon, authenticated, service_role;

-- Signed-out visitors: read-only access to what's public (policies limit it to active stays,
-- their photos and published reviews).
grant select on public.properties, public.property_images, public.reviews to anon;

-- Signed-in users: policies limit everything except their own profile to verified admins.
grant select, insert, update, delete on
  public.properties,
  public.property_images,
  public.reviews,
  public.owners,
  public.availability_blocks,
  public.bookings,
  public.payments,
  public.enquiries
to authenticated;

-- Profiles: read (own row, or all for admins) and change only name and phone.
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Admins adding bookings in the ledger use the booking reference sequence.
grant usage, select on sequence public.booking_reference_seq to authenticated;

-- Functions the website calls (is_admin is also used inside the access policies).
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.quote_stay(uuid, date, date, integer, integer) to anon, authenticated;
grant execute on function public.is_available(uuid, date, date) to anon, authenticated;
grant execute on function public.get_unavailable_ranges(uuid, date, date) to anon, authenticated;
grant execute on function public.request_booking(uuid, date, date, text, text, text, integer, integer, text)
  to anon, authenticated;

-- Server code and scripts (secret key) keep full access.
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
