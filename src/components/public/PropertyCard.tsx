import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatINR } from '../../utils/currency';
import { stayPath } from '../../lib/links';
import { Property } from '../../types';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';

const KIND: Record<string, string> = {
  villa: 'Villa',
  bnb: 'BnB',
  hotel: 'Hotel',
  resort: 'Resort',
  home_stay: 'Home stay',
};

/** A stay in a grid: photo with heart and swipe arrows, then place, name, details and price. */
export const PropertyCard: React.FC<{ property: Property }> = ({ property }) => {
  const { isWishlisted, toggleWishlist } = useProperties();
  const { showSuccess, showInfo } = useToast();
  const [index, setIndex] = useState(0);
  // Carry the current search (dates/guests) through to the stay page
  const { search } = useLocation();
  const href = `${stayPath(property)}${search}`;
  const photos = property.images.length ? property.images : [''];
  const saved = isWishlisted(property.id);

  const step = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + delta + photos.length) % photos.length);
  };

  const toggleSaved = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(property.id);
    if (saved) showInfo('Removed from saved', property.title);
    else showSuccess('Saved', `${property.title} is in your saved stays`);
  };

  const details = [
    KIND[property.property_type] ?? 'Stay',
    property.bedrooms != null ? `${property.bedrooms} bedroom${property.bedrooms === 1 ? '' : 's'}` : null,
    `${property.max_guests} guests`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link to={href} className="group block">
      <div className="relative aspect-[20/19] overflow-hidden rounded-2xl bg-surface-muted">
        {photos[index] && (
          <img
            src={photos[index]}
            alt={property.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}

        {property.is_featured && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white text-[13px] font-semibold text-ink shadow-sm">
            IvStay pick
          </span>
        )}

        <button
          type="button"
          onClick={toggleSaved}
          aria-label={saved ? 'Remove from saved stays' : 'Save this stay'}
          aria-pressed={saved}
          className="absolute top-3 right-3 p-1 transition-transform active:scale-90"
        >
          <Heart
            className={`w-6 h-6 drop-shadow ${saved ? 'fill-ivy text-white' : 'fill-black/40 text-white'}`}
            strokeWidth={2}
          />
        </button>

        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => step(e, -1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-ink" />
            </button>
            <button
              type="button"
              onClick={(e) => step(e, 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-ink" />
            </button>
            <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1">
              {photos.slice(0, 5).map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index % 5 ? 'bg-white' : 'bg-white/55'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="pt-3 text-[15px] leading-snug">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-ink truncate">
            {property.city}
            {property.state ? `, ${property.state}` : ''}
          </p>
          <p className="flex items-center gap-1 text-ink shrink-0">
            <Star className="w-3.5 h-3.5 fill-ink text-ink" />
            {property.review_count > 0 ? property.rating.toFixed(2) : 'New'}
          </p>
        </div>
        <p className="text-ink-muted truncate">{property.title}</p>
        <p className="text-ink-muted truncate">{details}</p>
        <p className="mt-1.5 text-ink">
          <span className="font-semibold">{formatINR(property.price_per_night)}</span>
          <span className="text-ink-muted"> night</span>
        </p>
      </div>
    </Link>
  );
};
