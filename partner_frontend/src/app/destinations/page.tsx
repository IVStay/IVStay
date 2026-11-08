import styles from '../page.module.css';
import { FeaturedVillas } from '@/components/home/FeaturedVillas/FeaturedVillas';

export default function Destinations() {
  return (
    <main className={styles.main}>
      <section className="container">
        <h1 style={{ fontSize: '3rem', margin: '2rem 0', fontFamily: 'var(--font-serif)' }}>Destinations</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
          Explore our complete collection of luxury villas across the globe.
        </p>
        
        {/* Reusing the FeaturedVillas component as a placeholder for the grid */}
        <FeaturedVillas initialFilter="all" />
      </section>
    </main>
  );
}
