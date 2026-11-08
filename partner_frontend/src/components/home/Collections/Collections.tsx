import React from 'react';
import Image from 'next/image';
import styles from './Collections.module.css';

const collections = [
  {
    id: 1,
    title: 'Winter Sun',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Ski Chalets',
    image: 'https://images.unsplash.com/photo-1542318859-9b5db24cb0b2?q=80&w=2071&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Coastal Retreats',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop',
  }
];

export const Collections = () => {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Curated Collections</h2>
          <p className={styles.subtitle}>Hand-picked homes for every type of getaway.</p>
        </div>
        
        <div className={styles.grid}>
          {collections.map(collection => (
            <div key={collection.id} className={styles.card}>
              <Image 
                src={collection.image} 
                alt={collection.title}
                fill
                className={styles.image}
              />
              <div className={styles.overlay}>
                <h3 className={styles.cardTitle}>{collection.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
