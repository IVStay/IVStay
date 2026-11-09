"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import styles from './FeaturedVillas.module.css';
import { Carousel } from '@/components/ui/Carousel/Carousel';

import { useProperties } from '@src/context/PropertyContext';
import { formatINR } from '@src/utils/currency';
import { stayPath } from '@src/lib/links';

type StayFilter = 'villas' | 'hotels' | 'all';

const FILTERS: { key: StayFilter; label: string }[] = [
  { key: 'villas', label: 'Villas' },
  { key: 'hotels', label: 'Hotels / Resorts' },
  { key: 'all', label: 'All Stays' },
];

interface FeaturedVillasProps {
  /** Tab selected on first render */
  initialFilter?: StayFilter;
  /** Hide the tabs to lock the grid to `initialFilter` (e.g. on /villas) */
  showFilters?: boolean;
}

export const FeaturedVillas = ({ initialFilter = 'villas', showFilters = true }: FeaturedVillasProps) => {
  const { properties, loading, isWishlisted, toggleWishlist } = useProperties();
  const [filter, setFilter] = useState<StayFilter>(initialFilter);

  const cities = [...new Set(properties.filter((p) => p.status === 'active').map((p) => p.city))];

  const activeStays = properties.filter((p) => {
    if (p.status !== 'active') return false;
    if (filter === 'hotels') return p.category === 'hotels';
    if (filter === 'villas') return p.category !== 'hotels';
    return true;
  });

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>A few houses we love</h2>
          <p className={styles.subtitle}>
            {cities.length
              ? `Hand-picked stays in ${cities.length === 1 ? cities[0] : `${cities.slice(0, -1).join(', ')} and ${cities[cities.length - 1]}`}, from private villas to small boutique hotels. Each one chosen for the way it makes a weekend feel.`
              : 'Hand-picked villas, BnBs and boutique hotels, each one chosen for the way it makes a weekend feel.'}
          </p>

          {showFilters && (
            <div className={styles.filters} role="tablist" aria-label="Filter stays">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`${styles.filterBtn} ${filter === key ? styles.active : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeStays.length === 0 ? (
          <p className={styles.subtitle} style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
            {loading ? 'Loading stays…' : 'No stays listed here yet. Please check back soon.'}
          </p>
        ) : (
          <div className={styles.grid}>
            {activeStays.map((villa) => {
              const saved = isWishlisted(villa.id);
              return (
                <div key={villa.id} className={styles.card}>
                  <div className={styles.imageWrapper}>
                    <div className={styles.cardBadges}>
                      <div className={`${styles.badge} ${styles.base}`}>{villa.category === 'hotels' ? 'HOTEL' : 'VILLA'}</div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={saved ? 'Remove from favorites' : 'Save to favorites'}
                        aria-pressed={saved}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlist(villa.id);
                        }}
                      >
                        {saved ? '♥' : '♡'}
                      </button>
                    </div>
                    <Carousel images={villa.images} alt={villa.title} />
                  </div>

                  <div className={styles.cardInfo}>
                    <div className={styles.cardHeader}>
                      <Link href={stayPath(villa)} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h3 className={styles.propertyName} style={{ cursor: 'pointer' }}>{villa.title}</h3>
                      </Link>
                      {villa.bedrooms != null && <div className={styles.propertyBedrooms}>🛏️ {villa.bedrooms} BR</div>}
                    </div>
                    <div className={styles.cardHeader} style={{ alignItems: 'flex-end' }}>
                      <div>
                        <p className={styles.propertyLocation}>{villa.city}, {villa.state}</p>
                        <p className={styles.propertyPrice} style={{ fontWeight: 'bold', marginTop: '4px', fontSize: '1.1rem' }}>{formatINR(villa.price_per_night)} <span style={{fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-secondary)'}}>/ night</span></p>
                      </div>
                      <div className={styles.propertyOccupancy}>
                        <span>👥 Max Occupancy: {villa.max_guests}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
