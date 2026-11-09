import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

/**
 * The main search: where, check-in, check-out and guests in one pill.
 * Opens /stays with the choices in the URL, which the stays list and stay pages read.
 */
export const SearchBar: React.FC<{ initialDestination?: string }> = ({ initialDestination = '' }) => {
  const navigate = useNavigate();
  const [where, setWhere] = useState(initialDestination);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [active, setActive] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (where.trim()) params.set('destination', where.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut && checkOut > checkIn) params.set('checkOut', checkOut);
    if (guests > 0) params.set('guests', String(guests));
    navigate(`/stays${params.toString() ? `?${params}` : ''}`);
  };

  const segment = (key: string) =>
    `relative flex-1 min-w-0 px-5 lg:px-6 py-3 rounded-full cursor-text transition-colors ${
      active === key ? 'bg-white shadow-float' : 'hover:bg-surface-muted'
    }`;
  const labelCls = 'block text-xs font-semibold text-ink';
  const inputCls =
    'w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none [color-scheme:light]';

  return (
    <form
      onSubmit={submit}
      role="search"
      className={`text-left w-full max-w-[860px] mx-auto rounded-3xl md:rounded-full border border-line shadow-pill flex flex-col md:flex-row md:items-center p-2 md:p-1.5 gap-1 md:gap-0 transition-colors ${
        active ? 'bg-surface-muted' : 'bg-white'
      }`}
    >
      <label className={segment('where')} onFocus={() => setActive('where')} onBlur={() => setActive(null)}>
        <span className={labelCls}>Where</span>
        <input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="Search destinations"
          className={inputCls}
          aria-label="Destination"
        />
      </label>
      <span className="hidden md:block w-px h-8 bg-line" />
      <label className={segment('in')} onFocus={() => setActive('in')} onBlur={() => setActive(null)}>
        <span className={labelCls}>Check in</span>
        <input
          type="date"
          value={checkIn}
          min={today()}
          onChange={(e) => {
            setCheckIn(e.target.value);
            if (e.target.value && (!checkOut || checkOut <= e.target.value)) {
              setCheckOut(format(addDays(parseISO(e.target.value), 2), 'yyyy-MM-dd'));
            }
          }}
          className={`${inputCls} ${checkIn ? '' : 'text-ink-muted'}`}
          aria-label="Check-in date"
        />
      </label>
      <span className="hidden md:block w-px h-8 bg-line" />
      <label className={segment('out')} onFocus={() => setActive('out')} onBlur={() => setActive(null)}>
        <span className={labelCls}>Check out</span>
        <input
          type="date"
          value={checkOut}
          min={checkIn || today()}
          onChange={(e) => setCheckOut(e.target.value)}
          className={`${inputCls} ${checkOut ? '' : 'text-ink-muted'}`}
          aria-label="Check-out date"
        />
      </label>
      <span className="hidden md:block w-px h-8 bg-line" />
      <div className={`${segment('who')} md:pr-2 flex items-center gap-3`} onFocus={() => setActive('who')} onBlur={() => setActive(null)}>
        <label className="flex-1 min-w-0">
          <span className={labelCls}>Who</span>
          <span className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Fewer guests"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="w-6 h-6 rounded-full border border-line text-ink-muted hover:border-ink hover:text-ink leading-none"
            >
              −
            </button>
            <span className="text-sm text-ink tabular-nums whitespace-nowrap min-w-[64px] text-center">
              {guests} guest{guests === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              aria-label="More guests"
              onClick={() => setGuests((g) => Math.min(30, g + 1))}
              className="w-6 h-6 rounded-full border border-line text-ink-muted hover:border-ink hover:text-ink leading-none"
            >
              +
            </button>
          </span>
        </label>
        <button
          type="submit"
          className="hidden md:flex shrink-0 w-12 h-12 rounded-full bg-ivy hover:bg-ivy-700 text-white items-center justify-center transition-colors"
          aria-label="Search"
        >
          <Search className="w-[18px] h-[18px] stroke-[2.5]" />
        </button>
      </div>
      <button
        type="submit"
        className="md:hidden flex items-center justify-center gap-2 h-12 rounded-full bg-ivy hover:bg-ivy-700 text-white font-semibold"
      >
        <Search className="w-4 h-4 stroke-[2.5]" /> Search
      </button>
    </form>
  );
};
