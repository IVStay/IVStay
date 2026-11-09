-- Contact page and "List your property" form: saved to public.enquiries (admin-only table) through
-- submit_enquiry(), which validates the input and limits flooding. notified_at lets the
-- notify-booking Edge Function email the team once per enquiry.

alter table public.enquiries
  add column notified_at timestamptz,
  add column admin_notes text check (length(admin_notes) <= 4000),
  add column user_id uuid references auth.users (id) on delete set null;

create or replace function public.submit_enquiry(
  p_kind text,
  p_name text,
  p_phone text,
  p_email text default null,
  p_message text default null,
  p_property_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_phone text := public.normalize_phone(p_phone);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_message text := nullif(trim(coalesce(p_message, '')), '');
  v_recent integer;
  v_id uuid;
begin
  if p_kind not in ('list_property', 'contact', 'general') then
    raise exception 'Unknown enquiry type.' using errcode = '22023';
  end if;
  if length(v_name) < 2 or length(v_name) > 120 then
    raise exception 'Please enter your name.' using errcode = '22023';
  end if;
  if v_phone is null then
    raise exception 'Please add your phone number.' using errcode = '22023';
  end if;
  if not public.is_valid_phone(v_phone) then
    raise exception 'Enter a valid phone number: 10 digits for India, starting with 6, 7, 8 or 9.'
      using errcode = '22023';
  end if;
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if length(coalesce(v_message, '')) > 4000 then
    raise exception 'Please keep your message under 4,000 characters.' using errcode = '22023';
  end if;

  select count(*) into v_recent
  from public.enquiries e
  where e.created_at > now() - interval '1 hour'
    and (e.phone = v_phone or (v_email is not null and e.email = v_email));
  if v_recent >= 5 then
    raise exception 'You have already sent several messages. Please call or WhatsApp us instead.'
      using errcode = 'P0001';
  end if;

  insert into public.enquiries (kind, name, phone, email, message, property_id, user_id)
  values (p_kind, v_name, v_phone, v_email, v_message, p_property_id, auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.submit_enquiry is
  'Saves a contact / list-your-property message for the IvStay team. Returns the enquiry id.';

revoke execute on function public.submit_enquiry(text, text, text, text, text, uuid) from public;
grant execute on function public.submit_enquiry(text, text, text, text, text, uuid)
  to anon, authenticated, service_role;
