// Phone-number rules, the same as the database's normalize_phone() / is_valid_phone():
//   * Indian mobiles: 10 digits starting with 6-9. "98765 43210", "098765 43210",
//     "919876543210" and "+91 98765-43210" all become +919876543210.
//   * Other countries: + and the country code, 8-15 digits in all.

export const PHONE_HINT = 'Indian mobile: 10 digits. Outside India: start with + and the country code.';
export const PHONE_ERROR = 'Enter a real mobile number: 10 digits for India (e.g. 98765 43210), or + and the country code.';

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
  return /^\+[1-9]\d{7,14}$/.test(p);
}
