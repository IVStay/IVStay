import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, User as UserIcon, Shield, Sparkles, LogOut, LayoutDashboard, Compass, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProperties } from '../../context/PropertyContext';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { wishlistIds } = useProperties();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-brand-slate text-brand-gold flex items-center justify-center font-serif font-bold text-xl shadow-md group-hover:scale-105 transition-transform duration-200">
              Iv
            </div>
            <div>
              <span className="font-serif text-2xl font-bold text-brand-slate tracking-tight">IvStay</span>
              <span className="hidden sm:block text-[10px] font-semibold tracking-widest text-brand-gold uppercase">
                Villas & BnBs
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              to="/"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              Home
              {isCurrent('/') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
            <Link
              to="/bnbs-and-villas"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/bnbs-and-villas') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              BnBs & Villas
              {isCurrent('/bnbs-and-villas') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
            <Link
              to="/hotels"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/hotels') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              Hotels
              {isCurrent('/hotels') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
            <Link
              to="/home-stays"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/home-stays') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              Home Stays
              {isCurrent('/home-stays') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
            <Link
              to="/blogs"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/blogs') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              Blogs
              {isCurrent('/blogs') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
            <Link
              to="/contact"
              className={`hover:text-brand-slate transition-colors py-1 relative ${
                isCurrent('/contact') ? 'text-brand-slate font-semibold' : ''
              }`}
            >
              Contact Us
              {isCurrent('/contact') && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-gold rounded-full" />
              )}
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">




          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};
