-- Free phone-number checks (no SMS codes):
--   * Indian mobiles must be 10 digits starting with 6-9. "98765 43210", "098765 43210",
--     "919876543210" and "+91 98765-43210" are all stored as +919876543210.
--   * Other countries must be written with + and the country code (8-15 digits).
--   * profiles.phone_verified_at: set by the team (admin_set_phone_verified) after confirming the
--     number on WhatsApp or a call. Changing the number clears it.

create or replace function public.normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when d is null then null
    when d ~ '^[6-9][0-9]{9}$' then '+91' || d                     -- 98765 43210
    when d ~ '^0[6-9][0-9]{9}$' then '+91' || substr(d, 2)         -- 098765 43210
    when d ~ '^91[6-9][0-9]{9}$' then '+' || d                     -- 91 98765 43210
    else d
  end
  from (select nullif(regexp_replace(trim(coalesce(p_phone, '')), '[\s().-]', '', 'g'), '') as d) x;
$$;

create or replace function public.is_valid_phone(p_phone text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_phone is not null and (
    p_phone ~ '^\+91[6-9][0-9]{9}$'
    or (p_phone !~ '^\+91' and p_phone ~ '^\+[1-9][0-9]{7,14}$')
  );
$$;

comment on function public.normalize_phone is 'Tidies a phone number; bare Indian mobiles get +91.';
comment on function public.is_valid_phone is 'Indian mobiles: +91 then 10 digits starting 6-9. Others: + and 8-15 digits.';

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

alter table public.profiles add column phone_verified_at timestamptz;

comment on column public.profiles.phone_verified_at is
  'When the team confirmed this number belongs to the customer. Cleared when the number changes.';

-- Earlier rows: tidy, and drop numbers that don't pass the new rule (verified by nobody yet).
alter table public.profiles drop constraint profiles_phone_format;
update public.profiles set phone = public.normalize_phone(phone) where phone is not null;
update public.profiles set phone = null where phone is not null and not public.is_valid_phone(phone);
alter table public.profiles
  add constraint profiles_phone_format check (phone is null or public.is_valid_phone(phone));

create or replace function public.profiles_normalize_phone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Only spaces, dashes, dots and brackets are tidied away; letters are left for the check to reject
  if coalesce(new.phone, '') ~ '^[0-9+ ().-]*$' then
    new.phone := public.normalize_phone(new.phone);
  end if;
  new.full_name := trim(new.full_name);
  if tg_op = 'UPDATE' and new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := public.normalize_phone(new.raw_user_meta_data ->> 'phone');
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 120),
    case when public.is_valid_phone(v_phone) then v_phone end,
    new.email
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Booking requests use the same rule
-- ---------------------------------------------------------------------------

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
  v_phone text := public.normalize_phone(p_guest_phone);
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
  if v_phone is not null and not public.is_valid_phone(v_phone) then
    raise exception 'Please enter a valid mobile number: 10 digits for India, or + and the country code.'
      using errcode = '22023';
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
  if v_user is not null and v_phone is not null then
    update public.profiles set phone = v_phone where id = v_user and phone is null;
  end if;

  return jsonb_build_object('reference', v_reference, 'quote', v_quote);
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin: customer list with the verified flag, and marking numbers verified
-- ---------------------------------------------------------------------------

drop function public.admin_list_customers();

create function public.admin_list_customers()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  phone_verified_at timestamptz,
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
  select pr.id, pr.full_name, pr.email, pr.phone, pr.phone_verified_at,
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

create or replace function public.admin_set_phone_verified(p_user_id uuid, p_verified boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.profiles
  set phone_verified_at = case when p_verified and phone is not null then now() end
  where id = p_user_id
  returning phone_verified_at into v_at;
  if not found then
    raise exception 'Customer not found' using errcode = 'P0002';
  end if;
  return v_at;
end;
$$;

revoke execute on function public.admin_list_customers() from public, anon;
revoke execute on function public.admin_set_phone_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_list_customers() to authenticated, service_role;
grant execute on function public.admin_set_phone_verified(uuid, boolean) to authenticated, service_role;
grant execute on function public.normalize_phone(text), public.is_valid_phone(text)
  to anon, authenticated, service_role;
