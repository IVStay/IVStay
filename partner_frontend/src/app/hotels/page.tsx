import Image from 'next/image';
import Link from 'next/link';
import { useProperties } from '@src/context/PropertyContext';
import { stayPath } from '@src/lib/links';

export default function Hotels() {
  const { properties } = useProperties();
  const activeHotels = properties.filter(p => p.status === 'active' && p.category === 'hotels');

  return (
    <main style={{ minHeight: '60vh', paddingTop: 'var(--space-12)', paddingBottom: 'var(--space-12)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', marginBottom: 'var(--space-4)' }}>Hotels & Resorts</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Discover premium hotels and resorts for your perfect getaway.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {activeHotels.map((hotel) => (
            <div key={hotel.id} style={{ border: '1px solid #eaeaea', borderRadius: 'var(--radius-lg)', overflow: 'hidden', backgroundColor: 'var(--color-white)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ position: 'relative', height: '250px', width: '100%' }}>
                <Image src={hotel.images[0] || 'https://images.unsplash.com/photo-1542314831-c6a4d14d8376?auto=format&fit=crop&w=800&q=80'} alt={hotel.title} fill style={{ objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: '16px', left: '16px', backgroundColor: 'var(--color-white)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  HOTEL
                </div>
              </div>
              <div style={{ padding: 'var(--space-4)' }}>
                <Link href={stayPath(hotel)} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)', cursor: 'pointer' }}>{hotel.title}</h3>
                </Link>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-3)' }}>
                  <p>📍 {hotel.city}, {hotel.state}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #eaeaea', paddingTop: 'var(--space-3)' }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {hotel.bedrooms != null && <div>🛏️ {hotel.bedrooms} BR</div>}
                    <div>👥 Up to {hotel.max_guests} Guests</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>₹{hotel.price_per_night.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ night</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
