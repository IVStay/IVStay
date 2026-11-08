import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ChevronLeft, ChevronRight, MapPin, Users, Bed, Bath } from 'lucide-react';
import { Property } from '../../types';
import { Badge } from '../ui/Badge';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const { isWishlisted, toggleWishlist } = useProperties();
  const { showSuccess, showInfo } = useToast();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const favorited = isWishlisted(property.id);

  const handlePrevImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === 0 ? property.images.length - 1 : prev - 1));
  };

  const handleNextImg = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImgIndex((prev) => (prev === property.images.length - 1 ? 0 : prev + 1));
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(property.id);
    if (!favorited) {
      showSuccess('Added to Wishlist', `${property.title} saved to your favorites`);
    } else {
      showInfo('Removed from Wishlist', `${property.title} removed from saved stays`);
    }
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col">
      {/* Image Carousel Container */}
      <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-slate-100">
        <Link to={`/stays/${property.id}`} className="block w-full h-full">
          <img
            src={property.images[currentImgIndex] || property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        </Link>

        {/* Top Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {property.is_verified && <Badge variant="verified" />}
          {property.is_featured && <Badge variant="featured" />}
        </div>

        {/* Top Right Favorite Heart Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white transition-all shadow-md z-10 group/btn"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorited ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-700 group-hover/btn:text-rose-500'
            }`}
          />
        </button>

        {/* Carousel Arrow Controls */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={handlePrevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {property.images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === currentImgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Details Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Category tag */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {property.category === 'bnbs_and_villas'
                ? property.property_type === 'bnb'
                  ? 'Luxury Bed & Breakfast'
                  : 'Private Villa'
                : property.category === 'hotels'
                ? 'Boutique Hotel'
                : 'Home Stay'}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-brand-slate">
              <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
              <span>{property.rating.toFixed(2)}</span>
              <span className="text-slate-400 font-normal">({property.review_count})</span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/stays/${property.id}`} className="block group-hover:text-brand-gold transition-colors">
            <h3 className="font-serif text-lg font-bold text-brand-slate line-clamp-1">
              {property.title}
            </h3>
          </Link>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.city}, {property.state}</span>
          </div>

          {/* Specs icons bar */}
          <div className="flex items-center gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1" title="Max Guests">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.max_guests} Guests</span>
            </div>
            <div className="flex items-center gap-1" title="Bedrooms">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1" title="Bathrooms">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
          </div>
        </div>

        {/* Footer Price & Action */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
          <div>
            <span className="font-serif text-xl font-extrabold text-brand-slate">
              ₹{property.price_per_night.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500"> / night</span>
          </div>
          <Link
            to={`/stays/${property.id}`}
            className="px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-brand-gold text-xs font-semibold transition-all shadow-sm"
          >
            Reserve
          </Link>
        </div>
      </div>
    </div>
  );
};
