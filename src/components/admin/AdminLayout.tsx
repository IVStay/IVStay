import React from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Building2, CalendarDays, LogOut, Shield, ArrowLeft, Sparkles } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Protected route gate: wait for the saved session, then require a verified admin
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-xs">
        Checking your session…
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  const navItems = [
    { label: 'Bookings Ledger', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Properties & CRUD', path: '/admin/properties', icon: Building2 },
    { label: 'Availability Calendar', path: '/admin/bookings', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          {/* Admin Header Branding */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-brand-gold text-white flex items-center justify-center font-serif font-bold text-lg shadow-md">
                Iv
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-white tracking-tight">IvStay Admin</span>
                <span className="block text-[9px] font-semibold tracking-widest text-brand-gold uppercase">
                  Management Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Admin Info Pill */}
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex items-center gap-3">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.full_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-gold"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] text-brand-gold truncate font-mono">{user.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-gold text-white shadow-gold-glow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="pt-6 border-t border-slate-800/80 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-brand-gold" />
            <span>Switch to Guest Portal</span>
          </Link>

          <button
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content View */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
