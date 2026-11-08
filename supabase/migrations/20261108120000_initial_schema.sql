-- IvStay initial schema (Phase 1)
--
-- Conventions
--   * Money is stored as whole paise (Rs 1 = 100 paise) in bigint columns ending in _paise.
--   * Status-like fields are text with CHECK constraints (easy to extend later).
--   * Every table has row level security (RLS). Admin access needs role = 'admin' in
--     public.profiles AND a two-step-verified session (aal2). The browser only ever holds the
--     public (anon/publishable) key; server code uses the secret key, which bypasses RLS.

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  role text not null default 'guest' check (role in ('guest', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.role is
  'Never set from user input. Promote an admin with SQL or scripts/create-admin.mjs.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile automatically when an auth user is created.
-- The role always starts as guest: user metadata is user-controlled and is not trusted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True only for an admin whose session has passed two-step verification.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
    and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

-- ---------------------------------------------------------------------------
-- Owners (private: contact and payout details)
-- ---------------------------------------------------------------------------

create table public.owners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  phone text,
  email text,
  payout_details text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.owners.payout_details is 'UPI ID or bank reference used to pay the owner.';

create trigger owners_set_updated_at
  before update on public.owners
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Properties (public when active)
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(title) between 2 and 120),
  tagline text not null default '',
  description text not null default '',
  category text not null check (category in ('bnbs_and_villas', 'hotels', 'home_stays')),
  property_type text not null check (property_type in ('villa', 'bnb', 'hotel', 'resort', 'home_stay')),
  status text not null default 'draft' check (status in ('active', 'draft', 'archived')),
  address text not null default '',
  city text not null check (length(city) between 1 and 80),
  state text not null default '',
  zip_code text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  price_per_night_paise bigint not null check (price_per_night_paise >= 0),
  weekend_price_per_night_paise bigint check (weekend_price_per_night_paise >= 0),
  cleaning_fee_paise bigint not null default 0 check (cleaning_fee_paise >= 0),
  service_fee_pct numeric(5, 2) not null default 0 check (service_fee_pct between 0 and 100),
  base_guests integer not null default 2 check (base_guests >= 1),
  max_guests integer not null check (max_guests >= 1),
  extra_guest_fee_paise bigint not null default 0 check (extra_guest_fee_paise >= 0),
  min_nights integer not null default 1 check (min_nights >= 1),
  cancellation_policy text not null default 'Flexible'
    check (cancellation_policy in ('Flexible', 'Moderate', 'Strict')),
  bedrooms integer check (bedrooms >= 0),
  beds integer check (beds >= 0),
  bathrooms numeric(4, 1) check (bathrooms >= 0),
  amenities text[] not null default '{}',
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  host_name text,
  owner_id uuid references public.owners (id) on delete set null,
  rating numeric(3, 2) not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (base_guests <= max_guests)
);

comment on column public.properties.weekend_price_per_night_paise is
  'Price for Friday and Saturday nights. Null means the normal nightly price applies.';
comment on column public.properties.extra_guest_fee_paise is
  'Charged per extra guest above base_guests, per night.';
comment on column public.properties.service_fee_pct is
  'Percentage added to the nightly and extra-guest total.';
comment on column public.properties.rating is
  'Maintained from published reviews only; direct writes are ignored.';

create index properties_status_category_idx on public.properties (status, category);
create index properties_city_idx on public.properties (lower(city));

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Fill in a URL slug from the title when none is given.
create or replace function public.properties_set_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base_slug text;
begin
  if new.slug is null or new.slug = '' then
    base_slug := trim(both '-' from regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'));
    if base_slug = '' then
      base_slug := 'stay';
    end if;
    new.slug := base_slug;
    if exists (select 1 from public.properties p where p.slug = new.slug and p.id <> new.id) then
      new.slug := base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 6);
    end if;
  end if;
  return new;
end;
$$;

create trigger properties_set_slug
  before insert or update of slug, title on public.properties
  for each row execute function public.properties_set_slug();

-- Ratings can only come from published reviews.
create or replace function public.properties_protect_rating()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.rating := 0;
    new.review_count := 0;
  elsif pg_trigger_depth() = 1 then
    -- Direct UPDATE statements cannot change the rating; only the reviews trigger can.
    new.rating := old.rating;
    new.review_count := old.review_count;
  end if;
  return new;
end;
$$;

create trigger properties_protect_rating
  before insert or update on public.properties
  for each row execute function public.properties_protect_rating();

