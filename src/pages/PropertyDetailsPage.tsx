import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { useBookings } from '../context/BookingContext';
import { useToast } from '../context/ToastContext';
import { ImageGalleryLightbox } from '../components/public/ImageGalleryLightbox';
import { ReviewSection } from '../components/public/ReviewSection';
import { MOCK_REVIEWS } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
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
  const { getPropertyById, isWishlisted, toggleWishlist } = useProperties();
  const { setDraftBooking } = useBookings();
  const { showSuccess, showInfo } = useToast();

  const property = getPropertyById(id || '');

  const [checkIn, setCheckIn] = useState<string>(
    format(addDays(new Date(), 2), 'yyyy-MM-dd')
  );
  const [checkOut, setCheckOut] = useState<string>(
    format(addDays(new Date(), 6), 'yyyy-MM-dd')
  );
  const [adults, setAdults] = useState(2);
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
  const numNights = Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)));
  const totalGuests = adults + children;

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

  const handleReserveClick = () => {
    const whatsappText = `Hi, I want to reserve ${property.title} in ${property.city} for my upcoming stay.`;
    window.open(`https://wa.me/919999999999?text=${encodeURIComponent(whatsappText)}`, '_blank');
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
            <span>{property.rating.toFixed(2)}</span>
            <span className="text-slate-400 font-normal">({property.review_count} reviews)</span>
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

          {/* Dedicated Luxury Highlights */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-serif text-xl font-bold text-brand-slate">Stay Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                <ChefHat className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-brand-slate">In-Villa Butler & Chef Available</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Personal culinary services tailored to your taste profile.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-brand-slate">IvStay Verified Standard</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Inspected for high-speed fiber internet & acoustic privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>

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

          {/* Host Profile Card */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={
                    property.host_avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
                  }
                  alt={property.host_name}
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-brand-gold"
                />
                <div>
                  <h4 className="font-serif text-lg font-bold flex items-center gap-1.5">
                    Hosted by {property.host_name || 'Gianluca Rossi'}
                    <CheckCircle className="w-4 h-4 text-brand-gold fill-brand-gold/20" />
                  </h4>
                  <p className="text-xs text-amber-300 font-semibold">{property.host_joined}</p>
                </div>
              </div>

              <Button
                onClick={() =>
                  showSuccess('Message Sent to Host', 'Gianluca will reply within 15 minutes')
                }
                variant="gold"
                size="sm"
                className="flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Contact Host
              </Button>
            </div>
          </div>

          {/* Reviews Breakdown Section */}
          <ReviewSection
            rating={property.rating}
            reviewCount={property.review_count}
            reviews={MOCK_REVIEWS}
          />
        </div>

        {/* Right Dynamic Sticky Reservation Card */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-6">
            {/* Price Header */}
            <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-serif text-3xl font-extrabold text-brand-slate">
                  ₹{property.price_per_night.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / night</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-brand-slate">
                <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
                <span>{property.rating.toFixed(2)}</span>
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
                    onChange={(e) => setCheckIn(e.target.value)}
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
                  ${property.price_per_night} × {numNights} night{numNights > 1 ? 's' : ''}
                </span>
                <span className="font-semibold">${baseNightlyTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cleaning & Hospitality Fee</span>
                <span className="font-semibold">${cleaningFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>IvStay to pay to hotel ({property.service_fee_pct}%)</span>
                <span className="font-semibold">₹{serviceFee.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-bold text-brand-slate">
                <span>Total Due</span>
                <span className="font-serif text-xl text-brand-gold">${grandTotal.toLocaleString()}</span>
              </div>
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
