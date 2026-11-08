import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FilterState, Property, PropertyInput, PropertyPhoto } from '../types';
import { MOCK_PROPERTIES } from '../data/mockData';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';
import { useAuth } from './AuthContext';

const PROPERTIES_STORAGE_KEY = 'ivstay_properties_list';
const WISHLIST_STORAGE_KEY = 'ivstay_user_wishlist';

/**
 * Where listings live: the Supabase database, or, when the site has no Supabase settings,
 * this browser's storage (handy for local development without a backend).
 */
export type DataSource = 'database' | 'browser';
export const dataSource: DataSource = supabase ? 'database' : 'browser';

const initialFilterState: FilterState = {
  category: 'all',
  destination: '',
  checkIn: null,
  checkOut: null,
  guests: 1,
  priceRange: [0, Number.MAX_SAFE_INTEGER], // no upper limit by default
  bedrooms: 0,
  bathrooms: 0,
  amenities: [],
  instantBookOnly: false,
};

interface PropertyContextType {
  source: DataSource;
  properties: Property[];
  /** True until the first load finishes */
  loading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  wishlistIds: string[];
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  toggleWishlist: (propertyId: string) => void;
  isWishlisted: (propertyId: string) => boolean;
  /** Creates a stay, or updates it when existingId is given. Throws an Error with a readable message. */
  saveProperty: (input: PropertyInput, existingId?: string) => Promise<Property>;
  setPropertyStatus: (id: string, status: Property['status']) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  /** Uploads a photo to storage (database mode only). */
  uploadPhoto: (file: File) => Promise<PropertyPhoto>;
  /** Finds a stay by its id or its URL slug. */
  getPropertyById: (idOrSlug: string) => Property | undefined;
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Browser-storage mode helpers
// ---------------------------------------------------------------------------

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'stay';

/** Fills in fields that older saved listings don't have. */
function normalizeLocalProperty(raw: Partial<Property> & { id: string; title: string }): Property {
  const photos: PropertyPhoto[] =
    raw.photos ?? (raw.images ?? []).map((url) => ({ external_url: url, url, alt_text: '' }));
  const maxGuests = raw.max_guests ?? 2;
  return {
    slug: raw.slug || `${slugify(raw.title)}-${raw.id.slice(-6)}`,
    tagline: '',
    description: '',
    category: 'bnbs_and_villas',
    property_type: 'villa',
    address: '',
    city: '',
    state: '',
    zip_code: null,
    price_per_night: 0,
    weekend_surge_price: null,
    cleaning_fee: 0,
    service_fee_pct: 0,
    extra_guest_fee: 0,
    min_nights: 1,
    cancellation_policy: 'Flexible',
    bedrooms: null,
    beds: null,
    bathrooms: null,
    amenities: [],
    status: 'draft',
    is_verified: false,
    is_featured: false,
    rating: 0,
    review_count: 0,
    created_at: new Date().toISOString(),
    ...raw,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
    max_guests: maxGuests,
    base_guests: raw.base_guests ?? Math.min(2, maxGuests),
    photos,
    images: photos.map((p) => p.url).filter(Boolean),
  };
}

function readLocalProperties(): Property[] {
  try {
    const saved = localStorage.getItem(PROPERTIES_STORAGE_KEY);
    const list = saved ? (JSON.parse(saved) as Array<Partial<Property> & { id: string; title: string }>) : MOCK_PROPERTIES;
    return list.map(normalizeLocalProperty);
  } catch {
    return MOCK_PROPERTIES;
  }
}

// ---------------------------------------------------------------------------

export const PropertyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>(() =>
    dataSource === 'browser' ? readLocalProperties() : []
  );
  const [loading, setLoading] = useState(dataSource === 'database');
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadRun = useRef(0);

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);

  // Browser mode keeps listings in local storage
  useEffect(() => {
    if (dataSource !== 'browser') return;
    try {
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(properties));
    } catch {
      /* storage full or unavailable */
    }
  }, [properties]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      /* storage unavailable */
    }
  }, [wishlistIds]);

  const reload = useCallback(async () => {
    if (dataSource !== 'database') return;
    const run = ++loadRun.current;
    try {
      const list = await db.fetchProperties();
      if (run !== loadRun.current) return;
      setProperties(list);
      setLoadError(null);
    } catch (error) {
      if (run !== loadRun.current) return;
      setLoadError(db.describeError(error));
    } finally {
      if (run === loadRun.current) setLoading(false);
    }
  }, []);

  // Load once the saved sign-in is restored, and again when admin access changes
  // (admins also see drafts and archived stays).
  useEffect(() => {
    if (dataSource === 'database' && !authLoading) void reload();
  }, [isAdmin, authLoading, reload]);

  const resetFilters = useCallback(() => setFilterState(initialFilterState), []);

  const toggleWishlist = useCallback((propertyId: string) => {
    setWishlistIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  }, []);

  const isWishlisted = useCallback((propertyId: string) => wishlistIds.includes(propertyId), [wishlistIds]);

  const getPropertyById = useCallback(
    (idOrSlug: string) => properties.find((p) => p.id === idOrSlug || p.slug === idOrSlug),
    [properties]
  );

  const saveProperty = useCallback(
    async (input: PropertyInput, existingId?: string): Promise<Property> => {
      if (dataSource === 'database') {
        try {
          const saved = await db.saveProperty(input, existingId);
          setProperties((prev) =>
            existingId ? prev.map((p) => (p.id === existingId ? saved : p)) : [saved, ...prev]
          );
          return saved;
        } catch (error) {
          throw db.friendlyError(error);
        }
      }

      const existing = existingId ? properties.find((p) => p.id === existingId) : undefined;
      const id = existing?.id ?? `prop-${Date.now()}`;
      const saved = normalizeLocalProperty({
        ...existing,
        ...input,
        id,
        slug: existing?.slug ?? `${slugify(input.title)}-${id.slice(-6)}`,
        rating: existing?.rating ?? 0,
        review_count: existing?.review_count ?? 0,
        created_at: existing?.created_at ?? new Date().toISOString(),
      });
      setProperties((prev) => (existing ? prev.map((p) => (p.id === id ? saved : p)) : [saved, ...prev]));
      return saved;
    },
    [properties]
  );

  const setPropertyStatus = useCallback(async (id: string, status: Property['status']) => {
    if (dataSource === 'database') {
      try {
        await db.updatePropertyFields(id, { status });
      } catch (error) {
        throw db.friendlyError(error);
      }
    }
    setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const deleteProperty = useCallback(async (id: string) => {
    if (dataSource === 'database') {
      try {
        await db.deleteProperty(id);
      } catch (error) {
        throw db.friendlyError(error);
      }
    }
    setProperties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    if (dataSource !== 'database') {
      throw new Error('Photo upload needs the Supabase backend. Paste an image link instead.');
    }
    try {
      return await db.uploadPhoto(file);
    } catch (error) {
      throw db.friendlyError(error);
    }
  }, []);

  const value = useMemo<PropertyContextType>(
    () => ({
      source: dataSource,
      properties,
      loading,
      loadError,
      reload,
      wishlistIds,
      filterState,
      setFilterState,
      resetFilters,
      toggleWishlist,
      isWishlisted,
      saveProperty,
      setPropertyStatus,
      deleteProperty,
      uploadPhoto,
      getPropertyById,
    }),
    [
      properties,
      loading,
      loadError,
      reload,
      wishlistIds,
      filterState,
      resetFilters,
      toggleWishlist,
      isWishlisted,
      saveProperty,
      setPropertyStatus,
      deleteProperty,
      uploadPhoto,
      getPropertyById,
    ]
  );

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
};

export const useProperties = () => {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperties must be used within a PropertyProvider');
  }
  return context;
};
