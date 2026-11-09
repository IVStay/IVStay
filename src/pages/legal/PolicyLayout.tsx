import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BUSINESS, POLICIES_UPDATED } from '../../config/contact';

const PAGES = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Use' },
  { to: '/cancellation-policy', label: 'Cancellation & Refunds' },
];

/** Shared frame for the policy pages: title, last-updated date, page switcher and contact box. */
export const PolicyLayout: React.FC<{ title: string; intro: React.ReactNode; children: React.ReactNode }> = ({
  title,
  intro,
  children,
}) => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = `${title} | IvStay`;
    return () => {
      document.title = 'IvStay | Hand-picked villas, BnBs & hotels';
    };
  }, [title]);

  return (
    <div className="bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Policies">
          {PAGES.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                pathname === page.to
                  ? 'bg-brand-slate text-white border-brand-slate'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-brand-slate'
              }`}
            >
              {page.label}
            </Link>
          ))}
        </nav>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-slate">{title}</h1>
        <p className="text-xs text-slate-400 mt-2">Last updated: {POLICIES_UPDATED}</p>
        <div className="mt-6 text-[15px] leading-relaxed text-slate-700">{intro}</div>

        <div className="policy mt-8 space-y-8 text-[15px] leading-relaxed text-slate-700">{children}</div>

        <div className="mt-12 bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600 space-y-1">
          <p className="font-semibold text-brand-slate">Questions or requests</p>
          <p>
            Email{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-brand-gold font-semibold hover:underline">
              {BUSINESS.email}
            </a>{' '}
            or call / WhatsApp{' '}
            <a href={`tel:${BUSINESS.phoneDisplay.replace(/\s/g, '')}`} className="text-brand-gold font-semibold hover:underline">
              {BUSINESS.phoneDisplay}
            </a>
            .
          </p>
          {(BUSINESS.legalName || BUSINESS.address) && (
            <p className="text-slate-500">
              {[BUSINESS.legalName, BUSINESS.address].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/** A numbered section of a policy page. */
export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-serif text-xl font-bold text-brand-slate">{title}</h2>
    <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-brand-slate">
      {children}
    </div>
  </section>
);
