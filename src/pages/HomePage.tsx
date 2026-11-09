import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Home, LayoutGrid, MessageCircle, ReceiptText, Sparkles, Trees, Users } from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { PropertyCard } from '../components/public/PropertyCard';
import { SearchBar } from '../components/public/SearchBar';
import { GUIDES } from '../data/guides';
import type { Property } from '../types';

const FALLBACK = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop';

const CATEGORIES: { key: string; label: string; icon: React.ElementType; match: (p: Property) => boolean }[] = [
  { key: 'all', label: 'All stays', icon: LayoutGrid, match: () => true },
  { key: 'villas', label: 'Villas & BnBs', icon: Home, match: (p) => p.category === 'bnbs_and_villas' },
  { key: 'hotels', label: 'Hotels', icon: Building2, match: (p) => p.category === 'hotels' },
  { key: 'homestays', label: 'Home stays', icon: Trees, match: (p) => p.category === 'home_stays' },
  { key: 'groups', label: 'Big groups', icon: Users, match: (p) => p.max_guests >= 8 },
];

const SectionTitle: React.FC<{ title: string; to?: string; linkLabel?: string; subtitle?: string }> = ({
  title,
  to,
  linkLabel = 'Show all',
  subtitle,
}) => (
  <div className="flex items-end justify-between gap-4 mb-6">
    <div>
      <h2 className="text-[22px] sm:text-2xl font-semibold tracking-tight text-ink">{title}</h2>
      {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
    </div>
    {to && (
      <Link to={to} className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4 hover:text-ivy">
        {linkLabel}
      </Link>
    )}
  </div>
);

export const HomePage: React.FC = () => {
  const { properties, loading } = useProperties();
  const [category, setCategory] = useState('all');
  const live = useMemo(() => properties.filter((p) => p.status === 'active'), [properties]);

  useEffect(() => {
    document.title = 'IvStay | Hand-picked villas, BnBs & hotels';
  }, []);

  const visibleCategories = CATEGORIES.filter((c) => c.key === 'all' || live.some(c.match));
  const current = CATEGORIES.find((c) => c.key === category) ?? CATEGORIES[0];
  const stays = live.filter(current.match);

  const destinations = useMemo(() => {
    const byCity = new Map<string, { city: string; state: string; count: number; image: string }>();
    for (const p of live) {
      const key = p.city.trim().toLowerCase();
      const entry = byCity.get(key);
      if (entry) entry.count += 1;
      else byCity.set(key, { city: p.city.trim(), state: p.state, count: 1, image: p.images[0] || FALLBACK });
    }
    return [...byCity.values()];
  }, [live]);

  const hostImage = live[1]?.images[0] || live[0]?.images[0] || FALLBACK;

  return (
    <div className="pb-20">
      {/* Search */}
      <section className="shell pt-10 sm:pt-14 pb-8 text-center">
        <h1 className="text-[34px] leading-[1.1] sm:text-5xl lg:text-[56px] font-bold tracking-tightest text-ink">
          Find a stay worth the trip
        </h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-ink-muted max-w-xl mx-auto">
          Hand-picked villas, BnBs and boutique hotels, with clear prices and real people to help you book.
        </p>
        <div className="mt-8 sm:mt-10">
          <SearchBar />
        </div>
      </section>

      {/* Categories */}
      <div className="shell border-b border-line-soft">
        <div className="flex gap-8 overflow-x-auto no-scrollbar" role="tablist" aria-label="Kinds of stay">
          {visibleCategories.map(({ key, label, icon: Icon }) => {
            const selected = key === category;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setCategory(key)}
                className={`shrink-0 flex flex-col items-center gap-2 pt-3 pb-3 border-b-2 text-xs font-semibold transition-colors ${
                  selected ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
                }`}
              >
                <Icon className="w-6 h-6" strokeWidth={1.6} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stays */}
      <section className="shell pt-8">
        {loading && live.length === 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[20/19] rounded-2xl bg-surface-muted" />
                <div className="h-4 bg-surface-muted rounded mt-3 w-2/3" />
                <div className="h-4 bg-surface-muted rounded mt-2 w-1/2" />
              </div>
            ))}
          </div>
        ) : stays.length === 0 ? (
          <p className="py-16 text-center text-ink-muted">New stays are on their way. Please check back soon.</p>
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stays.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* Destinations */}
      {destinations.length > 0 && (
        <section className="shell pt-20">
          <SectionTitle title="Explore destinations" to="/destinations" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {destinations.map((d) => (
              <Link key={d.city} to={`/stays?destination=${encodeURIComponent(d.city)}`} className="group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-surface-muted">
                  <img
                    src={d.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3 font-semibold text-ink">{d.city}</p>
                <p className="text-sm text-ink-muted">
                  {d.count} {d.count === 1 ? 'stay' : 'stays'}
                  {d.state ? ` · ${d.state}` : ''}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why IvStay */}
      <section className="shell pt-20">
        <div className="grid md:grid-cols-3 gap-10 border-y border-line-soft py-12">
          {[
            {
              icon: Sparkles,
              title: 'Hand-picked, not listed by the thousand',
              text: "Every stay is chosen by our team. If we wouldn't stay there, it isn't on IvStay.",
            },
            {
              icon: ReceiptText,
              title: 'The full price, up front',
              text: 'Weekend rates, extra guests and fees are shown before you ask. No surprises at check-in.',
            },
            {
              icon: MessageCircle,
              title: 'Real people, quick replies',
              text: 'Call or WhatsApp us before, during and after your stay. A person answers, not a bot.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <Icon className="w-7 h-7 text-ivy shrink-0" strokeWidth={1.6} />
              <div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="text-ink-muted mt-1 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Blogs */}
      <section className="shell pt-20">
        <SectionTitle title="Travel guides and tips" to="/blogs" linkLabel="All posts" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {GUIDES.slice(0, 3).map((g) => {
            const cityStay = g.city ? live.find((p) => p.city.trim().toLowerCase() === g.city!.toLowerCase()) : undefined;
            const cover = cityStay?.images[0] || g.cover || FALLBACK;
            return (
              <Link key={g.slug} to={`/blogs/${g.slug}`} className="group">
                <div className="aspect-[3/2] rounded-2xl overflow-hidden bg-surface-muted">
                  <img
                    src={cover}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-ivy">{g.tag}</p>
                <h3 className="mt-1 font-semibold text-ink text-lg leading-snug group-hover:underline underline-offset-4">
                  {g.title}
                </h3>
                <p className="text-sm text-ink-muted mt-1 line-clamp-2">{g.summary}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Hosts */}
      <section className="shell pt-20">
        <div className="relative overflow-hidden rounded-4xl bg-ivy-800 text-white grid md:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center gap-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-ivy-200">For property owners</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tightest leading-tight">
              Own a beautiful place? Host it with IvStay.
            </h2>
            <p className="text-white/75 leading-relaxed max-w-md">
              We bring you guests looking for something special, handle enquiries and follow-ups, and keep your
              prices and calendar in your control.
            </p>
            <Link
              to="/contact?type=list"
              className="self-start inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-ink font-semibold hover:bg-ivy-50 transition-colors"
            >
              List your property <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative min-h-[260px]">
            <img src={hostImage} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
