import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidPhone, PHONE_ERROR, PHONE_REQUIRED } from '../lib/phone';
import { PhoneInput } from '../components/ui/PhoneInput';
import { CANCELLATION_RULES } from './legal/CancellationPage';
import { useProperties } from '../context/PropertyContext';
import { useBookings } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { ImageGalleryLightbox } from '../components/public/ImageGalleryLightbox';
import { ReviewSection } from '../components/public/ReviewSection';
import { MOCK_REVIEWS } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { whatsappLink } from '../config/contact';
import { formatINR } from '../utils/currency';
import { stayPath } from '../lib/links';
import { useStayQuote } from '../hooks/useStayQuote';
import {
  MapPin,
  Star,
  Share2,
  Heart,
  Users,
  Bed,
  Bath,
  Sparkles,
  ShieldCheck,
  Calendar as CalendarIcon,
  ChefHat,
  Wifi,
  Tv,
  CheckCircle,
  MessageSquare,
  ChevronDown,
  Info,
} from 'lucide-react';
import { format, differenceInCalendarDays, addDays, parseISO } from 'date-fns';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getPropertyById, isWishlisted, toggleWishlist, loading } = useProperties();
  const { requestBooking } = useBookings();
  const { showSuccess, showInfo, showError } = useToast();
  const { user } = useAuth();
  const location = useLocation();

  const property = getPropertyById(id || '');

  // Pre-fill dates/guests from the search (?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=N), else defaults.
  const today = format(new Date(), 'yyyy-MM-dd');
  const minNights = Math.max(1, property?.min_nights || 1);
  const isIsoDate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const urlCheckIn = searchParams.get('checkIn');
  const urlCheckOut = searchParams.get('checkOut');
  const initialCheckIn =
    isIsoDate(urlCheckIn) && urlCheckIn >= today ? urlCheckIn : format(addDays(new Date(), 2), 'yyyy-MM-dd');
  const initialCheckOut =
    isIsoDate(urlCheckOut) && urlCheckOut > initialCheckIn
      ? urlCheckOut
      : format(addDays(parseISO(initialCheckIn), Math.max(2, minNights)), 'yyyy-MM-dd');

  const [checkIn, setCheckIn] = useState<string>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<string>(initialCheckOut);
  const [adults, setAdults] = useState(() => Math.max(1, parseInt(searchParams.get('guests') || '', 10) || 2));
  const [children, setChildren] = useState(0);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Signed-in customers: fill in what we already know (they can still change it)
  useEffect(() => {
    if (!user) return;
    setGuestName((current) => current || user.full_name);
    setGuestPhone((current) => current || user.phone || '');
    setGuestEmail((current) => current || user.email);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const [formError, setFormError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const { quote, isEstimate, unavailable } = useStayQuote(property, checkIn, checkOut, adults, children);

  if (!property) {
    if (loading) {
      return <div className="max-w-7xl mx-auto px-4 py-24 text-center text-xs text-slate-500">Loading the stay…</div>;
    }
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="font-serif text-3xl font-bold text-brand-slate">Property Not Found</h2>
        <p className="text-xs text-slate-500">The stay you are looking for does not exist or has been archived.</p>
        <Button onClick={() => navigate('/stays')} variant="gold">
          Browse All Stays
        </Button>
      </div>
    );
  }

  const favorited = isWishlisted(property.id);

  const totalGuests = adults + children;
  const nights = quote?.nights ?? 0;
  const propertyReviews = MOCK_REVIEWS.filter((r) => r.property_id === property.id);
  const hasRating = property.review_count > 0;
  // Native date pickers can't grey out dates, so list what's taken
  const takenSoon = unavailable.filter((r) => r.ends_on > today).slice(0, 4);
  const shortDate = (iso: string) => format(parseISO(iso), 'd MMM');

  const handleWishlistToggle = () => {
    toggleWishlist(property.id);
    if (!favorited) {
      showSuccess('Saved to Wishlist', `${property.title} added to your favorites`);
    } else {
      showInfo('Removed from Wishlist', `${property.title} removed from favorites`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess('Link Copied!', 'Listing link copied to clipboard');
  };

  const handleCheckInChange = (value: string) => {
    setCheckIn(value);
    // Keep check-out after check-in (and at least the minimum stay)
    if (value && checkOut <= value) {
      setCheckOut(format(addDays(parseISO(value), minNights), 'yyyy-MM-dd'));
    }
  };

  const handleReserveClick = async () => {
    setFormError(null);
    if (guestName.trim().length < 2) {
      setFormError('Add your name so we know who is booking.');
      return;
    }
    if (!isValidPhone(guestPhone)) {
      setFormError(guestPhone ? PHONE_ERROR : PHONE_REQUIRED);
      return;
    }
    // Open the tab now, while the click still counts as the user's action (popup blockers),
    // and send it to WhatsApp once the request is saved.
    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;
    setReserving(true);
    let reference = '';
    try {
      ({ reference } = await requestBooking(
        {
          propertyId: property.id,
          checkIn,
          checkOut,
          guestName: guestName.trim(),
          guestPhone: guestPhone.trim(),
          guestEmail: guestEmail.trim() || undefined,
          adults,
          children,
        },
        property
      ));
      showSuccess(
        'Request sent',
        `Reference ${reference}. We'll confirm on WhatsApp${guestEmail.trim() ? ' and email you a copy' : ''}.` +
          (user ? ' It is also in My account.' : '')
      );
    } catch (error) {
      const code = (error as { code?: string }).code;
      const message = error instanceof Error ? error.message : String(error);
      if (code === '22023') {
        // Something to fix in the form: don't open WhatsApp
        popup?.close();
        setFormError(message);
        setReserving(false);
        return;
      }
      showError("Couldn't save your request", `${message} You can still send it on WhatsApp.`);
    }
    setReserving(false);

    const message = [
      `Hi IvStay, I'd like to book ${property.title} (${property.city}).`,
      reference ? `Reference: ${reference}` : null,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut} (${nights} night${nights === 1 ? '' : 's'})`,
      `Guests: ${totalGuests}`,
      quote && quote.total > 0 ? `Estimated total: ${formatINR(quote.total)}` : null,
      `Name: ${guestName.trim()}`,
      `Link: ${window.location.origin}${stayPath(property)}`,
    ]
      .filter(Boolean)
      .join('\n');
    const url = whatsappLink(message);
    if (popup) popup.location.href = url;
    else window.location.href = url;
  };

  const handleContactClick = () => {
    window.open(
      whatsappLink(`Hi IvStay, I have a question about ${property.title} (${property.city}).`),
      '_blank',
      'noopener'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {property.is_verified && <Badge variant="verified" />}
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {property.category === 'bnbs_and_villas'
                  ? property.property_type === 'bnb'
                    ? 'Luxury Bed & Breakfast'
                    : 'Private Luxury Villa'
                  : property.category === 'hotels'
                  ? 'Boutique Hotel'
                  : 'Home Stay'}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-brand-slate">
              {property.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">{property.tagline}</p>
          </div>

          {/* Share & Wishlist actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share</span>
            </button>
            <button
              onClick={handleWishlistToggle}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
                }`}
              />
              <span>{favorited ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Location & Rating pin bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
          <div className="flex items-center gap-1 font-bold text-brand-slate">
            <Star className="w-4 h-4 fill-brand-gold text-brand-gold" />
            {hasRating ? (
              <>
                <span>{property.rating.toFixed(2)}</span>
                <span className="text-slate-400 font-normal">({property.review_count} reviews)</span>
              </>
            ) : (
              <span>New listing</span>
            )}
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-brand-gold" />
            <span>{property.address}, {property.city}, {property.state}</span>
          </div>
        </div>
      </div>

      {/* 5-Photo Mosaic Gallery & Lightbox */}
      <ImageGalleryLightbox images={property.images} title={property.title} />

      {/* Main Content Layout: Overview vs Sticky Reservation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Overview Column */}
        <div className="lg:col-span-7 space-y-10">
          {/* Overview Specs Bar */}
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Users className="w-4 h-4 text-brand-gold" />
              <span>{property.max_guests} Guests</span>
            </div>
            {property.bedrooms != null && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Bed className="w-4 h-4 text-brand-gold" />
                <span>
                  {property.bedrooms} Bedroom{property.bedrooms === 1 ? '' : 's'}
                  {property.beds != null ? ` (${property.beds} beds)` : ''}
                </span>
              </div>
            )}
            {property.bathrooms != null && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Bath className="w-4 h-4 text-brand-gold" />
                <span>{property.bathrooms} Bathroom{property.bathrooms === 1 ? '' : 's'}</span>
              </div>
            )}
          </div>

          {/* Highlights: only claims that apply to every verified listing */}
          {property.is_verified && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <h3 className="font-serif text-xl font-bold text-brand-slate">Stay Highlights</h3>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-brand-slate">IvStay Verified Standard</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Reviewed by the IvStay team before it goes live on the site.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Description */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h3 className="font-serif text-xl font-bold text-brand-slate">About This Stay</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Categorized Amenities Grid */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-serif text-xl font-bold text-brand-slate">Available Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {property.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-semibold text-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                  <span className="truncate">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Host / contact card */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {property.host_avatar ? (
                  <img
                    src={property.host_avatar}
                    alt={property.host_name || 'Host'}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-gold"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-gold text-white flex items-center justify-center font-serif font-bold text-xl shrink-0">
                    Iv
                  </div>
                )}
                <div>
                  <h4 className="font-serif text-lg font-bold flex items-center gap-1.5">
                    {property.host_name ? `Hosted by ${property.host_name}` : 'Questions about this stay?'}
                    {property.host_name && <CheckCircle className="w-4 h-4 text-brand-gold fill-brand-gold/20" />}
                  </h4>
                  <p className="text-xs text-amber-300 font-semibold">
                    {property.host_joined || 'The IvStay team replies on WhatsApp.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={handleContactClick}
                variant="gold"
                size="sm"
                className="flex items-center gap-1.5 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask on WhatsApp
              </Button>
            </div>
          </div>

          {/* Reviews: only shown once real reviews exist for this stay */}
          {propertyReviews.length > 0 && (
            <ReviewSection
              rating={property.rating}
              reviewCount={property.review_count}
              reviews={propertyReviews}
            />
          )}
        </div>

        {/* Right Dynamic Sticky Reservation Card */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-6">
            {/* Price Header */}
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-serif text-3xl font-extrabold text-brand-slate">
                  {formatINR(property.price_per_night)}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / night</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-slate">
                <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                <span>{hasRating ? property.rating.toFixed(2) : 'New'}</span>
              </div>
            </div>

            {/* Date Range Picker Container */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200">
              <div className="grid grid-cols-2 bg-slate-50">
                <div className="p-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Check-In
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    min={today}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full text-xs font-semibold text-brand-slate bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  />
                </div>
                <div className="p-3 border-l border-slate-200">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Check-Out
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn ? format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd') : today}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-semibold text-brand-slate bg-transparent focus:outline-none cursor-pointer mt-0.5"
                  />
                </div>
              </div>

              {/* Guest Selector Button */}
              <div className="relative p-3 bg-white">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Guests
                </label>
                <button
                  type="button"
                  onClick={() => setIsGuestPickerOpen(!isGuestPickerOpen)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-brand-slate mt-0.5"
                >
                  <span>
                    {totalGuests} Guest{totalGuests > 1 ? 's' : ''}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isGuestPickerOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-30 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold">Adults</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAdults(Math.max(1, adults - 1))}
                          className="w-6 h-6 rounded-full border flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-bold">{adults}</span>
                        <button
                          type="button"
                          onClick={() => setAdults(adults + 1)}
                          className="w-6 h-6 rounded-full border flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold">Children</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setChildren(Math.max(0, children - 1))}
                          className="w-6 h-6 rounded-full border flex items-center justify-center"
                          aria-label="Fewer children"
                        >
                          -
                        </button>
                        <span className="font-bold">{children}</span>
                        <button
                          type="button"
                          onClick={() => setChildren(children + 1)}
                          className="w-6 h-6 rounded-full border flex items-center justify-center"
                          aria-label="More children"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Price includes {property.base_guests} guest{property.base_guests === 1 ? '' : 's'}; sleeps up to {property.max_guests}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {takenSoon.length > 0 && (
              <p className="text-[11px] text-slate-500">
                Already taken: {takenSoon.map((r) => `${shortDate(r.starts_on)} – ${shortDate(r.ends_on)}`).join(', ')}
              </p>
            )}

            {/* Price breakdown (from the server's quote) */}
            {quote && quote.nights > 0 && (
              <div className="space-y-2.5 text-xs text-slate-600 pt-2" aria-live="polite">
                <div className="flex justify-between">
                  <span>
                    {nights} night{nights === 1 ? '' : 's'}
                    {quote.weekend_nights > 0 && property.weekend_surge_price
                      ? ` (incl. ${quote.weekend_nights} Fri/Sat at ${formatINR(property.weekend_surge_price)})`
                      : ` × ${formatINR(property.price_per_night)}`}
                  </span>
                  <span className="font-semibold">{formatINR(quote.nightly_total)}</span>
                </div>
                {quote.extra_guest_total > 0 && (
                  <div className="flex justify-between">
                    <span>
                      {quote.extra_guests} extra guest{quote.extra_guests === 1 ? '' : 's'} × {formatINR(property.extra_guest_fee)} × {nights} night{nights === 1 ? '' : 's'}
                    </span>
                    <span className="font-semibold">{formatINR(quote.extra_guest_total)}</span>
                  </div>
                )}
                {quote.cleaning_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Cleaning fee</span>
                    <span className="font-semibold">{formatINR(quote.cleaning_fee)}</span>
                  </div>
                )}
                {quote.service_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Service fee ({property.service_fee_pct}%)</span>
                    <span className="font-semibold">{formatINR(quote.service_fee)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-brand-slate">
                  <span>{isEstimate ? 'Estimated total' : 'Total'}</span>
                  <span className="font-serif text-xl text-brand-gold">{formatINR(quote.total)}</span>
                </div>
              </div>
            )}
            {quote && quote.problems.length > 0 && (
              <ul className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 space-y-0.5">
                {quote.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            )}

            {/* Contact details for the request */}
            <div className="space-y-2">
              {!user && (
                <p className="text-[11px] text-slate-500">
                  <Link
                    to={`/signin?next=${encodeURIComponent(location.pathname + location.search)}`}
                    className="font-semibold text-brand-slate underline underline-offset-2"
                  >
                    Sign in
                  </Link>{' '}
                  to fill these in and track your request, or just continue below.
                </p>
              )}
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
                aria-label="Your name"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
              />
              <PhoneInput value={guestPhone} onChange={setGuestPhone} size="sm" required />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email (optional, for a confirmation)"
                autoComplete="email"
                aria-label="Email"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-slate"
              />
              {formError && (
                <p role="alert" className="text-[11px] font-semibold text-rose-600">
                  {formError}
                </p>
              )}
            </div>

            <Button
              onClick={() => void handleReserveClick()}
              variant="gold"
              isLoading={reserving}
              className="w-full py-4 text-sm font-bold shadow-gold-glow"
            >
              Request to book on WhatsApp
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <Info className="w-3.5 h-3.5 text-brand-gold" />
              <span>Nothing is charged now. We confirm availability on WhatsApp first.</span>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              <span className="font-semibold text-brand-slate">{property.cancellation_policy} cancellation:</span>{' '}
              {CANCELLATION_RULES[property.cancellation_policy]?.summary}{' '}
              <Link to="/cancellation-policy" className="underline underline-offset-2 hover:text-brand-slate">
                Details
              </Link>
              . By sending a request you agree to our{' '}
              <Link to="/terms" className="underline underline-offset-2 hover:text-brand-slate">
                Terms
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
