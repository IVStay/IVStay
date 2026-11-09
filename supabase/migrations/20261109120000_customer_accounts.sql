-- Customer accounts (sign up with email + password or Google) and booking-request alerts.
--
-- * Customers are profiles with role 'guest'. They can read and edit their own name and phone,
--   and see their own booking requests through my_bookings(). Everything else stays admin-only.
-- * request_booking() links a request to the signed-in customer, if any.
-- * bookings.notified_at lets the notify-booking Edge Function send each alert email only once.

-- ---------------------------------------------------------------------------
-- Profiles: the contact details a customer gives at sign-up
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column email text,
  add constraint profiles_full_name_length check (length(full_name) <= 120),
  add constraint profiles_phone_format check (phone is null or phone ~ '^\+?[0-9]{8,15}$');

comment on column public.profiles.email is 'Copy of the sign-in email, kept in step by triggers.';

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- Name and phone come from the sign-up form (Google provides the name). The role still always
-- starts as guest: user metadata is user-controlled and is never trusted for access.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '[^0-9+]', '', 'g');
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 120),
    case when v_phone ~ '^\+?[0-9]{8,15}$' then v_phone end,
    new.email
  );
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Customers edit their own name and phone (already granted); store phones in one format.
create or replace function public.profiles_normalize_phone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Drop spaces, dashes and brackets; anything else (letters) is left for the check to reject
  if coalesce(new.phone, '') ~ '^[0-9+ ().-]*$' then
    new.phone := nullif(regexp_replace(coalesce(new.phone, ''), '[^0-9+]', '', 'g'), '');
  end if;
  new.full_name := trim(new.full_name);
  return new;
end;
$$;

create trigger profiles_normalize_phone
  before insert or update of phone, full_name on public.profiles
  for each row execute function public.profiles_normalize_phone();

-- ---------------------------------------------------------------------------
-- Bookings: link requests to accounts; remember when the alert went out
-- ---------------------------------------------------------------------------

alter table public.bookings add column notified_at timestamptz;

comment on column public.bookings.notified_at is
  'When the new-request email alert was sent (set by the notify-booking Edge Function).';

create index bookings_guest_idx on public.bookings (guest_id);
create index bookings_guest_email_idx on public.bookings (lower(guest_email));

create or replace function public.request_booking(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_guest_name text,
  p_guest_phone text default null,
  p_guest_email text default null,
  p_adults integer default 1,
  p_children integer default 0,
  p_special_requests text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_name text := trim(coalesce(p_guest_name, ''));
  -- Keep digits and a leading +, so "+91 98765-43210" and "+919876543210" match
  v_phone text := nullif(regexp_replace(trim(coalesce(p_guest_phone, '')), '[^0-9+]', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_guest_email, ''))), '');
  v_notes text := nullif(trim(coalesce(p_special_requests, '')), '');
  v_quote jsonb;
  v_recent integer;
  v_reference text;
