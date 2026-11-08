import React, { createContext, useContext, useState, useEffect } from 'react';
import { Property, FilterState } from '../types';
import { MOCK_PROPERTIES } from '../data/mockData';

const PROPERTIES_STORAGE_KEY = 'ivstay_properties_list';
const WISHLIST_STORAGE_KEY = 'ivstay_user_wishlist';

const initialFilterState: FilterState = {
  category: 'all',
  destination: '',
  checkIn: null,
  checkOut: null,
  guests: 1,
  priceRange: [0, 5000],
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  instantBookOnly: false,
};

interface PropertyContextType {
  properties: Property[];
  wishlistIds: string[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  toggleWishlist: (propertyId: string) => void;
  isWishlisted: (propertyId: string) => boolean;
  addProperty: (property: Omit<Property, 'id' | 'created_at' | 'rating' | 'review_count'>) => Property;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  blockPropertyDates: (id: string, dates: string[]) => void;
  getPropertyById: (id: string) => Property | undefined;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [properties, setProperties] = useState<Property[]>(() => {
    try {
      const saved = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_PROPERTIES;
    } catch {
      return MOCK_PROPERTIES;
    }
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : ['prop-villa-1', 'prop-villa-3'];
    } catch {
      return ['prop-villa-1', 'prop-villa-3'];
    }
  });

  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);

  useEffect(() => {
    localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  const resetFilters = () => {
    setFilterState(initialFilterState);
  };

  const toggleWishlist = (propertyId: string) => {
    setWishlistIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const isWishlisted = (propertyId: string) => wishlistIds.includes(propertyId);

  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  const addProperty = (
    data: Omit<Property, 'id' | 'created_at' | 'rating' | 'review_count'>
  ): Property => {
    const newProperty: Property = {
      ...data,
      id: 'prop-' + Date.now(),
      rating: 5.0,
      review_count: 1,
      created_at: new Date().toISOString(),
    };
    setProperties((prev) => [newProperty, ...prev]);
    return newProperty;
  };

  const updateProperty = (id: string, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const blockPropertyDates = (id: string, dates: string[]) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const existing = p.blocked_dates || [];
          const updated = Array.from(new Set([...existing, ...dates]));
          return { ...p, blocked_dates: updated };
        }
        return p;
      })
    );
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        wishlistIds,
        filterState,
        setFilterState,
        resetFilters,
        toggleWishlist,
        isWishlisted,
        addProperty,
        updateProperty,
        deleteProperty,
        blockPropertyDates,
        getPropertyById,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
};
