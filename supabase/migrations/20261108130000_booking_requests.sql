-- Phase 2: website visitors can send a booking request, saved as an 'enquiry'.
-- Visitors still can't read or change bookings; this function is their only way in, and it
-- prices the stay on the server (quote_stay) instead of trusting the browser.

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
  v_name text := trim(coalesce(p_guest_name, ''));
  -- Keep digits and a leading +, so "+91 98765-43210" and "+919876543210" match
  v_phone text := nullif(regexp_replace(trim(coalesce(p_guest_phone, '')), '[^0-9+]', '', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_guest_email, ''))), '');
  v_notes text := nullif(trim(coalesce(p_special_requests, '')), '');
  v_quote jsonb;
  v_recent integer;
  v_reference text;
begin
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

  -- Simple flood protection: the same phone or email can send 5 requests an hour.
  select count(*) into v_recent
  from public.bookings b
  where b.source = 'website'
    and b.created_at > now() - interval '1 hour'
    and ((v_phone is not null and b.guest_phone = v_phone)
      or (v_email is not null and b.guest_email = v_email));
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
    property_id, guest_name, guest_phone, guest_email, check_in, check_out, adults, children,
    nightly_total_paise, extra_guest_total_paise, cleaning_fee_paise, service_fee_paise, total_paise,
    status, source, special_requests
  ) values (
    p_property_id, v_name, v_phone, v_email, p_check_in, p_check_out,
    greatest(coalesce(p_adults, 1), 1), greatest(coalesce(p_children, 0), 0),
    (v_quote ->> 'nightly_total_paise')::bigint,
    (v_quote ->> 'extra_guest_total_paise')::bigint,
    (v_quote ->> 'cleaning_fee_paise')::bigint,
    (v_quote ->> 'service_fee_paise')::bigint,
    (v_quote ->> 'total_paise')::bigint,
    'enquiry', 'website', v_notes
  )
  returning reference into v_reference;

  return jsonb_build_object('reference', v_reference, 'quote', v_quote);
end;
$$;

comment on function public.request_booking is
  'Saves a website booking request as an enquiry and returns its reference and server-side quote.';
