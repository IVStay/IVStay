import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Menu, Phone, User } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { BUSINESS } from '../../config/contact';

const NAV = [
  { to: '/stays', label: 'Stays' },
  { to: '/villas', label: 'Villas' },
  { to: '/hotels', label: 'Hotels' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/blogs', label: 'Blogs' },
];

const menuItem = 'block px-4 py-2.5 text-sm text-ink hover:bg-surface-muted';

/** Site header: logo, main sections, and an account menu (sign in, saved stays, help). */
export const SiteHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // Close the menu on navigation and on clicks outside it
  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const initial = (user?.full_name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-line-soft">
      <div className="shell h-[76px] flex items-center justify-between gap-6">
        <Link to="/" aria-label="IvStay home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden lg:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-[15px] transition-colors ${
                  isActive ? 'text-ink font-semibold' : 'text-ink-muted hover:text-ink hover:bg-surface-muted'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            to="/contact?type=list"
            className="hidden md:inline-flex px-4 py-2.5 rounded-full text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            List your property
          </Link>
          <Link
            to="/saved"
            aria-label="Saved stays"
            className="hidden sm:inline-flex w-10 h-10 items-center justify-center rounded-full text-ink hover:bg-surface-muted"
          >
            <Heart className="w-[18px] h-[18px]" />
          </Link>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Account menu"
              className={`flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-full border border-line hover:shadow-pill transition-shadow ${
                open ? 'shadow-pill' : ''
              }`}
            >
              <Menu className="w-4 h-4 text-ink" />
              {user ? (
                <span className="w-8 h-8 rounded-full bg-ivy text-white text-sm font-semibold flex items-center justify-center">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    initial
                  )}
                </span>
              ) : (
                <span className="w-8 h-8 rounded-full bg-ink-muted text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </span>
              )}
            </button>

            {open && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-float border border-line-soft py-2 overflow-hidden"
              >
                {user ? (
                  <>
                    <div className="px-4 py-2.5">
                      <p className="text-sm font-semibold text-ink truncate">{user.full_name || 'Your account'}</p>
                      <p className="text-xs text-ink-muted truncate">{user.email}</p>
                    </div>
                    <Link to="/account" className={`${menuItem} font-semibold`} role="menuitem">
                      My bookings &amp; details
                    </Link>
                    <Link to="/saved" className={menuItem} role="menuitem">
                      Saved stays
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signin?mode=signup" className={`${menuItem} font-semibold`} role="menuitem">
                      Sign up
                    </Link>
                    <Link to="/signin" className={menuItem} role="menuitem">
                      Log in
                    </Link>
                    <Link to="/saved" className={menuItem} role="menuitem">
                      Saved stays
                    </Link>
                  </>
                )}
                <div className="my-2 border-t border-line-soft" />
                <div className="lg:hidden">
                  {NAV.map(({ to, label }) => (
                    <Link key={to} to={to} className={menuItem} role="menuitem">
                      {label}
                    </Link>
                  ))}
                  <div className="my-2 border-t border-line-soft" />
                </div>
                <Link to="/contact?type=list" className={menuItem} role="menuitem">
                  List your property
                </Link>
                <Link to="/about" className={menuItem} role="menuitem">
                  About IvStay
                </Link>
                <Link to="/contact" className={menuItem} role="menuitem">
                  Help &amp; contact
                </Link>
                <a href={`tel:${BUSINESS.phoneDisplay.replace(/\s/g, '')}`} className={`${menuItem} flex items-center gap-2`} role="menuitem">
                  <Phone className="w-3.5 h-3.5 text-ink-muted" /> {BUSINESS.phoneDisplay}
                </a>
                {user && (
                  <>
                    <div className="my-2 border-t border-line-soft" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={async () => {
                        await logout();
                        navigate('/');
                      }}
                      className={`${menuItem} w-full text-left`}
                    >
                      Log out
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
