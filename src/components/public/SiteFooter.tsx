import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle } from 'lucide-react';
import { BUSINESS, whatsappLink } from '../../config/contact';

const linkClass = 'text-slate-400 hover:text-white transition-colors';

export const SiteFooter: React.FC = () => (
  <footer className="bg-brand-slate text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-3">
          <p className="font-serif text-2xl font-bold">IVStay</p>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            Hand-picked villas, BnBs and hotels in India, booked with a real person on the other end.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">Explore</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/stays" className={linkClass}>All stays</Link></li>
            <li><Link to="/villas" className={linkClass}>Villas</Link></li>
            <li><Link to="/hotels" className={linkClass}>Hotels &amp; Resorts</Link></li>
            <li><Link to="/destinations" className={linkClass}>Destinations</Link></li>
            <li><Link to="/about" className={linkClass}>About us</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">Policies</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/privacy" className={linkClass}>Privacy Policy</Link></li>
            <li><Link to="/terms" className={linkClass}>Terms of Use</Link></li>
            <li><Link to="/cancellation-policy" className={linkClass}>Cancellation &amp; Refunds</Link></li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-gold">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`tel:${BUSINESS.phoneDisplay.replace(/\s/g, '')}`} className={`${linkClass} flex items-center gap-2`}>
                <Phone className="w-4 h-4" /> {BUSINESS.phoneDisplay}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink('Hi IvStay, I have a question.')}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass} flex items-center gap-2`}
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp us
              </a>
            </li>
            <li>
              <a href={`mailto:${BUSINESS.email}`} className={`${linkClass} flex items-center gap-2`}>
                <Mail className="w-4 h-4" /> {BUSINESS.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-slate-700/60 flex flex-col sm:flex-row justify-between gap-2 text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {BUSINESS.legalName || BUSINESS.name}. All rights reserved.</p>
        <p>Prices in Indian rupees (₹).</p>
      </div>
    </div>
  </footer>
);
