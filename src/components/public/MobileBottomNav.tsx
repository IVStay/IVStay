import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Heart, User, Shield } from 'lucide-react';
import { useProperties } from '../../context/PropertyContext';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { wishlistIds } = useProperties();
  const { isAdmin } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  // Hide on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-4 py-2 shadow-lg">
      <div className="flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive('/') ? 'text-brand-gold font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Explore</span>
        </Link>

        <Link
          to="/stays"
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
            isActive('/stays') ? 'text-brand-gold font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Stays</span>
        </Link>



        <Link
          to={isAdmin ? '/admin/dashboard' : '/admin/login'}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors text-amber-700`}
        >
          <Shield className="w-5 h-5 text-brand-gold" />
          <span>Admin</span>
        </Link>
      </div>
    </div>
  );
};
