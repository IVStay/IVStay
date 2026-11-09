import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, Heart, MessageCircle, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { whatsappLink } from '../config/contact';

const steps = [
  {
    icon: Search,
    title: 'Pick a stay',
    text: 'Browse our hand-picked villas, BnBs and hotels and see the full price for your dates before you ask.',
  },
  {
    icon: MessageCircle,
    title: 'Send a request',
    text: 'Tell us your dates and guests. Nothing is charged. We check with the host and get back to you quickly.',
  },
  {
    icon: CalendarCheck,
    title: 'Confirm and go',
    text: 'Once you pay the agreed amount, your stay is confirmed in writing, with directions and host details.',
  },
];

const promises = [
  {
    icon: Sparkles,
    title: 'Chosen, not scraped',
    text: "Every listing is picked by our team. If we wouldn't stay there ourselves, it isn't on IvStay.",
  },
  {
    icon: ShieldCheck,
    title: 'Clear prices',
    text: 'Weekend rates, extra guests, cleaning and service fees are all shown up front. No surprises at check-in.',
  },
  {
    icon: Heart,
    title: 'Help from real people',
    text: 'From the first question to check-out, you can call or WhatsApp a person who knows the property.',
  },
];

export const AboutPage: React.FC = () => {
  useEffect(() => {
    document.title = 'About us | IvStay';
    return () => {
      document.title = 'IvStay | Luxury Villas, Boutique BnBs & Hotels';
    };
  }, []);

  return (
    <div>
      <section className="bg-brand-slate text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">About IvStay</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">
            Fewer, better places to stay.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
            IvStay is a small collection of villas, BnBs and boutique hotels in India's most loved getaways. We
            choose every place ourselves, show honest prices, and stay with you from the first question to
            check-out.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-16 space-y-4 text-[15px] leading-relaxed text-slate-700">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">Our story</p>
        <h2 className="font-serif text-3xl font-bold text-brand-slate">Booking a getaway should feel like a getaway</h2>
        <p>
          IvStay exists for one simple reason: finding a good place to stay in the hills should be as relaxing as the
          trip itself. Too often it isn't. Photos that flatter, charges that appear at check-in, and nobody to call
          when the hot water doesn't work.
        </p>
        <p>
          So we keep things small and personal. We list a handful of villas, BnBs and boutique hotels that we know and
          trust, show every rupee of the price before you ask, and answer the phone when you call. When you send a
          request, a person checks it with the host and comes back to you, not an automated system.
        </p>
        <p>
          We are growing one good stay at a time. If you own a place that guests would love, we'd be glad to hear
          from you.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-slate">How booking works</h2>
          <p className="text-slate-500 mt-2">Three simple steps, and no payment until your stay is confirmed.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <Icon className="w-5 h-5 text-brand-slate" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-slate">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-3 gap-8">
          {promises.map(({ icon: Icon, title, text }) => (
            <div key={title} className="space-y-2">
              <Icon className="w-6 h-6 text-brand-gold" />
              <h3 className="font-serif text-xl font-bold text-brand-slate">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <h2 className="font-serif text-3xl font-bold text-brand-slate">Ready for a getaway?</h2>
        <p className="text-slate-600">Browse our stays, or tell us what you're looking for and we'll suggest a few.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/stays" className="px-7 py-3 rounded-full bg-brand-slate text-white text-sm font-semibold hover:bg-slate-800">
            Browse stays
          </Link>
          <a
            href={whatsappLink("Hi IvStay, I'm looking for a stay. Can you suggest a few options?")}
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50"
          >
            Ask us on WhatsApp
          </a>
          <Link to="/contact?type=list" className="px-7 py-3 rounded-full border border-slate-300 text-sm font-semibold text-brand-slate hover:bg-slate-50">
            List your property
          </Link>
        </div>
      </section>
    </div>
  );
};
