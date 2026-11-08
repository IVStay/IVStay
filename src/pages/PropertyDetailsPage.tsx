import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  const { getPropertyById, isWishlisted, toggleWishlist } = useProperties();
  const { setDraftBooking } = useBookings();
  const { showSuccess, showInfo } = useToast();

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
  const [pets, setPets] = useState(0);
  const [isGuestPickerOpen, setIsGuestPickerOpen] = useState(false);

  if (!property) {
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

  // Date calculations & itemized price breakdown
  const rawNights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));
  const numNights = Number.isFinite(rawNights) ? Math.max(1, rawNights) : 1;
  const totalGuests = adults + children;
  const propertyReviews = MOCK_REVIEWS.filter((r) => r.property_id === property.id);
  const hasRating = property.review_count > 0;

  const baseNightlyTotal = property.price_per_night * numNights;
  const cleaningFee = property.cleaning_fee;
  const serviceFee = Math.round(baseNightlyTotal * (property.service_fee_pct / 100));
  const grandTotal = baseNightlyTotal + cleaningFee + serviceFee;

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

  const handleReserveClick = () => {
    const message = [
      `Hi IvStay, I'd like to book ${property.title} (${property.city}).`,
      `Check-in: ${checkIn}`,
      `Check-out: ${checkOut} (${numNights} night${numNights > 1 ? 's' : ''})`,
      `Guests: ${totalGuests}`,
      `Estimated total: ${formatINR(grandTotal)}`,
      `Link: ${window.location.origin}/stays/${property.id}`,
    ].join('\n');
    window.open(whatsappLink(message), '_blank', 'noopener');
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
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Bed className="w-4 h-4 text-brand-gold" />
              <span>{property.bedrooms} Bedrooms ({property.beds} Beds)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Bath className="w-4 h-4 text-brand-gold" />
              <span>{property.bathrooms} Bathrooms</span>
            </div>
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
                    {pets > 0 ? `, ${pets} Pet` : ''}
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
                  </div>
                )}
              </div>
            </div>

            {/* Itemized Cost Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 pt-2">
              <div className="flex justify-between">
                <span>
                  {formatINR(property.price_per_night)} × {numNights} night{numNights > 1 ? 's' : ''}
                </span>
                <span className="font-semibold">{formatINR(baseNightlyTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cleaning & Hospitality Fee</span>
                <span className="font-semibold">{formatINR(cleaningFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service fee ({property.service_fee_pct}%)</span>
                <span className="font-semibold">{formatINR(serviceFee)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-brand-slate">
                <span>Estimated Total</span>
                <span className="font-serif text-xl text-brand-gold">{formatINR(grandTotal)}</span>
              </div>
              {numNights < minNights && (
                <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  This stay has a minimum of {minNights} nights.
                </p>
              )}
            </div>

            {/* Instant Reserve CTA */}
            <Button onClick={handleReserveClick} variant="gold" className="w-full py-4 text-sm font-bold shadow-gold-glow">
              Reserve via WhatsApp
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <Info className="w-3.5 h-3.5 text-brand-gold" />
              <span>You will not be charged until final review.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
