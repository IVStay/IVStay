import React, { useMemo, useState } from 'react';
import { useProperties } from '../../context/PropertyContext';
import { HOLDING_STATUSES, useBookings } from '../../context/BookingContext';
import { useToast } from '../../context/ToastContext';
import { AvailabilityBlock, Booking } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { CalendarDays, Lock, UserCheck, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { formatINR } from '../../utils/currency';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT, SOURCE_LABEL } from '../../lib/bookingLabels';

/** Statuses drawn on the calendar. Enquiries don't hold dates, so they only appear in the ledger. */
const SHOWN_STATUSES: Booking['booking_status'][] = [...HOLDING_STATUSES, 'completed'];

const REASON_LABEL: Record<AvailabilityBlock['reason'], string> = {
  maintenance: 'Maintenance',
  owner_use: 'Owner using it',
  other: 'Other',
};

export const GanttCalendar: React.FC = () => {
  const { properties } = useProperties();
  const { bookings, blocks, updateBooking, addBlock, removeBlock } = useBookings();
  const { showSuccess, showError } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ propertyId: '', from: today, to: today, reason: 'maintenance' as AvailabilityBlock['reason'], note: '' });
  const [busy, setBusy] = useState(false);

  const timelineDays = eachDayOfInterval({ start: startDate, end: addDays(startDate, 13) });

  const shownBookings = useMemo(() => bookings.filter((b) => SHOWN_STATUSES.includes(b.booking_status)), [bookings]);

  const openBlockModal = () => {
    setBlockForm({ propertyId: properties[0]?.id ?? '', from: today, to: today, reason: 'maintenance', note: '' });
    setIsBlockModalOpen(true);
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockForm.propertyId) return;
    if (blockForm.to < blockForm.from) {
      showError('Check the dates', 'The last blocked night must be on or after the first.');
      return;
    }
    setBusy(true);
    try {
      await addBlock({
        property_id: blockForm.propertyId,
        starts_on: blockForm.from,
        // Stored as the first free night again
        ends_on: format(addDays(parseISO(blockForm.to), 1), 'yyyy-MM-dd'),
        reason: blockForm.reason,
        note: blockForm.note.trim() || null,
      });
      showSuccess('Dates blocked', blockForm.from === blockForm.to ? blockForm.from : `${blockForm.from} to ${blockForm.to}`);
      setIsBlockModalOpen(false);
    } catch (error) {
      showError('Could not block those dates', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  const handleUnblock = async (block: AvailabilityBlock) => {
    const lastNight = format(addDays(parseISO(block.ends_on), -1), 'yyyy-MM-dd');
    if (!confirm(`Unblock ${block.starts_on === lastNight ? block.starts_on : `${block.starts_on} to ${lastNight}`}?`)) return;
    try {
      await removeBlock(block.id);
      showSuccess('Dates unblocked', `${block.starts_on} to ${lastNight}`);
    } catch (error) {
      showError('Could not unblock', error instanceof Error ? error.message : String(error));
    }
  };

  const changeStatus = async (booking: Booking, status: Booking['booking_status']) => {
    const verb = status === 'confirmed' ? 'Confirm' : 'Cancel';
    if (!confirm(`${verb} booking ${booking.reference} for ${booking.guest_name}?`)) return;
    setBusy(true);
    try {
      const updated = await updateBooking(booking.id, { booking_status: status });
      setSelectedBooking(updated);
      showSuccess(status === 'confirmed' ? 'Booking confirmed' : 'Booking cancelled', booking.reference);
    } catch (error) {
      showError(`Could not ${verb.toLowerCase()} the booking`, error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-gold" />
            Availability calendar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Held and confirmed bookings, and dates blocked for maintenance or the owner. Click a booking for details,
            or a lock to unblock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-full border border-slate-700">
            <button onClick={() => setStartDate((prev) => addDays(prev, -7))} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 transition-colors" aria-label="Previous week">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-3 font-mono">
              {format(startDate, 'MMM d')} - {format(addDays(startDate, 13), 'MMM d, yyyy')}
            </span>
            <button onClick={() => setStartDate((prev) => addDays(prev, 7))} className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 transition-colors" aria-label="Next week">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={openBlockModal} variant="gold" size="sm" disabled={properties.length === 0}>
            <Lock className="w-3.5 h-3.5 mr-1" />
            Block dates
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="p-4 font-bold uppercase tracking-wider text-brand-gold min-w-[220px] sticky left-0 bg-slate-950 z-10">Stay</th>
              {timelineDays.map((day) => (
                <th key={day.toISOString()} className="p-2 text-center min-w-[55px] font-mono border-l border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">{format(day, 'EEE')}</div>
                  <div className="font-bold text-white">{format(day, 'd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {properties.length === 0 && (
              <tr>
                <td colSpan={15} className="p-8 text-center text-slate-500">No stays yet.</td>
              </tr>
            )}
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="p-4 font-semibold text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                  <div className="flex items-center gap-2">
                    {prop.images[0] ? (
                      <img src={prop.images[0]} alt={prop.title} className="w-8 h-8 rounded-lg object-cover ring-1 ring-brand-gold/40" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-800" />
                    )}
                    <div className="overflow-hidden">
                      <p className="truncate font-bold text-xs text-white">{prop.title}</p>
                      <p className="text-[10px] text-amber-300 font-mono">
                        {formatINR(prop.price_per_night)}/night{prop.status !== 'active' ? ` · ${prop.status}` : ''}
                      </p>
                    </div>
                  </div>
                </td>

                {timelineDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  // A night belongs to a stay from check-in up to (not including) check-out
                  const booking = shownBookings.find(
                    (b) => b.property_id === prop.id && dayStr >= b.check_in && dayStr < b.check_out
                  );
                  const block = blocks.find(
                    (bl) => bl.property_id === prop.id && dayStr >= bl.starts_on && dayStr < bl.ends_on
                  );

                  return (
                    <td key={dayStr} className="p-1 text-center border-l border-slate-800 h-14 relative">
                      {booking ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className={`w-full h-full rounded-lg p-1 text-[9px] font-bold flex flex-col justify-center items-center transition-transform hover:scale-105 shadow-md ${
                            booking.booking_status === 'confirmed'
                              ? 'bg-amber-500 text-slate-950'
                              : booking.booking_status === 'awaiting_payment'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-600 text-white'
                          }`}
                          title={`${booking.reference} · ${booking.guest_name} · ${BOOKING_STATUS_LABEL[booking.booking_status]}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span className="truncate max-w-[45px]">{booking.guest_name.split(' ')[0]}</span>
                        </button>
                      ) : block ? (
                        <button
                          type="button"
                          onClick={() => void handleUnblock(block)}
                          className="w-full h-full rounded-lg bg-rose-950/80 text-rose-300 p-1 flex items-center justify-center border border-rose-800 hover:bg-rose-900"
                          title={`Blocked: ${REASON_LABEL[block.reason]}${block.note ? ` (${block.note})` : ''}. Click to unblock.`}
                          aria-label={`Blocked on ${dayStr}. Unblock`}
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full h-full rounded-lg bg-emerald-950/20 flex items-center justify-center">
                          <span className="text-[9px] text-emerald-500 font-mono">Free</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Confirmed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-indigo-600" /> Awaiting payment (dates held)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-600" /> Completed</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-950 border border-rose-800" /> Blocked</span>
      </div>

      {/* Booking details */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Booking ${selectedBooking.reference}`}
          subtitle={`From ${SOURCE_LABEL[selectedBooking.source]}`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-slate-800">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h4 className="font-serif font-bold text-base">{selectedBooking.property_title}</h4>
                <p className="text-xs text-slate-500">{selectedBooking.property_city}</p>
              </div>
              <Badge variant={BOOKING_STATUS_VARIANT[selectedBooking.booking_status]}>
                {BOOKING_STATUS_LABEL[selectedBooking.booking_status]}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Guest</span>
                <p className="font-bold">{selectedBooking.guest_name}</p>
                {selectedBooking.guest_phone && (
                  <a href={`tel:${selectedBooking.guest_phone}`} className="flex items-center gap-1 text-slate-600 hover:underline">
                    <Phone className="w-3 h-3" /> {selectedBooking.guest_phone}
                  </a>
                )}
                {selectedBooking.guest_email && (
                  <a href={`mailto:${selectedBooking.guest_email}`} className="flex items-center gap-1 text-slate-600 hover:underline">
                    <Mail className="w-3 h-3" /> {selectedBooking.guest_email}
                  </a>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Stay</span>
                <p className="font-bold">
                  {selectedBooking.check_in} → {selectedBooking.check_out}
                </p>
                <p className="text-slate-500">
                  {selectedBooking.nights} night{selectedBooking.nights === 1 ? '' : 's'} · {selectedBooking.adults + selectedBooking.children} guest
                  {selectedBooking.adults + selectedBooking.children === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-300">
                <span>Quoted total</span>
                <span>{selectedBooking.total_price > 0 ? formatINR(selectedBooking.total_price) : '—'}</span>
              </div>
              {selectedBooking.customer_rate != null && (
                <div className="flex justify-between text-slate-300">
                  <span>Guest pays (ledger)</span>
                  <span>{formatINR(selectedBooking.customer_rate)} · {selectedBooking.customer_payment_status}</span>
                </div>
              )}
              {selectedBooking.special_requests && (
                <p className="text-xs text-amber-200 italic pt-1 border-t border-slate-800">“{selectedBooking.special_requests}”</p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              {(selectedBooking.booking_status === 'enquiry' || selectedBooking.booking_status === 'awaiting_payment') && (
                <Button onClick={() => void changeStatus(selectedBooking, 'confirmed')} variant="gold" size="sm" isLoading={busy}>
                  Confirm booking
                </Button>
              )}
              {selectedBooking.booking_status !== 'cancelled' && selectedBooking.booking_status !== 'completed' && (
                <Button onClick={() => void changeStatus(selectedBooking, 'cancelled')} variant="danger" size="sm" disabled={busy}>
                  Cancel booking
                </Button>
              )}
              <Button onClick={() => setSelectedBooking(null)} variant="outline" size="sm">
                Close
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Refunds aren't automatic: record them in the bookings ledger once you've paid the guest back.
            </p>
          </div>
        </Modal>
      )}

      {/* Block dates */}
      <Modal isOpen={isBlockModalOpen} onClose={() => setIsBlockModalOpen(false)} title="Block dates" subtitle="For maintenance or when the owner is using the stay" maxWidth="md">
        <form onSubmit={(e) => void handleBlock(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="block-stay">Stay</label>
            <select
              id="block-stay"
              value={blockForm.propertyId}
              onChange={(e) => setBlockForm((f) => ({ ...f, propertyId: e.target.value }))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.city})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="block-from">First night</label>
              <input
                id="block-from"
                type="date"
                value={blockForm.from}
                onChange={(e) => setBlockForm((f) => ({ ...f, from: e.target.value, to: f.to < e.target.value ? e.target.value : f.to }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="block-to">Last night</label>
              <input
                id="block-to"
                type="date"
                value={blockForm.to}
                min={blockForm.from}
                onChange={(e) => setBlockForm((f) => ({ ...f, to: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="block-reason">Reason</label>
              <select
                id="block-reason"
                value={blockForm.reason}
                onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value as AvailabilityBlock['reason'] }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {Object.entries(REASON_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1" htmlFor="block-note">Note</label>
              <input
                id="block-note"
                type="text"
                value={blockForm.note}
                onChange={(e) => setBlockForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Optional"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
          <Button type="submit" variant="gold" className="w-full py-3" isLoading={busy}>
            Block these dates
          </Button>
        </form>
      </Modal>
    </div>
  );
};
