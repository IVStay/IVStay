import React, { useState } from 'react';
import { useProperties } from '../../context/PropertyContext';
import { useBookings } from '../../context/BookingContext';
import { useToast } from '../../context/ToastContext';
import { Property, Booking } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import {
  CalendarDays,
  Lock,
  UserCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';

export const GanttCalendar: React.FC = () => {
  const { properties, blockPropertyDates } = useProperties();
  const { bookings, cancelBooking, createBooking } = useBookings();
  const { showSuccess, showInfo } = useToast();

  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date()));
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [targetPropId, setTargetPropId] = useState<string>(properties[0]?.id || '');
  const [blockDate, setBlockDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Days in timeline (14 days timeline)
  const timelineDays = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, 13),
  });

  const handlePrevWeek = () => setStartDate((prev) => addDays(prev, -7));
  const handleNextWeek = () => setStartDate((prev) => addDays(prev, 7));

  const handleManualBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPropId || !blockDate) return;
    blockPropertyDates(targetPropId, [blockDate]);
    showSuccess('Dates Blocked', `Date ${blockDate} marked as maintenance blocked`);
    setIsBlockModalOpen(false);
  };

  const handleCancelAndRefund = (bookingId: string) => {
    cancelBooking(bookingId);
    showInfo('Reservation Cancelled', 'Refund processed & notification dispatched');
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <h2 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-brand-gold" />
            Availability Timeline & Gantt Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage property availability per row, block owner/maintenance dates, and review guest orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-full border border-slate-700">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 transition-colors"
              title="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white px-3 font-mono">
              {format(startDate, 'MMM d')} - {format(addDays(startDate, 13), 'MMM d, yyyy')}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-full hover:bg-slate-700 text-slate-300 transition-colors"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button onClick={() => setIsBlockModalOpen(true)} variant="gold" size="sm">
            <Lock className="w-3.5 h-3.5 mr-1" />
            Block Dates
          </Button>
        </div>
      </div>

      {/* Interactive Gantt Matrix Grid */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <th className="p-4 font-bold uppercase tracking-wider text-brand-gold min-w-[220px] sticky left-0 bg-slate-950 z-10">
                Property Master
              </th>
              {timelineDays.map((day) => (
                <th key={day.toISOString()} className="p-2 text-center min-w-[55px] font-mono border-l border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">{format(day, 'EEE')}</div>
                  <div className="font-bold text-white">{format(day, 'd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {properties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors">
                {/* Property Name Cell */}
                <td className="p-4 font-semibold text-white sticky left-0 bg-slate-900 z-10 border-r border-slate-800">
                  <div className="flex items-center gap-2">
                    <img
                      src={prop.images[0]}
                      alt={prop.title}
                      className="w-8 h-8 rounded-lg object-cover ring-1 ring-brand-gold/40"
                    />
                    <div className="overflow-hidden">
                      <p className="truncate font-bold text-xs text-white">{prop.title}</p>
                      <p className="text-[10px] text-amber-300 font-mono">₹{prop.price_per_night}/night</p>
                    </div>
                  </div>
                </td>

                {/* Day Matrix Cells */}
                {timelineDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isBlocked = prop.blocked_dates?.includes(dayStr);

                  // Check if reserved by booking
                  const bookingMatch = bookings.find(
                    (b) =>
                      b.property_id === prop.id &&
                      b.booking_status !== 'cancelled' &&
                      dayStr >= b.check_in &&
                      dayStr < b.check_out // checkout day is free for the next guest
                  );

                  return (
                    <td
                      key={dayStr}
                      className="p-1 text-center border-l border-slate-800 h-14 relative"
                    >
                      {bookingMatch ? (
                        <div
                          onClick={() => setSelectedBooking(bookingMatch)}
                          className={`w-full h-full rounded-lg cursor-pointer p-1 text-[9px] font-bold flex flex-col justify-center items-center transition-transform hover:scale-105 shadow-md ${
                            bookingMatch.booking_status === 'confirmed'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-indigo-600 text-white'
                          }`}
                          title={`Guest: ${bookingMatch.guest_name}`}
                        >
                          <UserCheck className="w-3 h-3" />
                          <span className="truncate max-w-[45px]">{bookingMatch.guest_name.split(' ')[0]}</span>
                        </div>
                      ) : isBlocked ? (
                        <div
                          className="w-full h-full rounded-lg bg-rose-950/80 text-rose-300 p-1 flex items-center justify-center border border-rose-800"
                          title="Host Maintenance Blocked"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-lg bg-emerald-950/20 hover:bg-emerald-900/40 transition-colors flex items-center justify-center">
                          <span className="text-[9px] text-emerald-500 font-mono">Available</span>
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

      {/* Booking Order Detail View Drawer/Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Reservation Order ${selectedBooking.id}`}
          subtitle="Detailed Guest Information & Reservation Control"
          maxWidth="lg"
        >
          <div className="space-y-6 text-slate-800">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <h4 className="font-serif font-bold text-base">{selectedBooking.property_title}</h4>
                <p className="text-xs text-slate-500">{selectedBooking.property_city}</p>
              </div>
              <Badge
                variant={selectedBooking.booking_status === 'confirmed' ? 'success' : 'warning'}
              >
                {selectedBooking.booking_status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Guest</span>
                <p className="font-bold">{selectedBooking.guest_name}</p>
                <p className="text-slate-500">{selectedBooking.guest_email}</p>
                <p className="text-slate-500">{selectedBooking.guest_phone}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Stay Dates</span>
                <p className="font-bold">
                  {selectedBooking.check_in} → {selectedBooking.check_out}
                </p>
                <p className="text-slate-500">{selectedBooking.total_nights} Nights • {selectedBooking.total_guests} Guests</p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-amber-300">
                <span>Total Amount Paid</span>
                <span>₹{selectedBooking.total_price.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-400">TXN Ref: {selectedBooking.transaction_id}</p>
              {selectedBooking.special_requests && (
                <p className="text-xs text-amber-200 italic pt-1 border-t border-slate-800">
                  "{selectedBooking.special_requests}"
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              {selectedBooking.booking_status !== 'cancelled' && (
                <Button
                  onClick={() => handleCancelAndRefund(selectedBooking.id)}
                  variant="danger"
                  size="sm"
                >
                  Issue Full Refund & Cancel
                </Button>
              )}
              <Button onClick={() => setSelectedBooking(null)} variant="outline" size="sm">
                Close View
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Date Blocking Modal */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        title="Block Dates for Maintenance / Owner Use"
        maxWidth="md"
      >
        <form onSubmit={handleManualBlock} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Property</label>
            <select
              value={targetPropId}
              onChange={(e) => setTargetPropId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date to Block</label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
          </div>

          <Button type="submit" variant="gold" className="w-full py-3">
            Confirm Date Block
          </Button>
        </form>
      </Modal>
    </div>
  );
};
