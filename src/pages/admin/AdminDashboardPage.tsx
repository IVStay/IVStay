import React, { useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { useBookings } from '../../context/BookingContext';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CalendarCheck, Edit2, Trash2, Plus, X, Save, Phone, Mail } from 'lucide-react';
import { Booking, BookingInput, BookingSource, BookingStatus, LedgerStatus, PaymentStatus } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  PAYMENT_STATUS_LABEL,
  SOURCE_LABEL,
} from '../../lib/bookingLabels';

const NEW = 'new';
const field = 'w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white';

const toInput = (b: Booking): BookingInput => ({
  property_id: b.property_id,
  guest_name: b.guest_name,
  guest_email: b.guest_email ?? '',
  guest_phone: b.guest_phone ?? '',
  check_in: b.check_in,
  check_out: b.check_out,
  adults: b.adults,
  children: b.children,
  booking_status: b.booking_status,
  payment_status: b.payment_status,
  source: b.source,
  special_requests: b.special_requests ?? '',
  admin_notes: b.admin_notes ?? '',
  customer_rate: b.customer_rate ?? null,
  customer_payment_date: b.customer_payment_date ?? '',
  customer_payment_status: b.customer_payment_status,
  owner_rate: b.owner_rate ?? null,
  owner_payment_date: b.owner_payment_date ?? '',
  owner_payment_status: b.owner_payment_status,
});

function problemsWith(form: BookingInput): string | null {
  if (!form.property_id) return 'Choose the stay.';
  if (form.guest_name.trim().length < 1) return 'Add the guest\'s name.';
  if (!form.guest_phone?.trim() && !form.guest_email?.trim()) return 'Add a phone number or email for the guest.';
  if (!form.check_in || !form.check_out || form.check_out <= form.check_in) return 'Check-out must be after check-in.';
  if (form.adults < 1) return 'At least one adult is needed.';
  return null;
}

const rupeesOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

