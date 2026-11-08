import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, MapPin, Sparkles, Building2, ChevronDown, Plus, Minus } from 'lucide-react';
import { useProperties } from '../../context/PropertyContext';
import { format, addDays } from 'date-fns';

export const HeroSearch: React.FC = () => {
  const navigate = useNavigate();
  const { filterState, setFilterState } = useProperties();
  const [activeCategory, setActiveCategory] = useState<'bnbs_and_villas' | 'hotels' | 'home_stays'>('bnbs_and_villas');

  const [destination, setDestination] = useState(filterState.destination || '');
  const [checkIn, setCheckIn] = useState<string>(
    filterState.checkIn || format(new Date(), 'yyyy-MM-dd')
  );
  const [checkOut, setCheckOut] = useState<string>(
    filterState.checkOut || format(addDays(new Date(), 4), 'yyyy-MM-dd')
  );
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);

  const [isGuestsOpen, setIsGuestsOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);

  const popularDestinations = [
    'Amalfi Coast, Italy',
    'Ubud, Bali',
    'Provence, France',
    'Zermatt, Switzerland',
    'Tulum, Mexico',
    'Paris, France',
    'Tokyo, Japan',
    'Cotswolds, UK',
  ];

  const totalGuests = adults + children;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilterState((prev) => ({
      ...prev,
      category: activeCategory,
      destination,
      checkIn,
      checkOut,
      guests: totalGuests,
    }));
    navigate(`/stays?category=${activeCategory}&destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="relative min-h-[620px] sm:min-h-[680px] flex items-center justify-center overflow-hidden rounded-3xl mx-4 sm:mx-8 my-4 shadow-2xl">
      {/* Background Image Hero with Luxury Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=85"
          alt="IvStay Luxury Villa"
          className="w-full h-full object-cover scale-105 animate-subtle-zoom"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-slate via-brand-slate/60 to-brand-slate/30" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-4 py-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-brand-gold text-xs font-semibold mb-6 shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Exclusive Private Stays & Boutique Havens</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md">
          Where Extraordinary <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-brand-gold to-amber-400">
            Memories Begin
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-200 leading-relaxed mb-10 font-light drop-shadow">
          Discover handpicked luxury villas, heritage boutique bed & breakfasts, and world-class hotels verified for ultimate elegance and direct booking guarantees.
        </p>

        {/* Floating Sticky Search Container */}
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-2xl border border-white/40 text-left max-w-4xl mx-auto">
          {/* Category Switcher Tabs */}
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveCategory('bnbs_and_villas')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === 'bnbs_and_villas'
                  ? 'bg-brand-slate text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span>Villas & BnBs</span>
              <span className="ml-1 text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.2 rounded-full font-semibold">
                Default
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('hotels')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === 'hotels'
                  ? 'bg-brand-slate text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Luxury Hotels</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('home_stays')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeCategory === 'home_stays'
                  ? 'bg-brand-slate text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-green-400" />
              <span>Home Stays</span>
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Destination Autocomplete Input */}
            <div className="relative md:col-span-4 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent focus-within:border-slate-300">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Destination
              </label>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                <input
                  type="text"
                  value={destination}
                  onFocus={() => setIsDestOpen(true)}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to? (e.g. Positano, Ubud)"
                  className="w-full text-xs font-semibold text-brand-slate bg-transparent focus:outline-none placeholder-slate-400"
                />
              </div>

              {/* Destination Dropdown */}
              {isDestOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Popular Destinations
                  </div>
                  {popularDestinations.map((dest) => (
                    <button
                      key={dest}
                      type="button"
                      onClick={() => {
                        setDestination(dest);
                        setIsDestOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {dest}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Check-In / Check-Out */}
            <div className="md:col-span-4 grid grid-cols-2 gap-2 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Check-In
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-slate shrink-0" />
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-xs font-semibold text-brand-slate bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Check-Out
                </label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-brand-slate shrink-0" />
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-xs font-semibold text-brand-slate bg-transparent focus:outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Guest Selector Dropdown */}
            <div className="relative md:col-span-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Guests
              </label>
              <button
                type="button"
                onClick={() => setIsGuestsOpen(!isGuestsOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold text-brand-slate mt-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-gold shrink-0" />
                  <span>
                    {totalGuests} Guest{totalGuests > 1 ? 's' : ''}
                    {pets > 0 ? `, ${pets} Pet` : ''}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Guest Popover */}
              {isGuestsOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Adults</p>
                      <p className="text-[10px] text-slate-400">Ages 13+</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(adults + 1)}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Children</p>
                      <p className="text-[10px] text-slate-400">Ages 0-12</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(children + 1)}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-xs font-bold text-brand-slate">Pets</p>
                      <p className="text-[10px] text-slate-400">Service or small pets</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPets(Math.max(0, pets - 1))}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{pets}</span>
                      <button
                        type="button"
                        onClick={() => setPets(pets + 1)}
                        className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Submit Button */}
            <div className="md:col-span-1 flex justify-end">
              <button
                type="submit"
                className="w-full md:w-14 h-12 rounded-full bg-brand-gold hover:bg-brand-goldHover text-white flex items-center justify-center shadow-gold-glow transition-transform hover:scale-105"
                aria-label="Search properties"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
