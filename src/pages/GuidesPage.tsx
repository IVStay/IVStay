import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { GUIDES, type Guide, type GuideTag } from '../data/guides';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import { NotFoundPage } from './NotFoundPage';
import type { Property } from '../types';

const FALLBACK = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop';

function useLiveStays() {
  const { properties } = useProperties();
  return properties.filter((p) => p.status === 'active');
}

const cityStays = (live: Property[], city?: string) =>
  city ? live.filter((p) => p.city.trim().toLowerCase() === city.toLowerCase()) : [];

/** Cover photo: a stay in the post's town, otherwise a photo from any live stay (varied per post). */
function coverFor(guide: Guide, live: Property[]): string {
  const local = cityStays(live, guide.city);
  if (local[0]?.images[0]) return local[0].images[0];
  if (guide.cover) return guide.cover;
  const photos = live.flatMap((p) => p.images.slice(0, 3));
  if (!photos.length) return FALLBACK;
  const index = GUIDES.findIndex((g) => g.slug === guide.slug);
  return photos[(index * 2 + 1) % photos.length];
}

function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | IvStay`;
    return () => {
      document.title = 'IvStay | Luxury Villas, Boutique BnBs & Hotels';
    };
  }, [title]);
}

const Meta: React.FC<{ guide: Guide; light?: boolean }> = ({ guide, light }) => (
  <p className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-widest ${light ? 'text-white/80' : 'text-brand-gold'}`}>
    {guide.tag}
    <span className={light ? 'text-white/50' : 'text-slate-300'}>·</span>
    <span className={`flex items-center gap-1 normal-case tracking-normal font-medium ${light ? 'text-white/80' : 'text-slate-500'}`}>
      <Clock className="w-3 h-3" /> {guide.readMinutes} min read
    </span>
  </p>
);

const GuideCard: React.FC<{ guide: Guide; live: Property[] }> = ({ guide, live }) => (
  <Link to={`/blogs/${guide.slug}`} className="group bg-white border border-slate-200 rounded-3xl overflow-hidden flex flex-col">
    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
      <img
        src={coverFor(guide, live)}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
    <div className="p-6 space-y-2 flex-1 flex flex-col">
      <Meta guide={guide} />
      <h2 className="font-serif text-2xl font-bold text-brand-slate">{guide.title}</h2>
      <p className="text-sm text-slate-600 leading-relaxed flex-1">{guide.summary}</p>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-slate group-hover:gap-2 transition-all">
        Read more <ArrowRight className="w-4 h-4" />
      </span>
    </div>
  </Link>
);

const TAGS: ('All' | GuideTag)[] = ['All', 'Destination guide', 'Trip planning', 'Travel tips'];
const TAG_LABEL: Record<'All' | GuideTag, string> = {
  All: 'All posts',
  'Destination guide': 'Destination guides',
  'Trip planning': 'Trip planning',
  'Travel tips': 'Travel tips',
};

/** /blogs: all posts, filterable by type */
export const GuidesPage: React.FC = () => {
  useTitle('Blogs & travel guides');
  const live = useLiveStays();
  const [tag, setTag] = useState<'All' | GuideTag>('All');
  const shown = tag === 'All' ? GUIDES : GUIDES.filter((g) => g.tag === tag);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Blogs</p>
        <h1 className="font-serif text-4xl font-bold text-brand-slate mt-2">Stories, guides and tips</h1>
        <p className="text-slate-600 mt-3 leading-relaxed">
          Practical guides to the places we have stays in, and simple advice for planning your next getaway.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter posts">
        {TAGS.filter((t) => t === 'All' || GUIDES.some((g) => g.tag === t)).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tag === t}
            onClick={() => setTag(t)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              tag === t ? 'bg-brand-slate text-white border-brand-slate' : 'bg-white text-slate-600 border-slate-200 hover:border-brand-slate'
            }`}
          >
            {TAG_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((g) => (
          <GuideCard key={g.slug} guide={g} live={live} />
        ))}
      </div>
    </div>
  );
};

/** /blogs/:slug: one post, with stays in that town (or a few picks) underneath */
export const GuideArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = GUIDES.find((g) => g.slug === slug);
  const live = useLiveStays();
  useTitle(guide?.title ?? 'Blog');
  if (!guide) return <NotFoundPage />;

  const local = cityStays(live, guide.city);
  const picks = local.length ? local : live.slice(0, 3);
  const more = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <article className="pb-16">
      <div className="relative h-[42vh] min-h-[300px]">
        <img src={coverFor(guide, live)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/10" />
        <div className="absolute bottom-0 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6 pb-8 text-white space-y-2">
          <Link to="/blogs" className="inline-flex items-center gap-1 text-xs font-semibold text-white/80 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> All posts
          </Link>
          <Meta guide={guide} light />
          <h1 className="font-serif text-3xl sm:text-5xl font-bold">{guide.title}</h1>
          <p className="text-xs text-white/70">Updated {guide.updated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 space-y-8 text-[15px] leading-relaxed text-slate-700">
        <p className="text-lg text-slate-600">{guide.summary}</p>
        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-serif text-2xl font-bold text-brand-slate">{section.heading}</h2>
            {section.points && (
              <ul className="list-disc pl-5 space-y-1.5">
                {section.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {section.paragraphs?.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
        <p className="text-xs text-slate-400">
          Travel times, weather and local rules change. Check before you go, or ask us when you book.
        </p>
      </div>

      {picks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-brand-slate">
            {local.length ? `Where to stay in ${guide.city}` : 'Stays we love'}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}

      {more.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 space-y-6">
          <h2 className="font-serif text-2xl font-bold text-brand-slate">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {more.map((g) => (
              <GuideCard key={g.slug} guide={g} live={live} />
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
