"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './Navigation.module.css';
import { CONTACT_PHONE, whatsappLink } from '@src/config/contact';
import { useAuth } from '@src/context/AuthContext';

// SVG Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.496-4.196-7.092-7.092l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const NAV_LINKS = [
  { href: '/villas', label: 'Villas' },
  { href: '/hotels', label: 'Hotels & Resorts' },
  { href: '/destinations', label: 'Destinations' },
  { href: '/blogs', label: 'Blogs' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const LIST_PROPERTY_HREF = whatsappLink("Hi IvStay, I'd like to list my property on IvStay.");

export const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { user } = useAuth();
  // Customers sign in here. The admin console isn't linked anywhere: type /admin to reach it.
  const accountHref = user ? '/account' : '/signin';
  const accountLabel = user ? user.full_name.split(' ')[0] || 'My account' : 'Sign In';

  return (
    <header className={styles.header}>
      <div className={styles.navContainer}>
        {/* Logo left */}
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          IVStay
        </Link>

        {/* Links center (wide screens) */}
        <nav className={styles.navLinks} aria-label="Main">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.link}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions right */}
        <div className={styles.actions}>
          <Link href="/stays" className={styles.iconButton} aria-label="Search stays" onClick={closeMenu}>
            <SearchIcon />
          </Link>
          {/* Favorites need guest accounts (backend) before they can do anything */}
          <button className={`${styles.iconButton} ${styles.hideOnMobile}`} aria-label="Favorites"><HeartIcon /></button>
          <a
            href={LIST_PROPERTY_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.outlineBtn} ${styles.hideOnMobile}`}
          >
            List your property
          </a>
          <Link href={accountHref} className={`${styles.outlineBtn} ${styles.hideOnMobile}`} onClick={closeMenu}>
            <UserIcon /> {accountLabel}
          </Link>
          <a href={`tel:${CONTACT_PHONE}`} className={styles.blackBtn} aria-label="Call IvStay">
            <PhoneIcon /> <span className={styles.callLabel}>Call Now</span>
          </a>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.menuButton}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Dropdown menu (narrow screens) */}
      {menuOpen && (
        <nav id="mobile-menu" className={styles.mobileMenu} aria-label="Mobile">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={styles.mobileLink} onClick={closeMenu}>
              {label}
            </Link>
          ))}
          <a
            href={LIST_PROPERTY_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileLink}
            onClick={closeMenu}
          >
            List your property
          </a>
          <Link href={accountHref} className={styles.mobileLink} onClick={closeMenu}>
            {user ? 'My account' : 'Sign In'}
          </Link>
        </nav>
      )}
    </header>
  );
};
