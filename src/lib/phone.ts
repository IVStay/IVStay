// Phone-number rules, the same as the database's normalize_phone() / is_valid_phone():
//   * Indian mobiles: 10 digits starting with 6-9. "98765 43210", "098765 43210",
//     "919876543210" and "+91 98765-43210" all become +919876543210.
//   * Other countries: + and the country code, 8-15 digits in all.

export const PHONE_ERROR = 'Enter a valid phone number: 10 digits for India, starting with 6, 7, 8 or 9.';
export const PHONE_REQUIRED = 'Please add your phone number.';

/** Calling codes offered in the picker. India first; the rest are where most guests come from. */
export const COUNTRY_CODES: { code: string; country: string; digits: [number, number] }[] = [
  { code: '+91', country: 'India', digits: [10, 10] },
  { code: '+971', country: 'United Arab Emirates', digits: [9, 9] },
  { code: '+1', country: 'United States / Canada', digits: [10, 10] },
  { code: '+44', country: 'United Kingdom', digits: [10, 10] },
  { code: '+61', country: 'Australia', digits: [9, 9] },
  { code: '+65', country: 'Singapore', digits: [8, 8] },
  { code: '+977', country: 'Nepal', digits: [10, 10] },
  { code: '+880', country: 'Bangladesh', digits: [10, 10] },
  { code: '+94', country: 'Sri Lanka', digits: [9, 9] },
  { code: '+966', country: 'Saudi Arabia', digits: [9, 9] },
  { code: '+974', country: 'Qatar', digits: [8, 8] },
  { code: '+968', country: 'Oman', digits: [8, 8] },
  { code: '+965', country: 'Kuwait', digits: [8, 8] },
  { code: '+973', country: 'Bahrain', digits: [8, 8] },
  { code: '+60', country: 'Malaysia', digits: [9, 10] },
  { code: '+66', country: 'Thailand', digits: [9, 9] },
  { code: '+64', country: 'New Zealand', digits: [8, 10] },
  { code: '+49', country: 'Germany', digits: [10, 11] },
  { code: '+33', country: 'France', digits: [9, 9] },
];

export const DEFAULT_CODE = '+91';


/** Tidies a number the way the database stores it (null when empty). */
export function normalizePhone(value: string | null | undefined): string | null {
  const d = (value ?? '').trim().replace(/[\s().-]/g, '');
  if (!d) return null;
  if (/^[6-9]\d{9}$/.test(d)) return `+91${d}`;
  if (/^0[6-9]\d{9}$/.test(d)) return `+91${d.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(d)) return `+${d}`;
  return d;
}

export function isValidPhone(value: string | null | undefined): boolean {
  const p = normalizePhone(value);
  if (!p) return false;
  if (p.startsWith('+91')) return /^\+91[6-9]\d{9}$/.test(p);
  if (!/^\+[1-9]\d{7,14}$/.test(p)) return false;
  // Known countries: check the length of the local number too
  const country = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length).find((c) => p.startsWith(c.code));
  if (!country) return true;
  const local = p.length - country.code.length;
  return local >= country.digits[0] && local <= country.digits[1];
}
