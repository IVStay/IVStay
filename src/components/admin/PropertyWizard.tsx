import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';
import {
  CancellationPolicy,
  Property,
  PropertyCategory,
  PropertyInput,
  PropertyPhoto,
  PropertyStatus,
  PropertyType,
} from '../../types';
import { Button } from '../ui/Button';
import { Check, ChevronRight, ChevronLeft, UploadCloud, CheckCircle, Trash2, Star, Link2, Plus, X } from 'lucide-react';

interface PropertyWizardProps {
  existingProperty?: Property;
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // matches the storage bucket limit

const COMMON_AMENITIES = [
  'Free Wi-Fi',
  'Air Conditioning & Heating',
  'Fully Equipped Kitchen',
  'Private Pool',
  'Mountain View',
  'Valley View',
  'Sea View',
  'Garden',
  'Dedicated Caretaker',
  'Private Chef Available',
  'Daily Housekeeping',
  'Power Backup',
  'Free Parking',
  'Bonfire / BBQ setup available',
  'Outdoor Dining Area',
  'Television',
  'Indoor Games',
  'Pet Friendly',
  'Hot Tub / Jacuzzi',
  'EV Charger',
  'In-house Restaurant',
  'Room Service',
  'Laundry Service',
  '24/7 Front Desk',
  'Conference Hall',
];

/** Number fields are kept as text while editing so they can be empty. */
interface FormState {
  title: string;
  tagline: string;
  description: string;
  category: PropertyCategory;
  property_type: PropertyType;
  host_name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  latitude: string;
  longitude: string;
  max_guests: string;
  base_guests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  price_per_night: string;
  weekend_surge_price: string;
  extra_guest_fee: string;
  cleaning_fee: string;
  service_fee_pct: string;
  min_nights: string;
  cancellation_policy: CancellationPolicy;
  amenities: string[];
  photos: PropertyPhoto[];
  status: PropertyStatus;
  is_verified: boolean;
  is_featured: boolean;
}

const text = (value: number | null | undefined) => (value == null ? '' : String(value));

function initialForm(p?: Property): FormState {
  return {
    title: p?.title ?? '',
    tagline: p?.tagline ?? '',
    description: p?.description ?? '',
    category: p?.category ?? 'bnbs_and_villas',
    property_type: p?.property_type ?? 'villa',
    host_name: p?.host_name ?? '',
    address: p?.address ?? '',
    city: p?.city ?? '',
    state: p?.state ?? '',
    zip_code: p?.zip_code ?? '',
    latitude: text(p?.latitude),
    longitude: text(p?.longitude),
    max_guests: text(p?.max_guests ?? 2),
    base_guests: text(p?.base_guests ?? 2),
    bedrooms: text(p?.bedrooms),
    beds: text(p?.beds),
    bathrooms: text(p?.bathrooms),
    price_per_night: text(p?.price_per_night),
    weekend_surge_price: text(p?.weekend_surge_price),
    extra_guest_fee: text(p?.extra_guest_fee ?? 0),
    cleaning_fee: text(p?.cleaning_fee ?? 0),
    service_fee_pct: text(p?.service_fee_pct ?? 0),
    min_nights: text(p?.min_nights ?? 1),
    cancellation_policy: p?.cancellation_policy ?? 'Flexible',
    amenities: p?.amenities ?? [],
    photos: p?.photos ?? [],
    status: p?.status ?? 'draft',
    is_verified: p?.is_verified ?? false,
    is_featured: p?.is_featured ?? false,
  };
}

const steps = [
  { num: 1, label: 'General Info' },
  { num: 2, label: 'Location' },
  { num: 3, label: 'Capacity' },
  { num: 4, label: 'Pricing & Policies' },
  { num: 5, label: 'Amenities' },
  { num: 6, label: 'Photos' },
  { num: 7, label: 'Publishing' },
];

const inputClass =
  'w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-brand-gold';
const labelClass = 'block text-xs font-bold text-slate-300 mb-1';
const hintClass = 'text-[10px] text-slate-500 mt-1';

/** Checks the form and builds what gets saved. Returns problems with the step to fix them on. */
function validate(form: FormState): { input?: PropertyInput; problems: { step: number; message: string }[] } {
  const problems: { step: number; message: string }[] = [];
  const num = (value: string) => (value.trim() === '' ? null : Number(value));
  const whole = (value: string) => {
    const n = num(value);
    return n == null || !Number.isFinite(n) ? null : Math.round(n);
  };

  if (form.title.trim().length < 2) problems.push({ step: 1, message: 'Add a title (at least 2 characters).' });
  if (!form.city.trim()) problems.push({ step: 2, message: 'Add the city or town.' });

  const latitude = num(form.latitude);
  const longitude = num(form.longitude);
  if (latitude != null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
    problems.push({ step: 2, message: 'Latitude must be between -90 and 90.' });
  }
  if (longitude != null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
    problems.push({ step: 2, message: 'Longitude must be between -180 and 180.' });
  }

  const maxGuests = whole(form.max_guests);
  const baseGuests = whole(form.base_guests);
  if (!maxGuests || maxGuests < 1) problems.push({ step: 3, message: 'Max guests must be at least 1.' });
  if (!baseGuests || baseGuests < 1) problems.push({ step: 3, message: 'Guests included in the price must be at least 1.' });
  if (maxGuests && baseGuests && baseGuests > maxGuests) {
    problems.push({ step: 3, message: 'Guests included in the price can\'t be more than max guests.' });
  }
  for (const [field, label] of [
    ['bedrooms', 'Bedrooms'],
    ['beds', 'Beds'],
    ['bathrooms', 'Bathrooms'],
  ] as const) {
    const n = num(form[field]);
    if (n != null && (!Number.isFinite(n) || n < 0)) problems.push({ step: 3, message: `${label} can't be negative.` });
  }

  const price = num(form.price_per_night);
  if (price == null || !Number.isFinite(price) || price <= 0) {
    problems.push({ step: 4, message: 'Add the nightly price.' });
  }
  const serviceFee = num(form.service_fee_pct) ?? 0;
  if (!Number.isFinite(serviceFee) || serviceFee < 0 || serviceFee > 100) {
    problems.push({ step: 4, message: 'The service fee must be between 0% and 100%.' });
  }
  const minNights = whole(form.min_nights) ?? 1;
  if (minNights < 1) problems.push({ step: 4, message: 'Minimum stay must be at least 1 night.' });
  for (const [field, label] of [
    ['weekend_surge_price', 'Weekend price'],
    ['extra_guest_fee', 'Extra guest fee'],
    ['cleaning_fee', 'Cleaning fee'],
  ] as const) {
    const n = num(form[field]);
    if (n != null && (!Number.isFinite(n) || n < 0)) problems.push({ step: 4, message: `${label} can't be negative.` });
  }

  if (form.status === 'active' && form.photos.length === 0) {
    problems.push({ step: 6, message: 'Add at least one photo before publishing.' });
  }

  if (problems.length) return { problems };

  return {
    problems,
    input: {
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      category: form.category,
      property_type: form.property_type,
      host_name: form.host_name.trim() || null,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zip_code: form.zip_code.trim() || null,
      latitude,
      longitude,
      max_guests: maxGuests!,
      base_guests: baseGuests!,
      bedrooms: whole(form.bedrooms),
      beds: whole(form.beds),
      bathrooms: num(form.bathrooms),
      price_per_night: price!,
      weekend_surge_price: num(form.weekend_surge_price) || null,
      extra_guest_fee: num(form.extra_guest_fee) ?? 0,
      cleaning_fee: num(form.cleaning_fee) ?? 0,
      service_fee_pct: serviceFee,
      min_nights: minNights,
      cancellation_policy: form.cancellation_policy,
      amenities: form.amenities,
      photos: form.photos,
      status: form.status,
      is_verified: form.is_verified,
      is_featured: form.is_featured,
    },
  };
}

export const PropertyWizard: React.FC<PropertyWizardProps> = ({ existingProperty }) => {
  const navigate = useNavigate();
  const { saveProperty, uploadPhoto, source } = useProperties();
  const { showSuccess, showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState<FormState>(() => initialForm(existingProperty));
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState<{ step: number; message: string }[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleAmenity = (item: string) =>
    set('amenities', form.amenities.includes(item) ? form.amenities.filter((a) => a !== item) : [...form.amenities, item]);

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (value && !form.amenities.includes(value)) set('amenities', [...form.amenities, value]);
    setCustomAmenity('');
  };

  const addPhotoLink = () => {
    const url = newPhotoUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      showError('Not a link', 'Paste a full image address starting with https://');
      return;
    }
    set('photos', [...form.photos, { external_url: url, url, alt_text: '' }]);
    setNewPhotoUrl('');
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(list.length);
    for (const file of list) {
      if (!file.type.startsWith('image/')) {
        showError('Not an image', `${file.name} isn't an image file.`);
      } else if (file.size > MAX_PHOTO_BYTES) {
        showError('Photo too large', `${file.name} is over 10 MB. Please resize it and try again.`);
      } else {
        try {
          const photo = await uploadPhoto(file);
          setForm((prev) => ({ ...prev, photos: [...prev.photos, { ...photo, alt_text: prev.title }] }));
        } catch (error) {
          showError('Upload failed', error instanceof Error ? error.message : String(error));
        }
      }
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const removePhoto = (index: number) => set('photos', form.photos.filter((_, i) => i !== index));

  const makeCover = (index: number) => {
    const photos = [...form.photos];
    const [chosen] = photos.splice(index, 1);
    set('photos', [chosen, ...photos]);
  };

  const handleSave = async () => {
    const result = validate(form);
    setProblems(result.problems);
    if (!result.input) {
      setCurrentStep(result.problems[0].step);
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProperty(result.input, existingProperty?.id);
      showSuccess(
        existingProperty ? 'Stay updated' : 'Stay created',
        saved.status === 'active' ? `${saved.title} is live on the site` : `${saved.title} is saved as ${saved.status}`
      );
      navigate('/admin/properties');
    } catch (error) {
      showError('Could not save', error instanceof Error ? error.message : String(error));
    } finally {
      setSaving(false);
    }
  };

  const numberInput = (key: keyof FormState, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      type="number"
      inputMode="decimal"
      value={form[key] as string}
      onChange={(e) => set(key, e.target.value as never)}
      className={inputClass}
      {...props}
    />
  );

  const customAmenities = form.amenities.filter((a) => !COMMON_AMENITIES.includes(a));
  const stepProblems = problems.filter((p) => p.step === currentStep);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step indicator */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-bold text-white">
            {existingProperty ? `Edit: ${existingProperty.title}` : 'Add a new stay'}
          </h2>
          <span className="text-xs font-bold text-brand-gold bg-amber-500/10 px-3 py-1 rounded-full shrink-0">
            Step {currentStep} of {steps.length}
          </span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {steps.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`h-2 rounded-full transition-all ${
                problems.some((p) => p.step === s.num)
                  ? 'bg-rose-500'
                  : s.num <= currentStep
                  ? 'bg-brand-gold shadow-gold-glow'
                  : 'bg-slate-800'
              }`}
              title={s.label}
              aria-label={`Go to step ${s.num}: ${s.label}`}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 font-semibold">{steps[currentStep - 1].label}</p>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        {stepProblems.length > 0 && (
          <ul role="alert" className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200 space-y-1">
            {stepProblems.map((p) => (
              <li key={p.message}>• {p.message}</li>
            ))}
          </ul>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="wiz-title">Title *</label>
              <input id="wiz-title" type="text" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Pinewood Manor in Kasauli" className={inputClass} />
              <p className={hintClass}>The page address is made from the title when the stay is first saved, and then stays the same.</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-tagline">Tagline</label>
              <input id="wiz-tagline" type="text" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. Mountain views and a quiet garden" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-category">Category</label>
                <select id="wiz-category" value={form.category} onChange={(e) => set('category', e.target.value as PropertyCategory)} className={inputClass}>
                  <option value="bnbs_and_villas">BnBs & Villas</option>
                  <option value="hotels">Hotels</option>
                  <option value="home_stays">Home Stays</option>
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-type">Property type</label>
                <select id="wiz-type" value={form.property_type} onChange={(e) => set('property_type', e.target.value as PropertyType)} className={inputClass}>
                  <option value="villa">Private Villa</option>
                  <option value="bnb">Boutique BnB</option>
                  <option value="hotel">Hotel</option>
                  <option value="resort">Resort</option>
                  <option value="home_stay">Home Stay</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-description">Description</label>
              <textarea id="wiz-description" rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What makes this stay special: the views, the rooms, what's nearby." className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-host">Host name</label>
              <input id="wiz-host" type="text" value={form.host_name} onChange={(e) => set('host_name', e.target.value)} placeholder="Optional. Shown as “Hosted by …”" className={inputClass} />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass} htmlFor="wiz-address">Street address</label>
              <input id="wiz-address" type="text" value={form.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-city">City or town *</label>
                <input id="wiz-city" type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Kasauli" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-state">State</label>
                <input id="wiz-state" type="text" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Himachal Pradesh" className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-pin">PIN code</label>
                <input id="wiz-pin" type="text" value={form.zip_code} onChange={(e) => set('zip_code', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-lat">Latitude</label>
                {numberInput('latitude', { id: 'wiz-lat', step: '0.0001', placeholder: 'Optional' })}
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-lng">Longitude</label>
                {numberInput('longitude', { id: 'wiz-lng', step: '0.0001', placeholder: 'Optional' })}
              </div>
            </div>
            <p className={hintClass}>Coordinates are optional; they're for a map view later.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelClass} htmlFor="wiz-max">Max guests *</label>
              {numberInput('max_guests', { id: 'wiz-max', min: 1, step: 1 })}
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-base">Guests included in the price *</label>
              {numberInput('base_guests', { id: 'wiz-base', min: 1, step: 1 })}
              <p className={hintClass}>Guests above this pay the extra-guest fee (step 4).</p>
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-bedrooms">Bedrooms</label>
              {numberInput('bedrooms', { id: 'wiz-bedrooms', min: 0, step: 1, placeholder: 'Not specified' })}
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-beds">Beds</label>
              {numberInput('beds', { id: 'wiz-beds', min: 0, step: 1, placeholder: 'Not specified' })}
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-baths">Bathrooms</label>
              {numberInput('bathrooms', { id: 'wiz-baths', min: 0, step: 0.5, placeholder: 'Not specified' })}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-price">Nightly price (₹) *</label>
                {numberInput('price_per_night', { id: 'wiz-price', min: 0, step: 1 })}
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-weekend">Friday & Saturday price (₹)</label>
                {numberInput('weekend_surge_price', { id: 'wiz-weekend', min: 0, step: 1, placeholder: 'Same as nightly' })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-extra">Extra guest fee (₹ / night)</label>
                {numberInput('extra_guest_fee', { id: 'wiz-extra', min: 0, step: 1 })}
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-cleaning">Cleaning fee (₹ per stay)</label>
                {numberInput('cleaning_fee', { id: 'wiz-cleaning', min: 0, step: 1 })}
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-service">Service fee (%)</label>
                {numberInput('service_fee_pct', { id: 'wiz-service', min: 0, max: 100, step: 0.5 })}
                <p className={hintClass}>Added to the guest's total.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="wiz-min">Minimum stay (nights)</label>
                {numberInput('min_nights', { id: 'wiz-min', min: 1, step: 1 })}
              </div>
              <div>
                <label className={labelClass} htmlFor="wiz-cancel">Cancellation policy</label>
                <select id="wiz-cancel" value={form.cancellation_policy} onChange={(e) => set('cancellation_policy', e.target.value as CancellationPolicy)} className={inputClass}>
                  <option value="Flexible">Flexible</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Strict">Strict</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <p className={labelClass}>Amenities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {COMMON_AMENITIES.map((amenity) => {
                const checked = form.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    aria-pressed={checked}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors text-left ${
                      checked ? 'bg-amber-500/20 border-brand-gold text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${checked ? 'bg-brand-gold border-brand-gold text-white' : 'border-slate-600'}`}>
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
            <div>
              <label className={labelClass} htmlFor="wiz-amenity">Something else?</label>
              <div className="flex gap-2">
                <input
                  id="wiz-amenity"
                  type="text"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomAmenity();
                    }
                  }}
                  placeholder="e.g. Orchard walks"
                  className={inputClass}
                />
                <Button type="button" variant="gold" size="sm" onClick={addCustomAmenity}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {customAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {customAmenities.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-brand-gold text-amber-300 text-xs font-semibold">
                      {a}
                      <button type="button" onClick={() => toggleAmenity(a)} aria-label={`Remove ${a}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-3">
              <UploadCloud className="w-8 h-8 text-brand-gold mx-auto" />
              <p className="text-xs font-bold text-white">Upload photos (JPG, PNG or WebP, up to 10 MB each)</p>
              {source === 'database' ? (
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={uploading > 0}
                  onChange={(e) => void handleFiles(e.target.files)}
                  aria-label="Upload photos"
                  className="w-full max-w-md mx-auto p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-gold file:text-white hover:file:bg-brand-goldHover"
                />
              ) : (
                <p className="text-[11px] text-slate-400">Uploading needs the Supabase backend (see README). You can paste image links below.</p>
              )}
              {uploading > 0 && <p className="text-[11px] text-amber-300">Uploading {uploading} photo{uploading > 1 ? 's' : ''}…</p>}
              <div className="flex gap-2 max-w-md mx-auto">
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="Or paste an image link (https://…)"
                    className={`${inputClass} pl-9`}
                    aria-label="Image link"
                  />
                </div>
                <Button type="button" onClick={addPhotoLink} variant="gold" size="sm">
                  Add
                </Button>
              </div>
            </div>

            {form.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {form.photos.map((photo, index) => (
                  <div key={`${photo.storage_path ?? photo.url}-${index}`} className="relative group rounded-xl overflow-hidden h-28 border border-slate-700 bg-slate-800">
                    <img src={photo.url} alt={photo.alt_text || `Photo ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 ? (
                      <span className="absolute top-1 left-1 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Cover</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => makeCover(index)}
                        className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      >
                        <Star className="w-3 h-3" /> Make cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label={`Remove photo ${index + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center">No photos yet. The first photo becomes the cover.</p>
            )}
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-2 text-xs text-slate-300">
              <h4 className="font-serif text-lg font-bold text-white">Summary</h4>
              <p>Title: <strong className="text-white">{form.title || 'Untitled'}</strong></p>
              <p>Location: <strong className="text-white">{[form.city, form.state].filter(Boolean).join(', ') || '—'}</strong></p>
              <p>
                Nightly price: <strong className="text-brand-gold">{form.price_per_night ? `₹${Number(form.price_per_night).toLocaleString('en-IN')}` : '—'}</strong>
                {' · '}Sleeps {form.max_guests || '—'} ({form.base_guests || '—'} included)
              </p>
              <p>Photos: {form.photos.length}</p>
            </div>

            <div>
              <p className={labelClass}>Visibility</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {([
                  ['active', 'Live on the site', 'bg-emerald-500/20 border-emerald-500 text-emerald-300'],
                  ['draft', 'Draft (hidden)', 'bg-amber-500/20 border-amber-500 text-amber-300'],
                  ['archived', 'Archived (hidden)', 'bg-slate-700 border-slate-500 text-slate-200'],
                ] as const).map(([value, label, activeClass]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('status', value)}
                    aria-pressed={form.status === value}
                    className={`p-4 rounded-2xl border text-xs font-bold transition-colors ${
                      form.status === value ? activeClass : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.is_verified} onChange={(e) => set('is_verified', e.target.checked)} className="mt-0.5 accent-amber-500" />
                <span>
                  <strong className="text-white">IvStay verified</strong>
                  <span className="block text-slate-500">Tick only once the team has checked this stay. Shows a “Verified” badge.</span>
                </span>
              </label>
              <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} className="mt-0.5 accent-amber-500" />
                <span>
                  <strong className="text-white">Featured</strong>
                  <span className="block text-slate-500">Shows a “Curated Collection” badge on its card.</span>
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <Button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            variant="outline"
            size="sm"
            className="text-white border-slate-700"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {currentStep < steps.length ? (
            <Button type="button" onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))} variant="gold" size="sm">
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handleSave()}
              variant="gold"
              size="sm"
              isLoading={saving}
              disabled={uploading > 0}
              className="shadow-gold-glow"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              {form.status === 'active' ? 'Save and publish' : 'Save'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
