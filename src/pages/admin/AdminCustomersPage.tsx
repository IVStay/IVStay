import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Download, Mail, MessageCircle, Phone, RefreshCw, Search, Users } from 'lucide-react';
import { fetchCustomers, describeError, type Customer } from '../../lib/db';
import { guestWhatsappLink } from '../../config/contact';
import { supabase } from '../../lib/supabase';

const when = (iso: string | null) => (iso ? format(parseISO(iso), 'd MMM yyyy, HH:mm') : '—');

const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!supabase) {
      setError('Customer accounts need the Supabase connection (not available in browser-only mode).');
      setCustomers([]);
      return;
    }
    setRefreshing(true);
    try {
      setCustomers(await fetchCustomers());
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

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!customers) return [];
    if (!q) return customers;
    return customers.filter((c) =>
      [c.full_name, c.email, c.phone].some((v) => (v ?? '').toLowerCase().includes(q))
    );
  }, [customers, query]);

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Phone', 'Signed up with', 'Joined', 'Last sign-in', 'Requests', 'Last request'];
    const rows = shown.map((c) => [
      c.full_name,
      c.email,
      c.phone,
      c.provider,
      c.created_at,
      c.last_sign_in_at ?? '',
      c.booking_count,
      c.last_request_at ?? '',
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: `ivstay-customers-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    });
    link.click();
    URL.revokeObjectURL(url);
  };

  const withPhone = customers?.filter((c) => c.phone).length ?? 0;
  const withRequests = customers?.filter((c) => c.booking_count > 0).length ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-7 h-7 text-brand-gold" /> Customers
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Everyone who created an account on the website, newest first.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!shown.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-brand-gold text-white disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          ['Accounts', customers?.length ?? 0],
          ['With phone number', withPhone],
          ['Sent a request', withRequests],
        ].map(([label, value]) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or phone"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-gold"
        />
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Last sign-in</th>
              <th className="py-3 px-4 text-right">Requests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {customers === null && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  Loading customers…
                </td>
              </tr>
            )}
            {customers && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  {customers.length ? 'Nobody matches that search.' : 'No customer accounts yet.'}
                </td>
              </tr>
            )}
            {shown.map((c) => {
              const wa = guestWhatsappLink(c.phone, `Hi ${c.full_name.split(' ')[0] || 'there'}, this is IvStay. `);
              return (
                <tr key={c.id} className="align-top hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white">{c.full_name || 'No name given'}</div>
                    <div className="text-[10px] text-slate-500 capitalize">via {c.provider}</div>
                  </td>
                  <td className="py-3 px-4 space-y-1">
                    {c.phone ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-slate-300 hover:text-white">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </a>
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
                      </div>
                    ) : (
                      <div className="text-slate-600">No phone yet</div>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-slate-400 hover:text-white">
                        <Mail className="w-3 h-3" /> {c.email}
                      </a>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{when(c.created_at)}</td>
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{when(c.last_sign_in_at)}</td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-bold text-white">{c.booking_count}</span>
                    {c.last_request_at && (
                      <div className="text-[10px] text-slate-500">last {format(parseISO(c.last_request_at), 'd MMM')}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
