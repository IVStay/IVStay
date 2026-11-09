import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarDays, LogOut, MessageCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isValidPhone, PHONE_ERROR, PHONE_HINT } from '../lib/phone';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { fetchMyBookings, type MyBooking } from '../lib/db';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_VARIANT } from '../lib/bookingLabels';
import { whatsappLink } from '../config/contact';
import { formatINR } from '../utils/currency';
import type { BookingStatus } from '../types';

const field =
  'w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate';

const STATUS_NOTE: Partial<Record<BookingStatus, string>> = {
  enquiry: "Request received. We're checking with the host and will contact you on WhatsApp.",
  awaiting_payment: 'Dates held for you. Complete the payment we shared to confirm.',
  confirmed: 'Confirmed. See you soon!',
};

export const AccountPage: React.FC = () => {
  const { user, loading, logout, updateProfile } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<MyBooking[] | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name);
    setPhone(user.phone ?? '');
  }, [user?.id, user?.full_name, user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    let active = true;
    fetchMyBookings()
      .then((rows) => active && setBookings(rows))
      .catch((error: Error) => active && setBookingsError(error.message));
    return () => {
      active = false;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="py-24 text-center text-xs text-slate-500">Loading your account…</div>;
  }
  if (!user) return <Navigate to="/signin?next=/account" replace />;

  const missingPhone = !user.phone;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    if (fullName.trim().length < 2) return setProfileError('Please enter your full name.');
    if (phone.trim() && !isValidPhone(phone)) return setProfileError(PHONE_ERROR);
    setSaving(true);
    const result = await updateProfile({ fullName, phone });
    setSaving(false);
    if (result.ok) showSuccess('Saved', 'Your details are up to date.');
    else setProfileError(result.message);
  };

  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const upcoming = (bookings ?? []).filter((b) => b.check_out >= today && b.status !== 'cancelled');
  const past = (bookings ?? []).filter((b) => !(b.check_out >= today && b.status !== 'cancelled'));

  const bookingCard = (b: MyBooking) => {
    const status = b.status as BookingStatus;
    return (
      <li key={b.reference} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link to={`/stays/${b.property_slug}`} className="font-serif text-lg font-bold text-brand-slate hover:underline">
              {b.property_title}
            </Link>
            <p className="text-xs text-slate-500">
              {b.property_city} · Ref {b.reference}
            </p>
          </div>
          <Badge variant={BOOKING_STATUS_VARIANT[status] ?? 'neutral'}>{BOOKING_STATUS_LABEL[status] ?? b.status}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-brand-gold" />
            {format(parseISO(b.check_in), 'd MMM yyyy')} → {format(parseISO(b.check_out), 'd MMM yyyy')} ({b.nights}{' '}
            night{b.nights === 1 ? '' : 's'})
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand-gold" />
            {b.adults + b.children} guest{b.adults + b.children === 1 ? '' : 's'}
          </span>
          {b.total > 0 && <span className="font-semibold text-brand-slate">{formatINR(b.total)}</span>}
        </div>
        {STATUS_NOTE[status] && b.check_out >= today && <p className="text-xs text-slate-500">{STATUS_NOTE[status]}</p>}
        <a
          href={whatsappLink(`Hi IvStay, about my booking ${b.reference} (${b.property_title}).`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Message us about this
        </a>
      </li>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">My account</p>
          <h1 className="font-serif text-3xl font-bold text-brand-slate">
            Hi{user.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void signOut()}>
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-brand-slate">My bookings</h2>
            <Link to="/stays" className="text-xs font-semibold text-brand-gold hover:underline">
              Find a stay
            </Link>
          </div>
          {bookingsError && <p className="text-xs text-rose-600">Couldn't load your bookings: {bookingsError}</p>}
          {!bookings && !bookingsError && <p className="text-xs text-slate-500">Loading…</p>}
          {bookings && bookings.length === 0 && (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-slate-600">No bookings yet. When you request a stay, it shows up here.</p>
              <Button variant="gold" size="sm" onClick={() => navigate('/stays')}>
                Browse stays
              </Button>
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Upcoming and requested</h3>
              <ul className="space-y-3">{upcoming.map(bookingCard)}</ul>
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Past and cancelled</h3>
              <ul className="space-y-3 opacity-80">{past.map(bookingCard)}</ul>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <h2 className="font-serif text-xl font-bold text-brand-slate">My details</h2>
          {missingPhone && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Add your WhatsApp number so we can confirm bookings quickly.
            </p>
          )}
          <form onSubmit={save} className="space-y-4" noValidate>
            <div>
              <label htmlFor="acc-name" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full name
              </label>
              <input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className={field} />
            </div>
            <div>
              <label htmlFor="acc-phone" className="block text-xs font-semibold text-slate-600 mb-1.5">
                WhatsApp number
              </label>
              <input
                id="acc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="98765 43210"
                className={field}
              />
              <p className="text-[11px] mt-1">
                {user.phone && user.phone_verified ? (
                  <span className="font-semibold text-emerald-700">✓ Verified by IvStay</span>
                ) : user.phone ? (
                  <span className="text-slate-500">Not verified yet. We confirm it on our first WhatsApp chat.</span>
                ) : (
                  <span className="text-slate-400">{PHONE_HINT}</span>
                )}
              </p>
            </div>
            <div>
              <label htmlFor="acc-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input id="acc-email" value={user.email} readOnly className={`${field} bg-slate-50 text-slate-500`} />
            </div>
            {profileError && (
              <p role="alert" className="text-xs font-semibold text-rose-600">
                {profileError}
              </p>
            )}
            <Button type="submit" variant="primary" isLoading={saving} className="w-full">
              Save details
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};
