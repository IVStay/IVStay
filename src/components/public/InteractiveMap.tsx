import React, { useState } from 'react';
import { Property } from '../../types';
import { MapPin, Star, Sparkles, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InteractiveMapProps {
  properties: Property[];
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ properties }) => {
  const [selectedProp, setSelectedProp] = useState<Property | null>(properties[0] || null);

  return (
    <div className="relative w-full h-[650px] bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between p-6">
      {/* Map Simulated Dark Luxury Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-40 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950" />

      {/* Map Overlay Header */}
      <div className="relative z-10 flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-brand-gold animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Interactive Luxury Map Explorer
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Showing {properties.length} Verified Pins
        </span>
      </div>

      {/* Simulated Interactive Pin Canvas */}
      <div className="relative z-10 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center justify-center p-4">
        {properties.map((prop, idx) => {
          const isSelected = selectedProp?.id === prop.id;
          return (
            <div
              key={prop.id}
              onClick={() => setSelectedProp(prop)}
              className={`cursor-pointer transition-all duration-300 transform hover:scale-110 flex flex-col items-center justify-center ${
                isSelected ? 'z-30 scale-110' : 'z-10 opacity-90'
              }`}
            >
              {/* Floating Price Tag Marker */}
              <div
                className={`px-3 py-1.5 rounded-full shadow-2xl font-bold text-xs flex items-center gap-1 border transition-all ${
                  isSelected
                    ? 'bg-brand-gold text-white border-amber-300 scale-110 ring-4 ring-amber-500/30'
                    : 'bg-slate-900 text-white border-slate-700 hover:bg-brand-slate'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <span>${prop.price_per_night}</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-black/60 px-2 py-0.5 rounded-full mt-1 backdrop-blur-sm truncate max-w-[120px]">
                {prop.city}
              </span>
            </div>
          );
        })}
      </div>

      {/* Selected Property Preview Drawer Bottom */}
      {selectedProp && (
        <div className="relative z-20 bg-slate-900/95 backdrop-blur-xl p-4 rounded-2xl border border-slate-800 text-white flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-4">
            <img
              src={selectedProp.images[0]}
              alt={selectedProp.title}
              className="w-20 h-20 rounded-xl object-cover ring-2 ring-brand-gold/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider">
                  {selectedProp.city}, {selectedProp.state}
                </span>
                {selectedProp.is_verified && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                    Verified
                  </span>
                )}
              </div>
              <h4 className="font-serif text-base font-bold text-white line-clamp-1">
                {selectedProp.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <div className="flex items-center gap-1 font-bold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{selectedProp.rating.toFixed(2)}</span>
                </div>
                <span>•</span>
                <span>{selectedProp.bedrooms} Bedrooms</span>
                <span>•</span>
                <span className="text-white font-bold">${selectedProp.price_per_night}/night</span>
              </div>
            </div>
          </div>

          <Link
            to={`/stays/${selectedProp.id}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-brand-gold text-white font-bold text-xs hover:bg-brand-goldHover transition-all text-center shadow-gold-glow shrink-0"
          >
            View Full Listing
          </Link>
        </div>
      )}
    </div>
  );
};
