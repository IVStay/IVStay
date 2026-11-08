import Image from 'next/image';
import Link from 'next/link';

export default async function HotelDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const hotelsDb: Record<string, any> = {
    '1': {
      id: '1',
      name: 'The Ambience Hotel',
      location: 'Waknaghat, Shimla Hills, Himachal Pradesh',
      rooms: 'Multiple Room Types Available',
      baseOccupancy: 2,
      maxOccupancy: 4,
      price: '₹5,999',
      description: "Welcome to The Ambience Hotel, a beautiful retreat nestled in the hills of Waknaghat. Experience unparalleled hospitality, breathtaking views, and modern comforts. Whether you are seeking a peaceful getaway or an adventure in the hills, our hotel offers the perfect setting with luxurious rooms and top-notch facilities.",
      amenities: [
        'Hill View Rooms',
        'Free Wi-Fi',
        'In-house Restaurant',
        'Air Conditioning & Heating',
        'Room Service',
        'Conference Hall',
        'Power Backup',
        'Free Parking',
        'Laundry Service',
        '24/7 Front Desk'
      ],
      images: [
        'https://images.unsplash.com/photo-1542314831-c6a4d14d8376?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=2070&auto=format&fit=crop',
      ]
    }
  };

  const hotel = hotelsDb[resolvedParams.id];

  if (!hotel) {
    return (
      <main style={{ padding: 'var(--space-12) var(--space-4)', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Hotel Details for ID: {resolvedParams.id} coming soon!</h2>
        <Link href="/hotels" style={{ color: 'var(--primary-color)', marginTop: 'var(--space-4)' }}>Back to Hotels</Link>
      </main>
    );
  }

  const whatsappNumber = "919915840484";
  const phoneNumber = "+919915840484";

  return (
    <main style={{ padding: 'var(--space-8) var(--space-4)', maxWidth: '1200px', margin: '0 auto', paddingTop: 'var(--space-12)' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 var(--space-2)', color: 'var(--text-secondary)' }}>/</span>
        <Link href="/hotels" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Hotels</Link>
        <span style={{ margin: '0 var(--space-2)', color: 'var(--text-secondary)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{hotel.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {/* Main Image */}
        <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <Image src={hotel.images[0]} alt={hotel.name} fill style={{ objectFit: 'cover' }} priority />
        </div>
        {/* Sub Images Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
          {hotel.images.slice(1, 3).map((img: string, index: number) => (
             <div key={index} style={{ position: 'relative', width: '100%', height: '30vh', minHeight: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
               <Image src={img} alt={`${hotel.name} - view ${index + 2}`} fill style={{ objectFit: 'cover' }} />
             </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 'var(--space-8)', alignItems: 'start' }}>
        {/* Left Column: Details */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{hotel.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>📍 {hotel.location}</p>
          
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', padding: 'var(--space-4) 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{hotel.rooms}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Rooms</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{hotel.baseOccupancy}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Base Guests</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{hotel.maxOccupancy}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Max Guests</span>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>About this hotel</h2>
            <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>{hotel.description}</p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>Amenities</h2>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', listStyle: 'none', padding: 0 }}>
              {hotel.amenities.map((amenity: string, idx: number) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-primary)' }}>
                  ✅ {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Booking Card */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div style={{ border: '1px solid #eaeaea', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', backgroundColor: '#fff' }}>
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{hotel.price}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>/ night</span>
            </div>
            
            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hi, I would like to book ${hotel.name}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: 'var(--space-4)', backgroundColor: '#25D366', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 'bold', textDecoration: 'none', marginBottom: 'var(--space-3)' }}
            >
              💬 Book Now via WhatsApp
            </a>

            <a 
              href={`tel:${phoneNumber}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: 'var(--space-4)', backgroundColor: 'transparent', border: '1px solid var(--text-primary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontWeight: 'bold', textDecoration: 'none' }}
            >
              📞 Call Now
            </a>

            <div style={{ marginTop: 'var(--space-4)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Contact us to check availability.
            </div>
          </div>
        </div>
      </div>
      
      {/* Required CSS to make it responsive */}
      <style>{`
        @media (max-width: 768px) {
          main > div:nth-child(3) {
            grid-template-columns: 1fr !important;
          }
          main > div:nth-child(3) > div:last-child {
            position: static !important;
            margin-top: var(--space-8);
          }
        }
      `}</style>
    </main>
  );
}
