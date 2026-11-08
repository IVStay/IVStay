import React from 'react';
import { Waves, Umbrella, Landmark, Mountain, Crown, Sparkles, Building2, Flame } from 'lucide-react';
import { useProperties } from '../../context/PropertyContext';

export const CategoryFilterBar: React.FC = () => {
  const { filterState, setFilterState } = useProperties();

  const categories = [
    { id: 'all', label: 'All Stays', icon: Sparkles },
    { id: 'bnbs_and_villas', label: 'Villas & BnBs', icon: Crown },
    { id: 'hotels', label: 'Boutique Hotels', icon: Building2 },
    { id: 'home_stays', label: 'Home Stays', icon: Building2 },
    { id: 'Private Pool', label: 'Private Pools', icon: Waves },
    { id: 'Beachfront', label: 'Beachfront', icon: Umbrella },
    { id: 'Heritage', label: 'Heritage BnBs', icon: Landmark },
    { id: 'Mountain', label: 'Mountain Views', icon: Mountain },
    { id: 'Luxury Estate', label: 'Luxury Estates', icon: Flame },
  ];

  const handlePillClick = (id: string) => {
    if (id === 'all' || id === 'bnbs_and_villas' || id === 'hotels' || id === 'home_stays') {
      setFilterState((prev) => ({
        ...prev,
        category: id as 'all' | 'bnbs_and_villas' | 'hotels' | 'home_stays',
      }));
    } else {
      setFilterState((prev) => {
        const hasAmenity = prev.amenities.includes(id);
        const newAmenities = hasAmenity
          ? prev.amenities.filter((a) => a !== id)
          : [...prev.amenities, id];
        return { ...prev, amenities: newAmenities };
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive =
            cat.id === filterState.category || filterState.amenities.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => handlePillClick(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-brand-slate text-white shadow-md ring-2 ring-brand-gold/40'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-gold' : 'text-slate-500'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
