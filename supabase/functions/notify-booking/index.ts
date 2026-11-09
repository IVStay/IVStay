// Sends the email alerts for website booking requests and contact / "List your property" messages.
// For a booking request:
//   * to the IvStay team: guest details with one-tap WhatsApp / call / email links
//   * to the guest (when they gave an email): "we got your request" with the reference
//
// The website calls this right after request_booking() returns a reference. Each request is
// alerted once: the function claims it by setting bookings.notified_at, and only requests made in
// the last hour can be claimed, so calling it again (or with someone else's reference) does nothing.
//
// Secrets (set with scripts/setup-accounts.ps1): GMAIL_USER, GMAIL_APP_PASSWORD, optional TEAM_EMAIL.
// Supabase provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://ivstay.vercel.app';
const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const TEAM_EMAIL = Deno.env.get('TEAM_EMAIL') || GMAIL_USER;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const inr = (paise: number) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

const day = (iso: string) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

const button = (href: string, label: string, color: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:4px 6px 4px 0;padding:10px 16px;border-radius:999px;background:${color};color:#fff;text-decoration:none;font-weight:600;font-size:14px">${esc(label)}</a>`;

const layout = (title: string, body: string) => `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="font-family:Georgia,serif;font-size:24px;font-weight:700;margin-bottom:16px">IVStay</div>
<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e7e2d8">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>${body}</div>
<p style="font-size:12px;color:#6b7280;margin-top:16px">IvStay · hand-picked villas, BnBs and hotels</p>
</div></body></html>`;

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;white-space:nowrap;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font-size:14px">${value}</td></tr>`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST' }, 405);

  let body: { reference?: unknown; enquiry_id?: unknown } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    /* handled below */
  }
  const reference = String(body.reference ?? '').trim();
  const enquiryId = String(body.enquiry_id ?? '').trim();
  const isEnquiry = /^[0-9a-f-]{36}$/i.test(enquiryId);
  if (!isEnquiry && !/^IVS-\d{1,9}$/.test(reference)) {
    return json({ error: 'A booking reference or enquiry id is required' }, 400);
  }
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return json({ error: 'Email sending is not set up yet' }, 503);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // Edge Functions can't use port 587; Gmail's SSL port works
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  // ---- Contact page / "List your property" messages -------------------------
  if (isEnquiry) {
    const { data: e, error: claimError } = await admin
      .from('enquiries')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', enquiryId)
      .is('notified_at', null)
      .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .select('id, kind, name, phone, email, message, created_at')
      .maybeSingle();
    if (claimError) return json({ error: claimError.message }, 500);
    if (!e) return json({ sent: false, reason: 'Already alerted, too old or not found' });

    const kindLabel = e.kind === 'list_property' ? 'List your property' : 'Contact message';
    const digits = (e.phone ?? '').replace(/\D/g, '');
    const reply = encodeURIComponent(`Hi ${e.name.split(/\s+/)[0]}, this is IvStay replying to your message. `);
    const html = layout(
      `New ${kindLabel.toLowerCase()}`,
      `<table style="border-collapse:collapse;margin-bottom:16px">` +
        row('Type', esc(kindLabel)) +
        row('Name', esc(e.name)) +
        row('Phone', e.phone ? esc(e.phone) : '—') +
        row('Email', e.email ? esc(e.email) : '—') +
        row('Message', e.message ? esc(e.message).replace(/\n/g, '<br>') : '—') +
        `</table>` +
        (digits ? button(`https://wa.me/${digits}?text=${reply}`, 'WhatsApp', '#16a34a') : '') +
        (e.phone ? button(`tel:${e.phone}`, 'Call', '#111827') : '') +
        (e.email ? button(`mailto:${e.email}`, 'Email', '#6b7280') : '') +
        `<p style="font-size:13px;margin-top:16px"><a href="${esc(SITE_URL)}/admin/enquiries" style="color:#b7791f">Open messages in the dashboard</a></p>`
    );
    try {
      await mailer.sendMail({
        from: `"IvStay website" <${GMAIL_USER}>`,
        to: TEAM_EMAIL,
        replyTo: e.email || undefined,
        subject: `${kindLabel}: ${e.name}${e.phone ? ` (${e.phone})` : ''}`,
        html,
      });
    } catch (sendError) {
      await admin.from('enquiries').update({ notified_at: null }).eq('id', e.id);
      return json({ error: `Email failed: ${(sendError as Error).message}` }, 502);
    }
    return json({ sent: true });
  }

  // ---- Booking requests --------------------------------------------------------

  // Claim the request so it is only alerted once
  const { data: claimed, error } = await admin
    .from('bookings')
    .update({ notified_at: new Date().toISOString() })
    .eq('reference', reference)
    .eq('source', 'website')
    .is('notified_at', null)
    .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .select(
      'id, reference, guest_name, guest_phone, guest_email, guest_id, check_in, check_out, nights, adults, children, total_paise, special_requests, properties(title, city, slug)'
    )
    .maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!claimed) return json({ sent: false, reason: 'Already alerted, too old or not found' });

  const b = claimed as typeof claimed & { properties: { title: string; city: string; slug: string } | null };
  const stay = b.properties ? `${b.properties.title} (${b.properties.city})` : 'a stay';
  const stayUrl = b.properties ? `${SITE_URL}/stays/${b.properties.slug}` : SITE_URL;
  const guests = `${b.adults} adult${b.adults === 1 ? '' : 's'}${b.children ? `, ${b.children} child${b.children === 1 ? '' : 'ren'}` : ''}`;
  const digits = (b.guest_phone ?? '').replace(/\D/g, '');
  const firstName = b.guest_name.split(/\s+/)[0];

  const followUp = encodeURIComponent(
    `Hi ${firstName}, this is IvStay about your booking request ${b.reference} for ${stay}, ` +
      `${day(b.check_in)} to ${day(b.check_out)}. `
  );

  const details =
    `<table style="border-collapse:collapse;margin-bottom:16px">` +
    row('Reference', `<b>${esc(b.reference)}</b>`) +
    row('Stay', `<a href="${esc(stayUrl)}" style="color:#b7791f">${esc(stay)}</a>`) +
    row('Dates', `${esc(day(b.check_in))} → ${esc(day(b.check_out))} (${b.nights} night${b.nights === 1 ? '' : 's'})`) +
    row('Guests', esc(guests)) +
    row('Quoted total', esc(inr(b.total_paise))) +
    `</table>`;

  const teamBody =
    details +
    `<table style="border-collapse:collapse;margin-bottom:16px">` +
    row('Name', esc(b.guest_name)) +
    row('Phone', b.guest_phone ? esc(b.guest_phone) : '—') +
    row('Email', b.guest_email ? esc(b.guest_email) : '—') +
    row('Account', b.guest_id ? 'Signed-in customer' : 'Not signed in') +
    (b.special_requests ? row('Notes', esc(b.special_requests).replace(/\n/g, '<br>')) : '') +
    `</table>` +
    (digits ? button(`https://wa.me/${digits}?text=${followUp}`, 'WhatsApp guest', '#16a34a') : '') +
    (b.guest_phone ? button(`tel:${b.guest_phone}`, 'Call guest', '#111827') : '') +
    (b.guest_email ? button(`mailto:${b.guest_email}?subject=${encodeURIComponent(`Your IvStay request ${b.reference}`)}`, 'Email guest', '#6b7280') : '') +
    `<p style="font-size:13px;margin-top:16px"><a href="${esc(SITE_URL)}/admin/dashboard" style="color:#b7791f">Open the bookings ledger</a></p>`;

  const guestBody =
    `<p style="font-size:14px;line-height:1.6">Hi ${esc(firstName)}, thanks for your request. We're checking availability with the host and will get back to you on WhatsApp${b.guest_phone ? ` (${esc(b.guest_phone)})` : ''} or email shortly. Nothing has been charged.</p>` +
    details +
    `<p style="font-size:14px;line-height:1.6">Questions? Just reply to this email or message us on WhatsApp, quoting <b>${esc(b.reference)}</b>.</p>`;

  try {
    await mailer.sendMail({
      from: `"IvStay bookings" <${GMAIL_USER}>`,
      to: TEAM_EMAIL,
      replyTo: b.guest_email || undefined,
      subject: `New booking request ${b.reference}: ${b.guest_name}, ${stay}, ${day(b.check_in)}`,
      html: layout('New booking request', teamBody),
    });
    if (b.guest_email) {
      await mailer.sendMail({
        from: `"IvStay" <${GMAIL_USER}>`,
        to: b.guest_email,
        replyTo: TEAM_EMAIL,
        subject: `We've got your request ${b.reference} for ${stay}`,
        html: layout('Your booking request is in', guestBody),
      });
    }
  } catch (sendError) {
    // Let a later call try again
    await admin.from('bookings').update({ notified_at: null }).eq('id', b.id);
    return json({ error: `Email failed: ${(sendError as Error).message}` }, 502);
  }

  return json({ sent: true, guestEmailed: !!b.guest_email });
});
