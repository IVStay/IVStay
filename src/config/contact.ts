// Single place for IvStay's public contact details.
// The number is the one the partner detail pages already use
// (partner_frontend/src/app/villas/[id]/page.tsx). Change it here to update the whole site.
export const CONTACT_PHONE = '+919915840484';
export const WHATSAPP_NUMBER = '919915840484';

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

/** WhatsApp chat with a guest (for the admin dashboard). Returns null when there's no usable number. */
export const guestWhatsappLink = (phone: string | null | undefined, message = '') => {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`; // Indian mobile typed without the country code
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};

/** Business details shown on the policy pages and in the footer. */
export const BUSINESS = {
  name: 'IvStay',
  email: 'bookivstay@gmail.com',
  phoneDisplay: '+91 99158 40484',
  /** Registered business name and postal address. Shown on the policy pages once filled in. */
  legalName: '',
  address: '',
};

/** Date the policy pages were last changed (shown at the top of each page). */
export const POLICIES_UPDATED = '9 November 2026';