begin
  -- Signed-in customers: fall back to the email they signed in with
  if v_email is null and v_user is not null then
    v_email := nullif(lower(coalesce(auth.jwt() ->> 'email', '')), '');
  end if;

  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_phone is null and v_email is null then
    raise exception 'Please enter a phone number or an email address.' using errcode = '22023';
  end if;
  if v_phone is not null and length(regexp_replace(v_phone, '[^0-9]', '', 'g')) not between 8 and 15 then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if length(coalesce(v_notes, '')) > 2000 then
    raise exception 'Special requests must be shorter than 2,000 characters.' using errcode = '22023';
  end if;
  if p_check_in is null or p_check_in < current_date then
    raise exception 'Please choose a check-in date from today onwards.' using errcode = '22023';
  end if;

  -- Simple flood protection: the same phone, email or account can send 5 requests an hour.
  select count(*) into v_recent
  from public.bookings b
  where b.source = 'website'
    and b.created_at > now() - interval '1 hour'
    and ((v_phone is not null and b.guest_phone = v_phone)
      or (v_email is not null and b.guest_email = v_email)
      or (v_user is not null and b.guest_id = v_user));
  if v_recent >= 5 then
    raise exception 'You have already sent several requests. Please message us on WhatsApp instead.'
      using errcode = 'P0001';
  end if;

  -- Price it on the server. Problems such as "dates not available" don't stop the request:
  -- an enquiry doesn't hold dates, and the team can suggest alternatives.
  v_quote := public.quote_stay(p_property_id, p_check_in, p_check_out, p_adults, p_children);
  if not (v_quote ? 'total_paise') then
    raise exception '%', coalesce(v_quote -> 'problems' ->> 0, 'This stay cannot be requested.')
      using errcode = '22023';
  end if;

  insert into public.bookings (
    property_id, guest_id, guest_name, guest_phone, guest_email, check_in, check_out, adults, children,
    nightly_total_paise, extra_guest_total_paise, cleaning_fee_paise, service_fee_paise, total_paise,
    status, source, special_requests
  ) values (
    p_property_id, v_user, v_name, v_phone, v_email, p_check_in, p_check_out,
    greatest(coalesce(p_adults, 1), 1), greatest(coalesce(p_children, 0), 0),
    (v_quote ->> 'nightly_total_paise')::bigint,
    (v_quote ->> 'extra_guest_total_paise')::bigint,
    (v_quote ->> 'cleaning_fee_paise')::bigint,
    (v_quote ->> 'service_fee_paise')::bigint,
    (v_quote ->> 'total_paise')::bigint,
    'enquiry', 'website', v_notes
  )
  returning reference into v_reference;

  -- Save the phone on the customer's profile the first time they give one
  if v_user is not null and v_phone is not null and v_phone ~ '^\+?[0-9]{8,15}$' then
    update public.profiles set phone = v_phone where id = v_user and phone is null;
  end if;

  return jsonb_build_object('reference', v_reference, 'quote', v_quote);
end;
$$;

-- ---------------------------------------------------------------------------
-- "My bookings" for customers (no ledger or owner details)
-- ---------------------------------------------------------------------------

create or replace function public.my_bookings()
returns table (
  reference text,
  property_id uuid,
  property_title text,
  property_slug text,
  property_city text,
  check_in date,
  check_out date,
  nights integer,
  adults integer,
  children integer,
  total_paise bigint,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select b.reference, b.property_id, p.title, p.slug, p.city, b.check_in, b.check_out, b.nights,
         b.adults, b.children, b.total_paise, b.status, b.created_at
  from public.bookings b
  join public.properties p on p.id = b.property_id
  where (select auth.uid()) is not null
    and (
      b.guest_id = (select auth.uid())
      -- requests sent before the account existed, from the same (verified) email
      or (b.guest_email is not null
          and lower(b.guest_email) = lower(coalesce((select auth.jwt()) ->> 'email', '')))
    )
  order by b.check_in desc;
$$;

-- ---------------------------------------------------------------------------
-- Customer list for the admin dashboard
-- ---------------------------------------------------------------------------

create or replace function public.admin_list_customers()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  provider text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  booking_count bigint,
  last_request_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;

  return query
  select pr.id, pr.full_name, pr.email, pr.phone,
         coalesce(u.raw_app_meta_data ->> 'provider', 'email'),
         pr.created_at, u.last_sign_in_at,
         count(b.id), max(b.created_at)
  from public.profiles pr
  join auth.users u on u.id = pr.id
  left join public.bookings b
    on b.guest_id = pr.id or (b.guest_email is not null and lower(b.guest_email) = lower(pr.email))
  where pr.role = 'guest'
  group by pr.id, u.id
  order by pr.created_at desc;
end;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke execute on function public.my_bookings() from public, anon;
revoke execute on function public.admin_list_customers() from public, anon;
grant execute on function public.my_bookings() to authenticated;
grant execute on function public.admin_list_customers() to authenticated;
-- create or replace keeps the existing grants on request_booking.

grant execute on function public.my_bookings(), public.admin_list_customers() to service_role;