-- ---------------------------------------------------------------------------
-- Property images (files live in the property-images storage bucket)
-- ---------------------------------------------------------------------------

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text,
  external_url text,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (num_nonnulls(storage_path, external_url) = 1)
);

comment on column public.property_images.storage_path is 'Path inside the property-images bucket.';
comment on column public.property_images.external_url is 'Full URL for images hosted elsewhere.';

create index property_images_property_idx on public.property_images (property_id, sort_order);

-- ---------------------------------------------------------------------------
-- Availability blocks (maintenance / owner use)
-- ---------------------------------------------------------------------------

create table public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  reason text not null default 'maintenance' check (reason in ('maintenance', 'owner_use', 'other')),
  note text,
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);

comment on column public.availability_blocks.ends_on is 'Exclusive: the first night that is free again.';

create index availability_blocks_property_idx on public.availability_blocks (property_id, starts_on);

-- ---------------------------------------------------------------------------
-- Bookings (enquiries, holds and confirmed stays, plus the admin ledger)
-- ---------------------------------------------------------------------------

create sequence public.booking_reference_seq start with 1001;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('IVS-' || nextval('public.booking_reference_seq')),
  property_id uuid not null references public.properties (id) on delete restrict,
  guest_id uuid references auth.users (id) on delete set null,
  guest_name text not null check (length(guest_name) between 1 and 120),
  guest_email text,
  guest_phone text,
  check_in date not null,
  check_out date not null,
  stay daterange generated always as (daterange(check_in, check_out, '[)')) stored,
  nights integer generated always as (check_out - check_in) stored,
  adults integer not null default 1 check (adults >= 1),
  children integer not null default 0 check (children >= 0),
  pets integer not null default 0 check (pets >= 0),
  nightly_total_paise bigint not null default 0 check (nightly_total_paise >= 0),
  extra_guest_total_paise bigint not null default 0 check (extra_guest_total_paise >= 0),
  cleaning_fee_paise bigint not null default 0 check (cleaning_fee_paise >= 0),
  service_fee_paise bigint not null default 0 check (service_fee_paise >= 0),
  total_paise bigint not null default 0 check (total_paise >= 0),
  status text not null default 'enquiry'
    check (status in ('enquiry', 'awaiting_payment', 'confirmed', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'partially_paid', 'paid', 'refunded')),
  source text not null default 'website'
    check (source in ('website', 'whatsapp', 'phone', 'walk_in', 'other')),
  special_requests text,
  -- Ledger: what the guest pays IvStay and what IvStay pays the owner
  customer_rate_paise bigint check (customer_rate_paise >= 0),
  customer_payment_date date,
  customer_payment_status text not null default 'pending'
    check (customer_payment_status in ('pending', 'paid')),
  owner_rate_paise bigint check (owner_rate_paise >= 0),
  owner_payment_date date,
  owner_payment_status text not null default 'pending'
    check (owner_payment_status in ('pending', 'paid')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in),
  check (guest_email is not null or guest_phone is not null),
  -- No two holds/confirmed stays for the same property may overlap.
  -- Check-out day is free for the next guest because the range excludes its upper bound.
  constraint bookings_no_overlap
    exclude using gist (property_id with =, stay with &&)
    where (status in ('awaiting_payment', 'confirmed'))
);

comment on column public.bookings.status is
  'enquiry: not holding dates. awaiting_payment: payment link sent, dates held. confirmed: paid/agreed.';

create index bookings_property_dates_idx on public.bookings (property_id, check_in);
create index bookings_status_idx on public.bookings (status);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- A booking that holds dates may not overlap an availability block.
create or replace function public.bookings_prevent_blocked_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('awaiting_payment', 'confirmed') and exists (
    select 1
    from public.availability_blocks b
    where b.property_id = new.property_id
      and daterange(b.starts_on, b.ends_on, '[)') && daterange(new.check_in, new.check_out, '[)')
  ) then
    raise exception 'These dates are blocked for this property'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger bookings_prevent_blocked_dates
  before insert or update of status, check_in, check_out, property_id on public.bookings
  for each row execute function public.bookings_prevent_blocked_dates();

-- An availability block may not cover dates that a booking already holds.
create or replace function public.availability_blocks_prevent_overlap()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.bookings bk
    where bk.property_id = new.property_id
      and bk.status in ('awaiting_payment', 'confirmed')
      and bk.stay && daterange(new.starts_on, new.ends_on, '[)')
  ) then
    raise exception 'A held or confirmed booking already uses some of these dates'
      using errcode = '23P01';
  end if;
  return new;
