import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Headphones, CreditCard, Sparkles, Send, Globe, DollarSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const { showSuccess } = useToast();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    showSuccess('Welcome to IvStay Private Collection', 'You have been subscribed to luxury stay releases & private offers.');
    setEmail('');
  };

  return (
    <footer className="bg-brand-slate text-white pt-16 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Luxury Trust Badges Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 text-brand-gold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">IvStay Verified</h4>
              <p className="text-xs text-slate-400">100% Quality Inspected</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 text-brand-gold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Best Price Guarantee</h4>
              <p className="text-xs text-slate-400">Direct booking privilege</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 text-brand-gold">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">24/7 VIP Concierge</h4>
              <p className="text-xs text-slate-400">Personalized trip planning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800/80 text-brand-gold">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">Secure Payment</h4>
              <p className="text-xs text-slate-400">Encrypted checkout protection</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Newsletter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 py-12">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold text-white flex items-center justify-center font-serif font-bold text-xl shadow-md">
                Iv
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">IvStay</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              IvStay is the premier luxury accommodation platform showcasing handpicked private villas, boutique BnBs, and high-end boutique hotels across the world’s most coveted destinations.
            </p>

            {/* Newsletter Form */}
            <form onSubmit={handleSubscribe} className="pt-2">
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Subscribe to Private Luxury Offers
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="bg-slate-800/90 border border-slate-700/80 text-white placeholder-slate-500 rounded-full px-4 py-2.5 text-xs flex-1 focus:outline-none focus:border-brand-gold"
                  required
                />
                <button
                  type="submit"
                  className="bg-brand-gold text-white hover:bg-brand-goldHover p-2.5 rounded-full transition-colors shrink-0 shadow-gold-glow"
                  aria-label="Subscribe"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Categories</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/bnbs-and-villas" className="hover:text-white transition-colors">Villas & BnBs</Link></li>
              <li><Link to="/hotels" className="hover:text-white transition-colors">Luxury Hotels</Link></li>
              <li><Link to="/home-stays" className="hover:text-white transition-colors">Home Stays</Link></li>
              <li><Link to="/stays" className="hover:text-white transition-colors">All Collection</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Popular Destinations</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/stays?destination=Positano" className="hover:text-white transition-colors">Amalfi Coast, Italy</Link></li>
              <li><Link to="/stays?destination=Ubud" className="hover:text-white transition-colors">Ubud, Bali</Link></li>
              <li><Link to="/stays?destination=Provence" className="hover:text-white transition-colors">Provence, France</Link></li>
              <li><Link to="/stays?destination=Zermatt" className="hover:text-white transition-colors">Zermatt, Switzerland</Link></li>
              <li><Link to="/stays?destination=Paris" className="hover:text-white transition-colors">Paris, France</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Portal Access</h5>
            <ul className="space-y-2 text-xs text-slate-400">

              <li><Link to="/admin/login" className="hover:text-white transition-colors flex items-center gap-1"><Sparkles className="w-3 h-3 text-brand-gold" /> Admin & Host Login</Link></li>

              <li><a href="#terms" className="hover:text-white transition-colors">Terms of Hospitality Service</a></li>
              <li><a href="#privacy" className="hover:text-white transition-colors">Privacy & Data Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Currency Selectors */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 IvStay Inc. All luxury rights reserved.</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-700/60 text-white">
              <Globe className="w-3.5 h-3.5 text-brand-gold" />
              <span>English (US)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/70 px-3 py-1.5 rounded-full border border-slate-700/60 text-white">
              <DollarSign className="w-3.5 h-3.5 text-brand-gold" />
              <span>INR (₹)</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
