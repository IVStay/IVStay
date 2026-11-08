import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { useBookings } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import {
  CreditCard,
  Building,
  QrCode,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Lock,
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

const checkoutSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address required'),
  phone: z.string().min(8, 'Phone number is required'),
  specialRequests: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const CheckoutPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { getPropertyById } = useProperties();
  const { draftBooking, createBooking } = useBookings();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [paymentTab, setPaymentTab] = useState<'card' | 'netbanking' | 'upi'>('card');
  const [isConfirmedModalOpen, setIsConfirmedModalOpen] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const property = getPropertyById(bookingId || '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.full_name || 'Elena Rostova',
      email: user?.email || 'guest@ivstay.com',
      phone: user?.phone || '+1 (555) 987-6543',
    },
  });

  if (!property) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h2 className="font-serif text-2xl font-bold">Invalid Checkout Session</h2>
        <Button onClick={() => navigate('/stays')} className="mt-4">
          Return to Stays
        </Button>
      </div>
    );
  }

  const checkIn = draftBooking?.checkIn || '2026-10-20';
  const checkOut = draftBooking?.checkOut || '2026-10-24';
  const adults = draftBooking?.adults || 2;
  const children = draftBooking?.children || 0;
  const numNights = Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));

  const baseNightlyTotal = property.price_per_night * numNights;
  const cleaningFee = property.cleaning_fee;
  const serviceFee = Math.round(baseNightlyTotal * (property.service_fee_pct / 100));
  const grandTotal = baseNightlyTotal + cleaningFee + serviceFee;

  const onConfirmCheckout = (data: CheckoutFormData) => {
    setIsProcessing(true);

    setTimeout(() => {
      const newBooking = createBooking({
        property_id: property.id,
        user_id: user?.id || 'user_guest_1',
        check_in: checkIn,
        check_out: checkOut,
        total_guests: adults + children,
        adults,
        children,
        pets: draftBooking?.pets || 0,
        nightly_price: property.price_per_night,
        total_nights: numNights,
        cleaning_fee: cleaningFee,
        service_fee: serviceFee,
        total_price: grandTotal,
        guest_name: data.fullName,
        guest_email: data.email,
        guest_phone: data.phone,
        special_requests: data.specialRequests,
        payment_status: 'paid',
        payment_method: paymentTab,
        transaction_id: 'TXN-' + Math.floor(1000000000 + Math.random() * 9000000000),
        property_title: property.title,
        property_image: property.images[0],
        property_city: `${property.city}, ${property.state}`,
      });

      setIsProcessing(false);
      setCreatedBookingId(newBooking.id);
      setIsConfirmedModalOpen(true);
      showSuccess('Booking Confirmed!', `Reservation ${newBooking.id} has been created`);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-brand-slate">Confirm & Pay</h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete your luxury reservation with encrypted instant authorization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Guest Form & Payment Tabs */}
        <div className="lg:col-span-7 space-y-8">
          {/* Guest Details Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-serif text-xl font-bold text-brand-slate flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-gold" />
              Primary Guest Contact Information
            </h3>

            <form id="checkout-form" onSubmit={handleSubmit(onConfirmCheckout)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name</label>
                  <input
                    {...register('fullName')}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                  />
                  {errors.fullName && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    {...register('phone')}
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-rose-500 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  {...register('email')}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                />
                {errors.email && (
                  <p className="text-[10px] text-rose-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Special Arrival Requests & Dietary Preferences (Optional)
                </label>
                <textarea
                  {...register('specialRequests')}
                  rows={3}
                  placeholder="e.g. Helicopter pickup from airport, private chef wine preference, early check-in"
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
                />
              </div>
            </form>
          </div>

          {/* Payment Gateway Tabs */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-serif text-xl font-bold text-brand-slate flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              Select Payment Method
            </h3>

            {/* Payment Method Switcher Tabs */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentTab('card')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
                  paymentTab === 'card'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1.5 text-brand-gold" />
                <span>Credit / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('netbanking')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
                  paymentTab === 'netbanking'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building className="w-5 h-5 mb-1.5 text-brand-gold" />
                <span>Net Banking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTab('upi')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-xs font-bold transition-all ${
                  paymentTab === 'upi'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1.5 text-brand-gold" />
                <span>UPI / Instant QR</span>
              </button>
            </div>

            {/* Payment Tab Content */}
            {paymentTab === 'card' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4532 •••• •••• 8892"
                    defaultValue="4532 9821 0019 8892"
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      defaultValue="12/28"
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Security Code (CVC)</label>
                    <input
                      type="password"
                      placeholder="•••"
                      defaultValue="882"
                      className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentTab === 'netbanking' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <p className="font-bold text-brand-slate">Select Bank for Direct Wire Transfer:</p>
                <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold">
                  <option>JPMorgan Chase Private Bank</option>
                  <option>Barclays Wealth Management</option>
                  <option>HSBC Premier Banking</option>
                  <option>HDFC Bank Imperial</option>
                </select>
              </div>
            )}

            {paymentTab === 'upi' && (
              <div className="p-6 bg-slate-900 text-white rounded-2xl text-center space-y-4">
                <p className="text-xs font-bold text-amber-400">Scan QR Code via any UPI App</p>
                <div className="w-36 h-36 bg-white p-3 rounded-2xl mx-auto flex items-center justify-center shadow-lg">
                  {/* Mock QR Code Graphic */}
                  <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-[10px] font-mono font-bold text-brand-gold">
                    IVSTAY-QR
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Merchant: IvStay Hospitality Escrow Inc.</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              form="checkout-form"
              variant="gold"
              isLoading={isProcessing}
              className="w-full py-4 text-sm font-bold shadow-gold-glow"
            >
              Pay ₹{grandTotal.toLocaleString()} & Confirm Booking
            </Button>
          </div>
        </div>

        {/* Right Trip Summary Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6">
          <h3 className="font-serif text-xl font-bold text-brand-slate pb-3 border-b border-slate-100">
            Trip Summary
          </h3>

          {/* Property snippet */}
          <div className="flex items-center gap-4">
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-gold/30"
            />
            <div>
              <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                {property.category === 'bnbs_and_villas' ? 'Villa / BnB' : property.category === 'hotels' ? 'Boutique Hotel' : 'Home Stay'}
              </span>
              <h4 className="font-serif text-base font-bold text-brand-slate line-clamp-1">
                {property.title}
              </h4>
              <p className="text-xs text-slate-500">{property.city}, {property.state}</p>
            </div>
          </div>

          {/* Reservation Dates & Guests */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4 text-brand-gold" />
                <span>Dates ({numNights} Nights)</span>
              </div>
              <span className="font-bold text-brand-slate">
                {checkIn} → {checkOut}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-600">
                <Users className="w-4 h-4 text-brand-gold" />
                <span>Guests</span>
              </div>
              <span className="font-bold text-brand-slate">{adults + children} Guests</span>
            </div>
          </div>

          {/* Itemized Price Breakdown */}
          <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
            <div className="flex justify-between">
              <span>₹{property.price_per_night} × {numNights} nights</span>
              <span className="font-semibold">₹{baseNightlyTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Cleaning Fee</span>
              <span className="font-semibold">₹{cleaningFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>IvStay to pay to hotel ({property.service_fee_pct}%)</span>
              <span className="font-semibold">₹{serviceFee.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-brand-slate">
              <span>Total Price</span>
              <span className="font-serif text-xl text-brand-gold">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="p-4 bg-slate-50 rounded-2xl text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-brand-slate">Cancellation Policy: {property.cancellation_policy || 'Flexible'}</p>
            <p>Free cancellation up to 48 hours prior to check-in for full refund.</p>
          </div>
        </div>
      </div>

      {/* Instant Confirmation Modal */}
      <Modal
        isOpen={isConfirmedModalOpen}
        onClose={() => navigate('/account')}
        title="Booking Confirmed!"
        subtitle="Your stay reservation is active and verified."
        maxWidth="lg"
      >
        <div className="space-y-6 text-center py-2">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-brand-gold uppercase tracking-widest">
              Reservation Ref: {createdBookingId}
            </span>
            <h3 className="font-serif text-2xl font-bold text-brand-slate mt-1">
              {property.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Check-in: {checkIn} • Total Paid: ₹{grandTotal.toLocaleString()}
            </p>
          </div>

          {/* Downloadable PDF Receipt Mock */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center font-bold text-brand-slate pb-2 border-b border-slate-200">
              <span>IvStay Official E-Receipt</span>
              <Sparkles className="w-4 h-4 text-brand-gold" />
            </div>
            <p>Guest: {user?.full_name || 'Elena Rostova'}</p>
            <p>Payment Method: {paymentTab.toUpperCase()} (TXN Verified)</p>
            <p>24/7 Concierge Access Code: <code className="font-mono text-brand-gold font-bold">VIP-IV-9920</code></p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => {
                showSuccess('PDF Receipt Downloaded', 'Saved to downloads folder');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download Receipt PDF
            </Button>
            <Button onClick={() => window.print()} variant="secondary" size="sm" className="flex items-center gap-1.5">
              <Printer className="w-4 h-4" />
              Print Voucher
            </Button>
            <Button onClick={() => navigate('/account')} variant="gold" size="sm">
              Go to My Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