end;
$$;

create trigger availability_blocks_prevent_overlap
  before insert or update on public.availability_blocks
  for each row execute function public.availability_blocks_prevent_overlap();

-- ---------------------------------------------------------------------------
-- Payments (written by the Razorpay webhook with the secret key)
-- ---------------------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete restrict,
  provider text not null default 'razorpay' check (provider in ('razorpay', 'manual')),
  provider_payment_link_id text unique,
  provider_order_id text,
  provider_payment_id text unique,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created', 'paid', 'failed', 'refunded', 'cancelled', 'expired')),
  short_url text,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Enquiries ("List your property", contact form, general questions)
-- ---------------------------------------------------------------------------

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('list_property', 'contact', 'general')),
  name text not null check (length(name) between 1 and 120),
  phone text check (length(phone) <= 30),
  email text check (length(email) <= 254),
  message text check (length(message) <= 4000),
  property_id uuid references public.properties (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'in_progress', 'closed')),
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create index enquiries_status_idx on public.enquiries (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Reviews (only shown once published by an admin)
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  booking_id uuid unique references public.bookings (id) on delete set null,
  author_name text not null check (length(author_name) between 1 and 120),
  rating numeric(2, 1) not null check (rating between 1 and 5),
  sub_ratings jsonb not null default '{}'::jsonb,
  comment text not null default '' check (length(comment) <= 4000),
  status text not null default 'pending' check (status in ('pending', 'published', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_property_status_idx on public.reviews (property_id, status);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Keep properties.rating / review_count in step with published reviews.
create or replace function public.refresh_property_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected uuid[];
  pid uuid;
begin
  affected := array_remove(array[
    case when tg_op in ('INSERT', 'UPDATE') then new.property_id end,
    case when tg_op in ('UPDATE', 'DELETE') then old.property_id end
  ], null);

  foreach pid in array affected loop
    update public.properties p
    set rating = coalesce((
          select round(avg(r.rating), 2) from public.reviews r
          where r.property_id = pid and r.status = 'published'
        ), 0),
        review_count = (
          select count(*) from public.reviews r
          where r.property_id = pid and r.status = 'published'
        )
    where p.id = pid;
  end loop;

  return null;
end;
$$;

create trigger reviews_refresh_property_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_property_rating();

-- ---------------------------------------------------------------------------
-- Public helpers: availability and price quotes (safe to call from the browser)
-- ---------------------------------------------------------------------------

create or replace function public.is_available(p_property_id uuid, p_check_in date, p_check_out date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_check_out > p_check_in
    and exists (
      select 1 from public.properties p
      where p.id = p_property_id and (p.status = 'active' or public.is_admin())
    )
    and not exists (
      select 1 from public.bookings b
      where b.property_id = p_property_id
        and b.status in ('awaiting_payment', 'confirmed')
        and b.stay && daterange(p_check_in, p_check_out, '[)')
    )
    and not exists (
      select 1 from public.availability_blocks a
      where a.property_id = p_property_id
        and daterange(a.starts_on, a.ends_on, '[)') && daterange(p_check_in, p_check_out, '[)')
    );
$$;

-- Unavailable date ranges for a calendar (no guest details or block reasons).
create or replace function public.get_unavailable_ranges(
  p_property_id uuid,
  p_from date default current_date,
  p_to date default current_date + 365
)
returns table (starts_on date, ends_on date)
language sql
stable
security definer
set search_path = ''
as $$
  select r.starts_on, r.ends_on
  from (
    select lower(b.stay) as starts_on, upper(b.stay) as ends_on
    from public.bookings b
    where b.property_id = p_property_id
      and b.status in ('awaiting_payment', 'confirmed')
      and b.stay && daterange(p_from, p_to, '[)')
    union all
    select a.starts_on, a.ends_on
    from public.availability_blocks a
    where a.property_id = p_property_id
      and daterange(a.starts_on, a.ends_on, '[)') && daterange(p_from, p_to, '[)')
  ) r
  where exists (
    select 1 from public.properties p
    where p.id = p_property_id and (p.status = 'active' or public.is_admin())
  )
  order by r.starts_on;
$$;

-- Server-side price quote. The website shows this; it never sends prices the server trusts.
-- Friday and Saturday nights use the weekend price when one is set.
create or replace function public.quote_stay(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults integer default 1,
  p_children integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  prop public.properties%rowtype;
  v_nights integer;
  v_guests integer := greatest(coalesce(p_adults, 0), 0) + greatest(coalesce(p_children, 0), 0);
  v_weekend_nights integer := 0;
  v_nightly bigint;
  v_extra_guests integer;
  v_extra bigint;
  v_service bigint;
  v_problems text[] := '{}';
begin
  select * into prop
  from public.properties
  where id = p_property_id and (status = 'active' or public.is_admin());

  if not found then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('This stay was not found'));
  end if;

  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('Check-out must be after check-in'));
  end if;

  v_nights := p_check_out - p_check_in;
  if v_nights > 90 then
    return jsonb_build_object('ok', false, 'problems', jsonb_build_array('Stays longer than 90 nights need a custom quote'));
  end if;

  if p_check_in < current_date then
    v_problems := v_problems || 'Check-in is in the past'::text;
  end if;
  if coalesce(p_adults, 0) < 1 then
    v_problems := v_problems || 'At least one adult is required'::text;
  end if;
  if v_nights < prop.min_nights then
    v_problems := v_problems || format('Minimum stay is %s nights', prop.min_nights);
  end if;
  if v_guests > prop.max_guests then
    v_problems := v_problems || format('This stay sleeps up to %s guests', prop.max_guests);
  end if;
  if not public.is_available(p_property_id, p_check_in, p_check_out) then
    v_problems := v_problems || 'Those dates are not available'::text;
  end if;

  select count(*) filter (where extract(isodow from d) in (5, 6))
  into v_weekend_nights
  from generate_series(p_check_in::timestamp, (p_check_out - 1)::timestamp, interval '1 day') as d;

  v_nightly := (v_nights - v_weekend_nights) * prop.price_per_night_paise
             + v_weekend_nights * coalesce(prop.weekend_price_per_night_paise, prop.price_per_night_paise);
  v_extra_guests := greatest(v_guests - prop.base_guests, 0);
  v_extra := v_extra_guests * prop.extra_guest_fee_paise * v_nights;
  v_service := round((v_nightly + v_extra) * prop.service_fee_pct / 100);

  return jsonb_build_object(
    'ok', cardinality(v_problems) = 0,
    'problems', to_jsonb(v_problems),
    'nights', v_nights,
    'weekend_nights', v_weekend_nights,
    'guests', v_guests,
    'extra_guests', v_extra_guests,
    'nightly_total_paise', v_nightly,
    'extra_guest_total_paise', v_extra,
    'cleaning_fee_paise', prop.cleaning_fee_paise,
    'service_fee_paise', v_service,
    'total_paise', v_nightly + v_extra + prop.cleaning_fee_paise + v_service
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.owners enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.availability_blocks enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.enquiries enable row level security;
alter table public.reviews enable row level security;

-- Profiles: people read their own row; admins read all. Only name and phone are editable.
create policy "Read own profile or any as admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Properties: everyone sees active stays; admins see and manage all.
create policy "Anyone reads active properties" on public.properties
  for select to anon, authenticated
  using (status = 'active' or (select public.is_admin()));

create policy "Admins manage properties" on public.properties
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Images follow their property's visibility (the properties policy applies inside the subquery).
create policy "Anyone reads images of visible properties" on public.property_images
  for select to anon, authenticated
  using (exists (select 1 from public.properties p where p.id = property_images.property_id));

create policy "Admins manage property images" on public.property_images
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Reviews: published ones are public.
create policy "Anyone reads published reviews" on public.reviews
  for select to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "Admins manage reviews" on public.reviews
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Admin-only tables (the website reads availability through the helper functions above).
create policy "Admins manage owners" on public.owners
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage availability blocks" on public.availability_blocks
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage bookings" on public.bookings
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage payments" on public.payments
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins manage enquiries" on public.enquiries
  for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Belt and braces: signed-out visitors can never write anything.
revoke insert, update, delete on
  public.properties, public.property_images, public.reviews
from anon;
revoke all on
  public.owners, public.availability_blocks, public.bookings, public.payments, public.enquiries
from anon;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for listing photos; only admins can change files
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

create policy "Admins list property images" on storage.objects
  for select to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admins upload property images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admins update property images" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()))
  with check (bucket_id = 'property-images' and (select public.is_admin()));

create policy "Admins delete property images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-images' and (select public.is_admin()));
