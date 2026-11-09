import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';

/** Stays the visitor saved with the heart button (kept in this browser). */
export const SavedPage: React.FC = () => {
  const { properties, wishlistIds, loading } = useProperties();
  const saved = properties.filter((p) => p.status === 'active' && wishlistIds.includes(p.id));

  useEffect(() => {
    document.title = 'Saved stays | IvStay';
    return () => {
      document.title = 'IvStay | Hand-picked villas, BnBs & hotels';
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Saved</p>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-slate mt-1">Your saved stays</h1>
        <p className="text-sm text-slate-500 mt-2">
          Tap the heart on any stay to keep it here. Saved stays are kept on this device.
        </p>
      </div>

      {loading && saved.length === 0 ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : saved.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
          <Heart className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-600">You haven't saved any stays yet.</p>
          <Link
            to="/stays"
            className="inline-block px-6 py-2.5 rounded-full bg-brand-slate text-white text-sm font-semibold hover:bg-slate-800"
          >
            Browse stays
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};
