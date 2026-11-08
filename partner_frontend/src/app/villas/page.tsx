import { FeaturedVillas } from '@/components/home/FeaturedVillas/FeaturedVillas';

export default function Villas() {
  return (
    <main style={{ minHeight: '60vh', paddingTop: 'var(--space-12)' }}>
      <FeaturedVillas initialFilter="villas" showFilters={false} />
    </main>
  );
}
