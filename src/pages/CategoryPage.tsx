import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import type { Property } from '../types';

interface CategoryPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  match: (p: Property) => boolean;
}

/** /villas and /hotels: live stays of one kind, with a friendly empty state. */
export const CategoryPage: React.FC<CategoryPageProps> = ({ eyebrow, title, intro, match }) => {
  const { properties, loading } = useProperties();
  const stays = properties.filter((p) => p.status === 'active' && match(p));

  useEffect(() => {
    document.title = `${title} | IvStay`;
    return () => {
      document.title = 'IvStay | Luxury Villas, Boutique BnBs & Hotels';
    };
  }, [title]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">{eyebrow}</p>
        <h1 className="font-serif text-4xl font-bold text-brand-slate mt-2">{title}</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">{intro}</p>
      </div>

      {loading && stays.length === 0 ? (
        <p className="text-xs text-slate-500">Loading stays…</p>
      ) : stays.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-4">
          <p className="text-sm text-slate-600">
            We're adding new places here soon. In the meantime, have a look at our other stays, or tell us what you're
            looking for.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/stays" className="px-6 py-2.5 rounded-full bg-brand-slate text-white text-sm font-semibold hover:bg-slate-800">
              See all stays
            </Link>
            <Link to="/contact" className="px-6 py-2.5 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50">
              Ask us
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
};