export const AdminDashboardPage: React.FC = () => {
  const { bookings, loading, loadError, createBooking, updateBooking, deleteBooking } = useBookings();
  const { properties } = useProperties();
  const { showSuccess, showError } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BookingInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: bookings.length };
    for (const b of bookings) result[b.booking_status] = (result[b.booking_status] ?? 0) + 1;
    return result;
  }, [bookings]);

  const visible = bookings.filter((b) => statusFilter === 'all' || b.booking_status === statusFilter);
  const set = <K extends keyof BookingInput>(key: K, value: BookingInput[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const startEdit = (booking: Booking) => {
    setEditingId(booking.id);
    setForm(toInput(booking));
  };

  const startNew = () => {
    const today = new Date();
    setEditingId(NEW);
    setForm({
      property_id: properties[0]?.id ?? '',
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: format(today, 'yyyy-MM-dd'),
      check_out: format(addDays(today, 1), 'yyyy-MM-dd'),
      adults: 2,
      children: 0,
      booking_status: 'enquiry',
      payment_status: 'unpaid',
      source: 'phone',
      special_requests: '',
      admin_notes: '',
      customer_rate: null,
      customer_payment_date: '',
      customer_payment_status: 'pending',
      owner_rate: null,
      owner_payment_date: '',
      owner_payment_status: 'pending',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(null);
  };

  const save = async () => {
    if (!form || !editingId) return;
    const problem = problemsWith(form);
    if (problem) {
      showError('Check the booking', problem);
      return;
    }
    setSaving(true);
    try {
      const saved = editingId === NEW ? await createBooking(form) : await updateBooking(editingId, form);
      showSuccess(editingId === NEW ? 'Booking added' : 'Booking saved', `${saved.reference} · ${saved.guest_name}`);
      cancelEdit();
    } catch (error) {
      showError('Could not save the booking', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (booking: Booking) => {
    if (!confirm(`Delete booking ${booking.reference} for ${booking.guest_name}? This cannot be undone.`)) return;
    try {
      await deleteBooking(booking.id);
      showSuccess('Booking deleted', booking.reference);
    } catch (error) {
      showError('Could not delete the booking', error instanceof Error ? error.message : String(error));
    }
  };

  const ledgerCells = (prefix: 'customer' | 'owner', booking?: Booking) => {
    const rateKey = `${prefix}_rate` as const;
    const dateKey = `${prefix}_payment_date` as const;
    const statusKey = `${prefix}_payment_status` as const;
    if (form && (booking ? editingId === booking.id : editingId === NEW)) {
      return (
        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="flex gap-2 items-center">
            <span className="text-slate-500">₹</span>
            <input
              type="number"
              min={0}
              value={form[rateKey] ?? ''}
              onChange={(e) => set(rateKey, rupeesOrNull(e.target.value))}
              className={field}
              placeholder="Amount"
              aria-label={`${prefix === 'customer' ? 'Customer' : 'Owner'} amount`}
            />
          </div>
          <input
            type="date"
            value={form[dateKey] ?? ''}
            onChange={(e) => set(dateKey, e.target.value)}
            className={field}
            aria-label={`${prefix === 'customer' ? 'Customer' : 'Owner'} payment date`}
          />
          <select
            value={form[statusKey]}
            onChange={(e) => set(statusKey, e.target.value as LedgerStatus)}
            className={field}
            aria-label={`${prefix === 'customer' ? 'Customer' : 'Owner'} payment status`}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      );
    }
    if (!booking) return null;
    const rate = booking[rateKey];
    return (
      <div className="space-y-1">
        <div className={`font-bold ${prefix === 'customer' ? 'text-blue-400' : 'text-emerald-400'}`}>
          {rate != null ? formatINR(rate) : '—'}
        </div>
        <div>{booking[dateKey] || 'No date'}</div>
        <Badge variant={booking[statusKey] === 'paid' ? 'success' : 'warning'}>
          {booking[statusKey] === 'paid' ? 'Paid' : 'Pending'}
        </Badge>
      </div>
    );
  };

  const renderRow = (booking?: Booking) => {
    const isEditing = !!form && (booking ? editingId === booking.id : editingId === NEW);
    const key = booking?.id ?? NEW;

    return (
      <tr key={key} className={`transition-colors ${isEditing ? 'bg-slate-800/40' : 'hover:bg-slate-800/30'}`}>
        {/* Booking, stay and guest */}
        <td className="py-4 px-4 align-top">
          {isEditing && form ? (
            <div className="flex flex-col gap-2 min-w-[180px]">
              <select value={form.property_id} onChange={(e) => set('property_id', e.target.value)} className={field} aria-label="Stay">
                <option value="">Choose a stay…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.city}){p.status !== 'active' ? ` · ${p.status}` : ''}
                  </option>
                ))}
              </select>
              <input type="text" value={form.guest_name} onChange={(e) => set('guest_name', e.target.value)} className={field} placeholder="Guest name" aria-label="Guest name" />
              <input type="tel" value={form.guest_phone ?? ''} onChange={(e) => set('guest_phone', e.target.value)} className={field} placeholder="Phone" aria-label="Guest phone" />
              <input type="email" value={form.guest_email ?? ''} onChange={(e) => set('guest_email', e.target.value)} className={field} placeholder="Email (optional)" aria-label="Guest email" />
              <select value={form.source} onChange={(e) => set('source', e.target.value as BookingSource)} className={field} aria-label="Source">
                {Object.entries(SOURCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    From: {label}
                  </option>
                ))}
              </select>
            </div>
          ) : booking ? (
            <div className="space-y-0.5">
              <div className="text-[10px] text-brand-gold font-mono">
                {booking.reference} · {SOURCE_LABEL[booking.source]}
              </div>
              <div className="font-bold text-white truncate max-w-[180px]">{booking.property_title ?? 'Stay removed'}</div>
              <div className="text-slate-300">{booking.guest_name}</div>
              {booking.guest_phone && (
                <a href={`tel:${booking.guest_phone}`} className="flex items-center gap-1 text-slate-500 hover:text-white">
                  <Phone className="w-3 h-3" /> {booking.guest_phone}
                </a>
              )}
              {booking.guest_email && (
                <a href={`mailto:${booking.guest_email}`} className="flex items-center gap-1 text-slate-500 hover:text-white truncate max-w-[180px]">
                  <Mail className="w-3 h-3" /> {booking.guest_email}
                </a>
              )}
            </div>
          ) : null}
        </td>

        {/* Dates and guests */}
        <td className="py-4 px-4 align-top">
          {isEditing && form ? (
            <div className="flex flex-col gap-2 min-w-[140px]">
              <input type="date" value={form.check_in} onChange={(e) => set('check_in', e.target.value)} className={field} aria-label="Check-in" />
              <input type="date" value={form.check_out} onChange={(e) => set('check_out', e.target.value)} className={field} aria-label="Check-out" />
              <div className="flex gap-2">
                <input type="number" min={1} value={form.adults} onChange={(e) => set('adults', Math.max(1, Number(e.target.value) || 1))} className={field} aria-label="Adults" title="Adults" />
                <input type="number" min={0} value={form.children} onChange={(e) => set('children', Math.max(0, Number(e.target.value) || 0))} className={field} aria-label="Children" title="Children" />
              </div>
            </div>
          ) : booking ? (
            <div className="font-mono text-slate-400 space-y-0.5">
              <div>In: <span className="text-white">{booking.check_in}</span></div>
              <div>Out: <span className="text-white">{booking.check_out}</span></div>
              <div className="text-[10px]">
                {booking.nights} night{booking.nights === 1 ? '' : 's'} · {booking.adults + booking.children} guest
                {booking.adults + booking.children === 1 ? '' : 's'}
              </div>
            </div>
          ) : null}
        </td>

        {/* Status */}
        <td className="py-4 px-4 align-top">
          {isEditing && form ? (
            <div className="flex flex-col gap-2 min-w-[140px]">
              <select value={form.booking_status} onChange={(e) => set('booking_status', e.target.value as BookingStatus)} className={field} aria-label="Booking status">
                {Object.entries(BOOKING_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select value={form.payment_status} onChange={(e) => set('payment_status', e.target.value as PaymentStatus)} className={field} aria-label="Payment status">
                {Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          ) : booking ? (
            <div className="space-y-1">
              <Badge variant={BOOKING_STATUS_VARIANT[booking.booking_status]}>{BOOKING_STATUS_LABEL[booking.booking_status]}</Badge>
              <div className="text-[10px] text-slate-400">{PAYMENT_STATUS_LABEL[booking.payment_status]}</div>
              {booking.total_price > 0 && <div className="text-[10px] text-slate-500">Quoted {formatINR(booking.total_price)}</div>}
            </div>
          ) : null}
        </td>

        {/* Ledger */}
        <td className="py-4 px-4 align-top bg-blue-500/5">{ledgerCells('customer', booking)}</td>
        <td className="py-4 px-4 align-top bg-emerald-500/5">{ledgerCells('owner', booking)}</td>

        {/* Actions */}
        <td className="py-4 px-4 align-top text-right whitespace-nowrap">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => void save()} disabled={saving} className="p-2 bg-brand-gold hover:bg-brand-goldHover text-white rounded-lg transition-colors disabled:opacity-50" aria-label="Save booking">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={cancelEdit} disabled={saving} className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors" aria-label="Cancel editing">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : booking ? (
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => startEdit(booking)} disabled={!!editingId} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30" aria-label={`Edit booking ${booking.reference}`}>
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => void remove(booking)} disabled={!!editingId} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30" aria-label={`Delete booking ${booking.reference}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-white">Bookings & Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Website requests arrive here as enquiries. Track what the guest pays and what the owner is paid.
          </p>
        </div>
        <Button variant="gold" size="sm" className="shadow-gold-glow" onClick={startNew} disabled={!!editingId || properties.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Add booking
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {(['all', 'enquiry', 'awaiting_payment', 'confirmed', 'completed', 'cancelled'] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={statusFilter === value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              statusFilter === value ? 'bg-brand-gold border-brand-gold text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {value === 'all' ? 'All' : BOOKING_STATUS_LABEL[value]} ({counts[value] ?? 0})
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-brand-gold" />
            Bookings
          </h3>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-4 whitespace-nowrap">Booking / Guest</th>
                <th className="py-4 px-4 whitespace-nowrap">Dates</th>
                <th className="py-4 px-4 whitespace-nowrap">Status</th>
                <th className="py-4 px-4 whitespace-nowrap bg-blue-500/5">Guest pays (amount / date / status)</th>
                <th className="py-4 px-4 whitespace-nowrap bg-emerald-500/5">Owner is paid (amount / date / status)</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {editingId === NEW && renderRow()}
              {visible.length === 0 && editingId !== NEW ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    {loading
                      ? 'Loading bookings…'
                      : loadError
                      ? `Couldn't load bookings: ${loadError}`
                      : bookings.length === 0
                      ? 'No bookings yet. Website requests will appear here, or click “Add booking”.'
                      : 'No bookings with this status.'}
                  </td>
                </tr>
              ) : (
                visible.map((booking) => renderRow(booking))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
