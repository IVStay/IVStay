"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Hero.module.css';

import { useProperties } from '@src/context/PropertyContext';
import { stayPath } from '@src/lib/links';

// Shown when no stays are published yet, so the white headline stays readable.
const FALLBACK_HERO_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80';

const localISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const Hero = () => {
  const { properties } = useProperties();
  const bannerProperties = properties.filter(p => p.status === 'active').slice(0, 5);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Guard against the index pointing past the end after stays are removed
  const activeIndex = bannerProperties.length ? currentIndex % bannerProperties.length : 0;
  const activeBanner = bannerProperties[activeIndex];

  useEffect(() => {
    if (bannerProperties.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerProperties.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bannerProperties.length]);

  return (
    <section className={styles.hero}>
      {bannerProperties.length === 0 && (
        <div className={styles.background}>
          <Image src={FALLBACK_HERO_IMAGE} alt="" fill priority className={styles.image} />
        </div>
      )}

      {bannerProperties.map((prop, idx) => (
        <div
          key={prop.id}
          className={styles.background}
          style={{
            opacity: activeIndex === idx ? 1 : 0,
            transition: 'opacity 1.5s ease-in-out',
            zIndex: activeIndex === idx ? -1 : -2,
          }}
        >
          <Image
            src={prop.images[0] || FALLBACK_HERO_IMAGE}
            alt={prop.title}
            fill
            priority={idx === 0}
            className={styles.image}
          />
        </div>
      ))}

      {/* Property Details Overlay */}
      {activeBanner && (
        <div style={{
          position: 'absolute',
          bottom: 'var(--space-8)',
          left: 'var(--space-8)',
          color: 'white',
          zIndex: 5,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          textAlign: 'left'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{activeBanner.title}</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: 'var(--space-4)' }}>{activeBanner.bedrooms != null ? `${activeBanner.bedrooms} bedrooms • ` : ''}{activeBanner.city}</p>
          <Link href={stayPath(activeBanner)} style={{
            padding: 'var(--space-3) var(--space-6)',
            backgroundColor: 'var(--color-white)',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-md)',
            textDecoration: 'none',
            fontWeight: 'bold',
            display: 'inline-block',
            boxShadow: 'var(--shadow-md)'
          }}>
            View Property
          </Link>
        </div>
      )}

      <div className={styles.content}>
        <h1 className={styles.title} style={{ textTransform: 'none', letterSpacing: 'normal' }}>
          Hand-picked villas, BnBs and hotels for your next getaway.
        </h1>

        {/* Plain GET form: submits to /stays?destination=…&checkIn=…&guests=… */}
        <form className={styles.searchWidget} action="/stays" method="get" role="search">
          <div className={styles.searchFieldWrapper}>
            <input
              type="text"
              name="destination"
              placeholder="Where to? e.g. Kasauli"
              aria-label="Destination"
              className={styles.searchField}
            />
          </div>
          <div className={styles.searchFieldWrapper}>
            <input
              type={showDatePicker ? 'date' : 'text'}
              name="checkIn"
              min={localISODate(new Date())}
              placeholder="Add dates"
              aria-label="Check-in date"
              className={styles.searchField}
              onFocus={(e) => {
                setShowDatePicker(true);
                const input = e.currentTarget;
                // Open the native calendar once the field has switched to a date input
                requestAnimationFrame(() => {
                  try {
                    input.showPicker?.();
                  } catch {
                    /* not supported or not allowed: the user can still type or click */
                  }
                });
              }}
              onBlur={(e) => {
                if (!e.currentTarget.value) setShowDatePicker(false);
              }}
            />
          </div>
          <div className={styles.searchFieldWrapper}>
            <input
              type="number"
              name="guests"
              min={1}
              max={50}
              placeholder="Add guests"
              aria-label="Number of guests"
              className={styles.searchField}
            />
          </div>
          <button type="submit" className={styles.searchButton}>Search</button>
        </form>
      </div>
    </section>
  );
};
