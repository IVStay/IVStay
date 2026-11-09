import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_CODE } from '../../lib/phone';


/** Splits a stored number like +919876543210 into its calling code and the rest. */
export function splitPhone(value: string | null | undefined): { code: string; number: string } {
  const v = (value ?? '').trim();
  if (!v.startsWith('+')) return { code: DEFAULT_CODE, number: v.replace(/\D/g, '') };
  const match = [...COUNTRY_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((c) => v.startsWith(c.code));
  return match ? { code: match.code, number: v.slice(match.code.length) } : { code: DEFAULT_CODE, number: v.replace(/\D/g, '') };
}

interface PhoneInputProps {
  id?: string;
  /** Full number with calling code, e.g. +919876543210 ('' when empty) */
  value: string;
  onChange: (fullNumber: string) => void;
  required?: boolean;
  size?: 'md' | 'sm';
  invalid?: boolean;
}

/** Country-code picker (India by default) next to the local number. Emits +<code><number>. */
export const PhoneInput: React.FC<PhoneInputProps> = ({ id, value, onChange, required, size = 'md', invalid }) => {
  const [code, setCode] = useState(() => splitPhone(value).code);
  const [number, setNumber] = useState(() => splitPhone(value).number);

  // Follow the value when the parent fills it in (e.g. from the signed-in customer's profile)
  useEffect(() => {
    const current = number ? `${code}${number}` : '';
    if (value !== current) {
      const parts = splitPhone(value);
      setCode(parts.code);
      setNumber(parts.number);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const country = COUNTRY_CODES.find((c) => c.code === code) ?? COUNTRY_CODES[0];
  const emit = (nextCode: string, nextNumber: string) => onChange(nextNumber ? `${nextCode}${nextNumber}` : '');

  const pad = size === 'sm' ? 'py-2.5 text-xs' : 'py-3 text-sm';
  const border = invalid ? 'border-rose-400' : 'border-slate-200 focus-within:border-brand-slate';

  return (
    <div className={`flex w-full bg-white border rounded-xl overflow-hidden ${border}`}>
      <div className="relative shrink-0 border-r border-slate-200 bg-slate-50">
        <span className={`flex items-center gap-1 pl-3 pr-2 font-semibold text-brand-slate ${pad}`}>
          {country.code} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </span>
        <select
          aria-label="Country code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            emit(e.target.value, number);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.country} ({c.code})
            </option>
          ))}
        </select>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required={required}
        aria-invalid={invalid || undefined}
        value={number}
        placeholder={code === '+91' ? '98765 43210' : 'Phone number'}
        onChange={(e) => {
          let digits = e.target.value.replace(/\D/g, '');
          // Pasted with the code or a leading 0 (e.g. 919876543210, 09876543210): keep the local part
          const bare = code.slice(1);
          if (digits.length > country.digits[1] && digits.startsWith(bare)) digits = digits.slice(bare.length);
          if (digits.length > country.digits[1] && digits.startsWith('0')) digits = digits.slice(1);
          digits = digits.slice(0, country.digits[1]);
          setNumber(digits);
          emit(code, digits);
        }}
        className={`flex-1 min-w-0 px-3 bg-transparent focus:outline-none tracking-wide ${pad}`}
      />
    </div>
  );
};
