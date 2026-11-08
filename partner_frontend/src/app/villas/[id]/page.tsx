import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function VillaDetails({ params }: { params: Promise<{ id: string }> }) {
  // We mock the database fetch here for demonstration purposes
  const resolvedParams = await params;
  
  const villasDb: Record<string, any> = {
    '4': {
      id: '4',
      name: 'Pinewood Manor in Kasauli',
      location: 'Solan, Kasauli, Himachal Pradesh',
      bedrooms: '3 BR',
      baseOccupancy: 6,
      maxOccupancy: 10,
      price: '₹8,999',
      description: "Nestled in the serene hills of Kasauli, Pinewood Manor offers breathtaking mountain views and a peaceful retreat from city life. This premium 3-bedroom property features cozy interiors, modern amenities, a beautiful garden, and a dedicated caretaker to ensure a comfortable stay. Wake up to the sound of birds and sip your morning tea on the balcony overlooking the majestic valleys.",
      amenities: [
        'Mountain View',
        'Free Wi-Fi',
        'Air Conditioning & Heating',
        'Fully Equipped Kitchen',
        'Bonfire / BBQ setup available',
        'Dedicated Caretaker',
        'Power Backup',
        'Free Parking',
        'Outdoor Dining Area',
        'Television'
      ],
      images: [
        '/images/pinewood-manor/media_1790249276700.jpg',
        '/images/pinewood-manor/media_1790249386218.jpg',
        '/images/pinewood-manor/media_1790249386258.jpg',
      ]
    },
    '5': {
      id: '5',
      name: 'Pax & Opis Luxury Stays',
      location: 'Mussoorie, Uttarakhand',
      bedrooms: '6 BR',
      baseOccupancy: 12,
      maxOccupancy: 20,
      price: '₹14,999',
      description: "Experience the ultimate luxury at Pax & Opis in the heart of Mussoorie. With 6 spacious bedrooms, this magnificent villa offers a perfect blend of modern comfort and natural beauty. Enjoy panoramic views of the Doon Valley, an expansive terrace, and luxurious living spaces ideal for large families or corporate retreats.",
      amenities: [
        'Valley View',
        'Free Wi-Fi',
        'Air Conditioning & Heating',
        'Fully Equipped Kitchen',
        'Private Chef Available',
        'Dedicated Caretaker',
        'Power Backup',
        'Free Parking',
        'Spacious Terrace',
        'Indoor Games'
      ],
      images: [
        '/images/pax-and-opis/media_1790250925861.jpg',
        '/images/pax-and-opis/media_1790250925882.jpg',
        '/images/pax-and-opis/media_1790250925936.jpg',
        '/images/pax-and-opis/media_1790250925960.jpg',
        '/images/pax-and-opis/media_1790250925967.jpg',
      ]
    }
  };

  const villa = villasDb[resolvedParams.id];

  if (!villa) {
    return (
      <main style={{ padding: 'var(--space-12) var(--space-4)', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Property Details for ID: {resolvedParams.id} coming soon!</h2>
        <Link href="/" style={{ color: 'var(--primary-color)', marginTop: 'var(--space-4)' }}>Go Back Home</Link>
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
        <Link href="/villas" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Villas</Link>
        <span style={{ margin: '0 var(--space-2)', color: 'var(--text-secondary)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{villa.name}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {/* Main Image */}
        <div style={{ position: 'relative', width: '100%', height: '50vh', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <Image src={villa.images[0]} alt={villa.name} fill style={{ objectFit: 'cover' }} priority />
        </div>
        {/* Sub Images Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)' }}>
          {villa.images.slice(1, 3).map((img: string, index: number) => (
             <div key={index} style={{ position: 'relative', width: '100%', height: '30vh', minHeight: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
               <Image src={img} alt={`${villa.name} - view ${index + 2}`} fill style={{ objectFit: 'cover' }} />
             </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: 'var(--space-8)', alignItems: 'start' }}>
        {/* Left Column: Details */}
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>{villa.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 'var(--space-4)' }}>📍 {villa.location}</p>
          
          <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-6)', padding: 'var(--space-4) 0', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{villa.bedrooms}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Bedrooms</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{villa.baseOccupancy}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Base Guests</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{villa.maxOccupancy}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Max Guests</span>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>About this property</h2>
            <p style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>{villa.description}</p>
          </div>

          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>Amenities</h2>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', listStyle: 'none', padding: 0 }}>
              {villa.amenities.map((amenity: string, idx: number) => (
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
              <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{villa.price}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 'var(--space-2)' }}>/ night</span>
            </div>
            
            <a 
              href={`https://wa.me/${whatsappNumber}?text=Hi, I would like to book ${villa.name}`}
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
