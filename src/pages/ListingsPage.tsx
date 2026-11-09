import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Home, LayoutGrid, Map as MapIcon, Minus, Plus, Search, SlidersHorizontal, Trees, X } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import { InteractiveMap } from '../components/public/InteractiveMap';
import { formatINR } from '../utils/currency';

type Category = 'all' | 'bnbs_and_villas' | 'hotels' | 'home_stays';

interface ListingsPageProps {
  defaultCategory?: Category;
}

const CATEGORY_TABS: { key: Category; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'All stays', icon: LayoutGrid },
  { key: 'bnbs_and_villas', label: 'Villas & BnBs', icon: Home },
  { key: 'hotels', label: 'Hotels', icon: Building2 },
  { key: 'home_stays', label: 'Home stays', icon: Trees },
];

const Counter: React.FC<{ label: string; value: number; onChange: (n: number) => void; max: number }> = ({
  label,
  value,
  onChange,
  max,
}) => (
  <div className="flex items-center justify-between py-4">
    <span className="text-ink">{label}</span>
    <div className="flex items-center gap-4">
      <button
        type="button"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-8 h-8 rounded-full border border-line text-ink-muted hover:border-ink hover:text-ink disabled:opacity-30 disabled:hover:border-line flex items-center justify-center"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="w-10 text-center tabular-nums">{value === 0 ? 'Any' : `${value}+`}</span>
      <button
        type="button"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-full border border-line text-ink-muted hover:border-ink hover:text-ink disabled:opacity-30 flex items-center justify-center"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export const ListingsPage: React.FC<ListingsPageProps> = ({ defaultCategory = 'all' }) => {
  const { properties, filterState, setFilterState, resetFilters, loading } = useProperties();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'map'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryParam = searchParams.get('category');
  const urlCategory = CATEGORY_TABS.map((t) => t.key).find((c) => c === categoryParam) ?? null;
  const urlDestination = searchParams.get('destination');
  const urlGuests = searchParams.get('guests');

  useEffect(() => {
    document.title = 'Stays | IvStay';
    return () => {
      document.title = 'IvStay | Hand-picked villas, BnBs & hotels';
    };
  }, []);

  // Apply search choices from the URL (home page search, collections) to the shared filters
  useEffect(() => {
    setFilterState((prev) => ({
      ...prev,
      destination: urlDestination ?? prev.destination,
      guests: urlGuests !== null ? Math.max(1, parseInt(urlGuests, 10) || 1) : prev.guests,
      category: urlCategory ?? prev.category,
    }));
  }, [urlDestination, urlGuests, urlCategory, setFilterState]);

  const live = useMemo(() => properties.filter((p) => p.status === 'active'), [properties]);

  // The price slider's top end follows the most expensive stay; the top position means "no limit"
  const highestPrice = live.reduce((max, p) => Math.max(max, p.price_per_night || 0), 0);
  const priceCeiling = Math.max(10000, Math.ceil(highestPrice / 5000) * 5000);
  const sliderValue = Math.min(filterState.priceRange[1], priceCeiling);
  const maxPrice = sliderValue >= priceCeiling ? Infinity : sliderValue;

  // Amenity filters come from what the live stays actually offer
  const amenityOptions = useMemo(() => {
    const counts = new Map<string, number>();
    live.forEach((p) => p.amenities.forEach((a) => counts.set(a, (counts.get(a) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 12);
  }, [live]);

  const activeCategory: Category = defaultCategory !== 'all' ? defaultCategory : (filterState.category as Category);

  const results = live.filter((p) => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    const q = filterState.destination.trim().toLowerCase();
    if (q && ![p.city, p.state, p.title].some((v) => v.toLowerCase().includes(q))) return false;
    if (filterState.guests > 1 && p.max_guests < filterState.guests) return false;
    if (p.price_per_night < filterState.priceRange[0] || p.price_per_night > maxPrice) return false;
    if (filterState.bedrooms > 0 && (p.bedrooms ?? 0) < filterState.bedrooms) return false;
    if (filterState.bathrooms > 0 && (p.bathrooms ?? 0) < filterState.bathrooms) return false;
    if (filterState.amenities.length && !filterState.amenities.every((a) => p.amenities.includes(a))) return false;
    return true;
  });

  const extraFilters =
    (maxPrice !== Infinity ? 1 : 0) +
    (filterState.bedrooms > 0 ? 1 : 0) +
    (filterState.bathrooms > 0 ? 1 : 0) +
    filterState.amenities.length;

  const place = filterState.destination.trim();
  const heading = `${loading && !live.length ? '' : `${results.length} `}${results.length === 1 ? 'stay' : 'stays'}${
    place ? ` in ${place}` : ''
  }`;

  return (
    <div className="pb-20">
      {/* Category tabs and controls */}
      <div className="shell border-b border-line-soft">
        <div className="flex items-center gap-6">
          {defaultCategory === 'all' && (
            <div className="flex gap-8 overflow-x-auto no-scrollbar flex-1" role="tablist" aria-label="Kinds of stay">
              {CATEGORY_TABS.map(({ key, label, icon: Icon }) => {
                const selected = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setFilterState((prev) => ({ ...prev, category: key }))}
                    className={`shrink-0 flex flex-col items-center gap-2 py-3 border-b-2 text-xs font-semibold transition-colors ${
                      selected ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.6} />
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center gap-2 py-3 ml-auto">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative flex items-center gap-2 px-4 py-3 rounded-xl border border-line text-sm font-semibold text-ink hover:border-ink"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
              {extraFilters > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white text-[11px] flex items-center justify-center">
                  {extraFilters}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="shell pt-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{heading}</h1>
          <div className="flex items-center gap-3">
            <label className="relative">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search a place or stay"
                value={filterState.destination}
                onChange={(e) => setFilterState((prev) => ({ ...prev, destination: e.target.value }))}
                className="pl-10 pr-4 py-2.5 rounded-full border border-line text-sm focus:outline-none focus:border-ink w-56 sm:w-64"
              />
            </label>
            <div className="hidden md:flex rounded-full border border-line p-1">
              {(
                [
                  ['grid', 'Grid', LayoutGrid],
                  ['map', 'Map', MapIcon],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setView(key)}
                  aria-pressed={view === key}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    view === key ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <h2 className="text-xl font-semibold text-ink">{loading ? 'Loading stays…' : 'No exact matches'}</h2>
            {!loading && (
              <>
                <p className="text-ink-muted">Try changing or removing some of your filters, or searching another place.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-6 py-3 rounded-xl border border-ink text-sm font-semibold text-ink hover:bg-surface-muted"
                >
                  Remove all filters
                </button>
              </>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 grid gap-x-6 gap-y-10 sm:grid-cols-2">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-2xl overflow-hidden">
              <InteractiveMap properties={results} />
            </div>
          </div>
        )}
      </div>

      {/* Filters dialog */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50" onClick={() => setFiltersOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full sm:max-w-[640px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
          >
            <div className="relative flex items-center justify-center h-16 border-b border-line-soft shrink-0">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close"
                className="absolute left-4 w-8 h-8 rounded-full hover:bg-surface-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-semibold text-ink">Filters</h2>
            </div>

            <div className="overflow-y-auto px-6 divide-y divide-line-soft">
              <section className="py-6">
                <h3 className="text-lg font-semibold text-ink">Price per night</h3>
                <p className="text-sm text-ink-muted mt-1">
                  Up to {maxPrice === Infinity ? 'any price' : formatINR(sliderValue)}
                </p>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={500}
                  value={sliderValue}
                  onChange={(e) =>
                    setFilterState((prev) => ({ ...prev, priceRange: [prev.priceRange[0], parseInt(e.target.value, 10)] }))
                  }
                  className="w-full mt-4 accent-ivy cursor-pointer"
                  aria-label="Maximum price per night"
                />
              </section>

              <section className="py-2">
                <h3 className="text-lg font-semibold text-ink pt-4">Rooms</h3>
                <Counter label="Bedrooms" value={filterState.bedrooms} max={8} onChange={(n) => setFilterState((p) => ({ ...p, bedrooms: n }))} />
                <Counter label="Bathrooms" value={filterState.bathrooms} max={6} onChange={(n) => setFilterState((p) => ({ ...p, bathrooms: n }))} />
              </section>

              {amenityOptions.length > 0 && (
                <section className="py-6">
                  <h3 className="text-lg font-semibold text-ink">Amenities</h3>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {amenityOptions.map((a) => {
                      const on = filterState.amenities.includes(a);
                      return (
                        <button
                          key={a}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setFilterState((prev) => ({
                              ...prev,
                              amenities: on ? prev.amenities.filter((x) => x !== a) : [...prev.amenities, a],
                            }))
                          }
                          className={`px-4 py-2.5 rounded-full border text-sm transition-colors ${
                            on ? 'border-ink bg-surface-muted font-semibold text-ink' : 'border-line text-ink hover:border-ink'
                          }`}
                        >
                          {a}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-line-soft shrink-0">
              <button type="button" onClick={resetFilters} className="text-sm font-semibold text-ink underline underline-offset-4">
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="px-6 py-3 rounded-xl bg-ink hover:bg-black text-white text-sm font-semibold"
              >
                Show {results.length} {results.length === 1 ? 'stay' : 'stays'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
