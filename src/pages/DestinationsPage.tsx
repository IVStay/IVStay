import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { formatINR } from '../utils/currency';

const FALLBACK = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop';

/** One card per town that has live stays, built from the listings themselves. */
export const DestinationsPage: React.FC = () => {
  const { properties, loading } = useProperties();

  useEffect(() => {
    document.title = 'Destinations | IvStay';
    return () => {
      document.title = 'IvStay | Hand-picked villas, BnBs & hotels';
    };
  }, []);

  const destinations = useMemo(() => {
    const byCity = new Map<string, { city: string; state: string; count: number; from: number; image: string }>();
    for (const p of properties) {
      if (p.status !== 'active') continue;
      const key = p.city.trim().toLowerCase();
      const current = byCity.get(key);
      if (current) {
        current.count += 1;
        current.from = Math.min(current.from, p.price_per_night);
        if (current.image === FALLBACK && p.images[0]) current.image = p.images[0];
      } else {
        byCity.set(key, { city: p.city.trim(), state: p.state, count: 1, from: p.price_per_night, image: p.images[0] || FALLBACK });
      }
    }
    return [...byCity.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
  }, [properties]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Destinations</p>
        <h1 className="font-serif text-4xl font-bold text-brand-slate mt-2">Where we have stays</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Pick a place to see every IvStay villa, BnB and hotel there. New destinations are added as we find stays
          worth recommending.
        </p>
      </div>

      {loading && destinations.length === 0 ? (
        <p className="text-xs text-slate-500">Loading destinations…</p>
      ) : destinations.length === 0 ? (
        <p className="text-sm text-slate-500">No destinations listed yet. Please check back soon.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <Link
              key={d.city}
              to={`/stays?destination=${encodeURIComponent(d.city)}`}
              className="group relative block aspect-[4/5] rounded-3xl overflow-hidden"
            >
              <img
                src={d.image}
                alt={`Stays in ${d.city}`}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="flex items-center gap-1 text-xs text-white/80">
                  <MapPin className="w-3.5 h-3.5" /> {d.state || 'India'}
                </p>
                <h2 className="font-serif text-3xl font-bold">{d.city}</h2>
                <p className="text-sm text-white/85 mt-1">
                  {d.count} {d.count === 1 ? 'stay' : 'stays'} · from {formatINR(d.from)} / night
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
