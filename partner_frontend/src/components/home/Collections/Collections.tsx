import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Collections.module.css';
import { useProperties } from '@src/context/PropertyContext';
import type { Property } from '@src/types';

const FALLBACK = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop';

interface Collection {
  title: string;
  subtitle: string;
  href: string;
  match: (p: Property) => boolean;
}

// Shortcuts into the stays list. A collection only shows when it has at least one live stay.
const COLLECTIONS: Collection[] = [
  {
    title: 'Villas & BnBs',
    subtitle: 'A whole place to yourselves',
    href: '/stays?category=bnbs_and_villas',
    match: (p) => p.category === 'bnbs_and_villas',
  },
  {
    title: 'Big group getaways',
    subtitle: 'Room for 8 or more',
    href: '/stays?guests=8',
    match: (p) => p.max_guests >= 8,
  },
  {
    title: 'Hotels & Resorts',
    subtitle: 'Service, without the fuss',
    href: '/stays?category=hotels',
    match: (p) => p.category === 'hotels',
  },
  {
    title: 'Home stays',
    subtitle: 'Live like a local',
    href: '/stays?category=home_stays',
    match: (p) => p.category === 'home_stays',
  },
];

export const Collections = () => {
  const { properties } = useProperties();
  const live = properties.filter((p) => p.status === 'active');
  const used = new Set<string>();

  const cards = COLLECTIONS.map((c) => {
    const stays = live.filter(c.match);
    // Prefer a photo not already used by another card
    const cover = stays.find((p) => p.images[0] && !used.has(p.images[0]))?.images[0] ?? stays[0]?.images[0];
    if (cover) used.add(cover);
    return { ...c, count: stays.length, image: cover || FALLBACK };
  })
    .filter((c) => c.count > 0)
    .slice(0, 3);

  if (cards.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Find your kind of stay</h2>
          <p className={styles.subtitle}>Hand-picked homes for every type of getaway.</p>
        </div>

        <div className={styles.grid}>
          {cards.map((card) => (
            <Link key={card.title} href={card.href} className={styles.card} aria-label={`${card.title}: ${card.count} stays`}>
              <Image src={card.image} alt="" fill className={styles.image} />
              <div className={styles.overlay}>
                <div>
                  <h3 className={styles.cardTitle}>{card.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', marginTop: '4px' }}>
                    {card.subtitle} · {card.count} {card.count === 1 ? 'stay' : 'stays'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
