// Single place for IvStay's public contact details.
// The number is the one the partner detail pages already use
// (partner_frontend/src/app/villas/[id]/page.tsx). Change it here to update the whole site.
export const CONTACT_PHONE = '+919915840484';
export const WHATSAPP_NUMBER = '919915840484';

export const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
