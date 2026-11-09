import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Home, Inbox, Mail, MessageCircle, Phone, RefreshCw } from 'lucide-react';
import { describeError, fetchEnquiries, updateEnquiry, type Enquiry, type EnquiryStatus } from '../../lib/db';
import { guestWhatsappLink } from '../../config/contact';
import { supabase } from '../../lib/supabase';

const STATUS_LABEL: Record<EnquiryStatus, string> = { new: 'New', in_progress: 'Following up', closed: 'Done' };
const STATUS_STYLE: Record<EnquiryStatus, string> = {
  new: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  in_progress: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  closed: 'bg-slate-700/40 text-slate-400 border-slate-600',
};

export const AdminEnquiriesPage: React.FC = () => {
  const [items, setItems] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'all' | 'list_property'>('open');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!supabase) {
      setItems([]);
      setError('Messages need the Supabase connection.');
      return;
    }
    setRefreshing(true);
    try {
      setItems(await fetchEnquiries());
      setError(null);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const change = async (id: string, patch: { status?: EnquiryStatus; admin_notes?: string | null }) => {
    setItems((list) => list?.map((e) => (e.id === id ? { ...e, ...patch } : e)) ?? null);
    try {
      await updateEnquiry(id, patch);
    } catch (e) {
      setError(describeError(e));
      void load();
    }
  };

  const shown = useMemo(() => {
    if (!items) return [];
    if (filter === 'open') return items.filter((e) => e.status !== 'closed');
    if (filter === 'list_property') return items.filter((e) => e.kind === 'list_property');
    return items;
  }, [items, filter]);

  const openCount = items?.filter((e) => e.status !== 'closed').length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
            <Inbox className="w-7 h-7 text-brand-gold" /> Messages
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            From the Contact page and "List your property". {openCount} still open.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['open', 'Open'],
            ['list_property', 'Property owners'],
            ['all', 'All'],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
              filter === value ? 'bg-brand-gold text-white border-brand-gold' : 'border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {text}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
      {items === null && <p className="text-xs text-slate-500">Loading messages…</p>}
      {items && shown.length === 0 && (
        <p className="text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          No messages here.
        </p>
      )}

      <ul className="space-y-4">
        {shown.map((e) => {
          const wa = guestWhatsappLink(e.phone, `Hi ${e.name.split(' ')[0]}, this is IvStay replying to your message. `);
          return (
            <li key={e.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{e.name}</span>
                    {e.kind === 'list_property' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-semibold">
                        <Home className="w-3 h-3" /> Property owner
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">{format(parseISO(e.created_at), 'd MMM yyyy, HH:mm')}</p>
                </div>
                <select
                  value={e.status}
                  onChange={(ev) => void change(e.id, { status: ev.target.value as EnquiryStatus })}
                  className={`text-[11px] font-semibold rounded-full border px-3 py-1 bg-transparent ${STATUS_STYLE[e.status]}`}
                  aria-label="Status"
                >
                  {(Object.keys(STATUS_LABEL) as EnquiryStatus[]).map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>

              {e.message && <p className="text-sm text-slate-300 whitespace-pre-wrap">{e.message}</p>}

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {e.phone && (
                  <a href={`tel:${e.phone}`} className="flex items-center gap-1 text-slate-300 hover:text-white">
                    <Phone className="w-3 h-3" /> {e.phone}
                  </a>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/40 text-[10px] font-semibold"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </a>
                )}
                {e.email && (
                  <a href={`mailto:${e.email}`} className="flex items-center gap-1 text-slate-400 hover:text-white">
                    <Mail className="w-3 h-3" /> {e.email}
                  </a>
                )}
              </div>

              <textarea
                defaultValue={e.admin_notes ?? ''}
                onBlur={(ev) => {
                  const value = ev.target.value.trim() || null;
                  if (value !== (e.admin_notes ?? null)) void change(e.id, { admin_notes: value });
                }}
                rows={2}
                placeholder="Team notes (saved when you click away)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-gold"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
