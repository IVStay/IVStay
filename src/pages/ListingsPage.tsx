import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import { InteractiveMap } from '../components/public/InteractiveMap';
import { CategoryFilterBar } from '../components/public/CategoryFilterBar';
import { LayoutGrid, Map, SlidersHorizontal, Sparkles, Building2, RotateCcw, Check, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatINR } from '../utils/currency';

interface ListingsPageProps {
  defaultCategory?: 'all' | 'bnbs_and_villas' | 'hotels' | 'home_stays';
}

export const ListingsPage: React.FC<ListingsPageProps> = ({ defaultCategory = 'all' }) => {
  const { properties, filterState, setFilterState, resetFilters } = useProperties();
  const [searchParams] = useSearchParams();

  const categoryParam = searchParams.get('category');
  const urlCategory = (['all', 'bnbs_and_villas', 'hotels', 'home_stays'] as const).find((c) => c === categoryParam) ?? null;
  const urlDestination = searchParams.get('destination');
  const urlGuests = searchParams.get('guests');

  // Apply URL search parameters (e.g. from the home page search box) to the shared filters,
  // so the on-page controls can still change them afterwards.
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      destination: urlDestination ?? prev.destination,
      guests: urlGuests !== null ? Math.max(1, parseInt(urlGuests, 10) || 1) : prev.guests,
      category: urlCategory ?? prev.category,
    }));
  }, [urlDestination, urlGuests, urlCategory, setFilterState]);

  // The price slider's top end follows the most expensive stay; the top position means "no limit".
  const highestPrice = properties.reduce((max, p) => Math.max(max, p.price_per_night || 0), 0);
  const priceCeiling = Math.max(10000, Math.ceil(highestPrice / 5000) * 5000);
  const sliderValue = Math.min(filterState.priceRange[1], priceCeiling);
  const maxPrice = sliderValue >= priceCeiling ? Infinity : sliderValue;

  const [viewMode, setViewMode] = useState<'grid' | 'split'>('grid');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Filter properties logic
  const filteredProperties = properties.filter((p) => {
    // Category filter
    const activeCat = defaultCategory !== 'all' ? defaultCategory : filterState.category;
    if (activeCat !== 'all' && p.category !== activeCat) {
      return false;
    }

    // Destination filter
    const activeDest = filterState.destination.trim();
    if (activeDest) {
      const match =
        p.city.toLowerCase().includes(activeDest.toLowerCase()) ||
        p.state.toLowerCase().includes(activeDest.toLowerCase()) ||
        p.title.toLowerCase().includes(activeDest.toLowerCase());
      if (!match) return false;
    }

    // Guests
    if (filterState.guests > 1 && p.max_guests < filterState.guests) return false;

    // Price range
    if (p.price_per_night < filterState.priceRange[0] || p.price_per_night > maxPrice) {
      return false;
    }

    // Bedrooms / Bathrooms
    if (filterState.bedrooms > 0 && (p.bedrooms ?? 0) < filterState.bedrooms) return false;
    if (filterState.bathrooms > 0 && (p.bathrooms ?? 0) < filterState.bathrooms) return false;

    // Amenities
    if (filterState.amenities.length > 0) {
      const hasAll = filterState.amenities.every((am) =>
        p.amenities.some((pa) => pa.toLowerCase().includes(am.toLowerCase()))
      );
      if (!hasAll) return false;
    }

    return p.status === 'active';
  });

  const availableAmenities = [
    'Private Infinity Pool',
    'Private Chef',
    'Sea View',
    'High-Speed Wi-Fi',
    'Jacuzzi',
    'Wine Cellar',
    'Air Conditioning',
    'Beachfront',
    'Ski-in / Ski-out',
    'Helipad Access',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header & Switches */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-brand-slate">
            {defaultCategory === 'hotels' ? 'Luxury Boutique Hotels' : defaultCategory === 'home_stays' ? 'Home Stays' : defaultCategory === 'bnbs_and_villas' ? 'Villas & Boutique BnBs' : 'All Luxury Stays'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Showing {filteredProperties.length} stay{filteredProperties.length === 1 ? '' : 's'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Switcher Bar (Hidden if we are on a specific category route unless it's /stays which is 'all') */}
          {defaultCategory === 'all' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                onClick={() =>
                  setFilterState((prev) => ({ ...prev, category: 'all' }))
                }
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterState.category === 'all'
                    ? 'bg-white text-brand-slate shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() =>
                  setFilterState((prev) => ({ ...prev, category: 'bnbs_and_villas' }))
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterState.category === 'bnbs_and_villas'
                    ? 'bg-white text-brand-slate shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-brand-gold" />
                Villas & BnBs
              </button>
              <button
                onClick={() =>
                  setFilterState((prev) => ({ ...prev, category: 'hotels' }))
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterState.category === 'hotels'
                    ? 'bg-white text-brand-slate shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 text-indigo-500" />
                Hotels
              </button>
              <button
                onClick={() =>
                  setFilterState((prev) => ({ ...prev, category: 'home_stays' }))
                }
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filterState.category === 'home_stays'
                    ? 'bg-white text-brand-slate shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3 h-3 text-green-500" />
                Home Stays
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search destination or property..."
              value={filterState.destination}
              onChange={(e) => setFilterState((prev) => ({ ...prev, destination: e.target.value }))}
              className="pl-9 pr-4 py-2 rounded-full border border-slate-200 text-xs font-semibold focus:outline-none focus:border-brand-slate bg-white w-48 sm:w-64 transition-all"
            />
          </div>

          {/* Filter Drawer Toggle */}
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-colors ${
              isFilterDrawerOpen
                ? 'bg-brand-slate text-white border-brand-slate'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
            <span>Filters</span>
          </button>

          {/* Grid vs Map Dual Layout Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                viewMode === 'grid'
                  ? 'bg-brand-slate text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                viewMode === 'split'
                  ? 'bg-brand-slate text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Map className="w-3.5 h-3.5 text-brand-gold" />
              <span>Map Split</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Filter Bar */}
      {isFilterDrawerOpen && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-6 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-serif text-lg font-bold text-brand-slate flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
              Refine Luxury Stays
            </h3>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price Slider */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Max nightly price: {maxPrice === Infinity ? 'Any' : formatINR(sliderValue)}
              </label>
              <input
                type="range"
                min="0"
                max={priceCeiling}
                step="500"
                value={sliderValue}
                onChange={(e) =>
                  setFilterState((prev) => ({
                    ...prev,
                    priceRange: [prev.priceRange[0], parseInt(e.target.value, 10)],
                  }))
                }
                className="w-full accent-brand-gold cursor-pointer"
              />
            </div>

            {/* Bedrooms Count */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Minimum Bedrooms
              </label>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFilterState((prev) => ({ ...prev, bedrooms: num }))}
                    className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${
                      filterState.bedrooms === num
                        ? 'bg-brand-slate text-white border-brand-slate'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num === 0 ? 'Any' : `${num}+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Bathrooms Count */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Minimum Bathrooms
              </label>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFilterState((prev) => ({ ...prev, bathrooms: num }))}
                    className={`w-9 h-9 rounded-full text-xs font-bold border transition-colors ${
                      filterState.bathrooms === num
                        ? 'bg-brand-slate text-white border-brand-slate'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num === 0 ? 'Any' : `${num}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Luxury Amenities Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Luxury Amenities & Features
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {availableAmenities.map((amenity) => {
                const isSelected = filterState.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setFilterState((prev) => ({
                        ...prev,
                        amenities: isSelected
                          ? prev.amenities.filter((a) => a !== amenity)
                          : [...prev.amenities, amenity],
                      }))
                    }
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium text-left transition-colors ${
                      isSelected
                        ? 'bg-amber-50 border-brand-gold text-amber-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isSelected ? 'bg-brand-gold border-brand-gold text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Layout (Grid vs Split Map) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.length > 0 ? (
            filteredProperties.map((prop) => <PropertyCard key={prop.id} property={prop} />)
          ) : (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 space-y-4">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-brand-slate">No luxury stays found</h3>
              <p className="text-xs text-slate-500">Try adjusting your filters or destination search.</p>
              <Button onClick={resetFilters} variant="gold" size="sm">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2 no-scrollbar">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
          <div className="lg:col-span-6 sticky top-24">
            <InteractiveMap properties={filteredProperties} />
          </div>
        </div>
      )}
    </div>
  );
};
