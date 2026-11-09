import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => (
  <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
    <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Page not found</p>
    <h1 className="font-serif text-4xl font-bold text-brand-slate">This page has checked out</h1>
    <p className="text-sm text-slate-500">The link may be old or mistyped. Try one of these instead:</p>
    <div className="flex flex-wrap justify-center gap-3 pt-2">
      <Link to="/" className="px-6 py-2.5 rounded-full bg-brand-slate text-white text-sm font-semibold hover:bg-slate-800">
        Home
      </Link>
      <Link to="/stays" className="px-6 py-2.5 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50">
        All stays
      </Link>
      <Link to="/contact" className="px-6 py-2.5 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50">
        Contact us
      </Link>
    </div>
  </div>
);
