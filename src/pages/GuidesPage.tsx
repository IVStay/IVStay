import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GUIDES, type Guide } from '../data/guides';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import { NotFoundPage } from './NotFoundPage';

const FALLBACK = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop';

function useCityStays(city: string) {
  const { properties } = useProperties();
  return properties.filter((p) => p.status === 'active' && p.city.trim().toLowerCase() === city.toLowerCase());
}

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | IvStay`;
    return () => {
      document.title = 'IvStay | Luxury Villas, Boutique BnBs & Hotels';
    };
  }, [title]);
}

const GuideCard: React.FC<{ guide: Guide }> = ({ guide }) => {
  const stays = useCityStays(guide.city);
  return (
    <Link to={`/blogs/${guide.slug}`} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={stays[0]?.images[0] || FALLBACK}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-6 space-y-2 flex-1 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">{guide.city} guide</p>
        <h2 className="font-serif text-2xl font-bold text-brand-slate">{guide.title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed flex-1">{guide.summary}</p>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-slate group-hover:gap-2 transition-all">
          Read the guide <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

/** /blogs: list of destination guides */
export const GuidesPage: React.FC = () => {
  useTitle('Travel guides');
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Blogs</p>
        <h1 className="font-serif text-4xl font-bold text-brand-slate mt-2">Travel guides</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Short, practical guides to the places we have stays in: how to get there, when to go and what is worth
          your time.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {GUIDES.map((g) => (
          <GuideCard key={g.slug} guide={g} />
        ))}
      </div>
    </div>
  );
};

/** /blogs/:slug: one guide, with the stays in that town */
export const GuideArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = GUIDES.find((g) => g.slug === slug);
  const stays = useCityStays(guide?.city ?? '');
  useTitle(guide?.title ?? 'Guide');
  if (!guide) return <NotFoundPage />;

  return (
    <article className="pb-16">
      <div className="relative h-[42vh] min-h-[280px]">
        <img src={stays[0]?.images[0] || FALLBACK} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6 pb-8 text-white">
          <Link to="/blogs" className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> All guides
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold">{guide.title}</h1>
          <p className="text-xs text-white/70 mt-2">Updated {guide.updated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-8 text-[15px] leading-relaxed text-slate-700">
        <p className="text-lg text-slate-600">{guide.summary}</p>
        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-brand-slate">{section.heading}</h2>
            {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
            {section.points && (
              <ul className="list-disc pl-5 space-y-1.5">
                {section.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="text-xs text-slate-400">
          Travel times and rules change. Check locally before you go, or ask us when you book.
        </p>
      </div>

      {stays.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-brand-slate">Where to stay in {guide.city}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stays.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
