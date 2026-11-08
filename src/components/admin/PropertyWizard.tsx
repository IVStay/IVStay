import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';
import { Property, PropertyCategory, PropertyType, PropertyStatus } from '../../types';
import { Button } from '../ui/Button';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Users,
  DollarSign,
  Sparkles,
  UploadCloud,
  CheckCircle,
  Trash2,
  Star,
} from 'lucide-react';

interface PropertyWizardProps {
  existingProperty?: Property;
}

export const PropertyWizard: React.FC<PropertyWizardProps> = ({ existingProperty }) => {
  const navigate = useNavigate();
  const { addProperty, updateProperty } = useProperties();
  const { showSuccess, showError } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Form Step State
  const [title, setTitle] = useState(existingProperty?.title || '');
  const [tagline, setTagline] = useState(existingProperty?.tagline || '');
  const [category, setCategory] = useState<PropertyCategory>(existingProperty?.category || 'bnbs_and_villas');
  const [propertyType, setPropertyType] = useState<PropertyType>(existingProperty?.property_type || 'villa');
  const [description, setDescription] = useState(existingProperty?.description || '');

  // Step 2: Location
  const [address, setAddress] = useState(existingProperty?.address || '');
  const [city, setCity] = useState(existingProperty?.city || '');
  const [state, setState] = useState(existingProperty?.state || '');
  const [zipCode, setZipCode] = useState(existingProperty?.zip_code || '');
  const [lat, setLat] = useState(existingProperty?.latitude || 40.6281);
  const [lng, setLng] = useState(existingProperty?.longitude || 14.485);

  // Step 3: Capacity
  const [maxGuests, setMaxGuests] = useState(existingProperty?.max_guests || 6);
  const [bedrooms, setBedrooms] = useState(existingProperty?.bedrooms || 3);
  const [beds, setBeds] = useState(existingProperty?.beds || 4);
  const [bathrooms, setBathrooms] = useState(existingProperty?.bathrooms || 3);

  // Step 4: Pricing & Policies
  const [pricePerNight, setPricePerNight] = useState(existingProperty?.price_per_night || 950);
  const [weekendSurgePrice, setWeekendSurgePrice] = useState(existingProperty?.weekend_surge_price || 1100);
  const [cleaningFee, setCleaningFee] = useState(existingProperty?.cleaning_fee || 150);
  const [serviceFeePct, setServiceFeePct] = useState(existingProperty?.service_fee_pct || 12);
  const [minNights, setMinNights] = useState(existingProperty?.min_nights || 2);
  const [cancellationPolicy, setCancellationPolicy] = useState<'Flexible' | 'Moderate' | 'Strict'>(
    existingProperty?.cancellation_policy || 'Flexible'
  );

  // Step 5: Amenities
  const availableAmenities = [
    'Private Infinity Pool',
    'Dedicated Chef Service',
    'Sea View Terrace',
    'High-Speed Wi-Fi',
    'Wine Cellar',
    'Air Conditioning',
    'Hot Tub / Jacuzzi',
    'Helipad Access',
    'Daily Housekeeping',
    'EV Charger',
    'Ski-in / Ski-out',
    'Private Beach Lounge',
  ];
  const [amenities, setAmenities] = useState<string[]>(
    existingProperty?.amenities || ['Private Infinity Pool', 'High-Speed Wi-Fi']
  );

  // Step 6: Multi-Media
  const [images, setImages] = useState<string[]>(
    existingProperty?.images || [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
    ]
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Step 7: Status
  const [status, setStatus] = useState<PropertyStatus>(existingProperty?.status || 'active');

  const steps = [
    { num: 1, label: 'General Info' },
    { num: 2, label: 'Location' },
    { num: 3, label: 'Capacity' },
    { num: 4, label: 'Pricing & Policies' },
    { num: 5, label: 'Amenities' },
    { num: 6, label: 'Multi-Media' },
    { num: 7, label: 'Publishing' },
  ];

  const toggleAmenity = (item: string) => {
    setAmenities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const addImage = () => {
    if (!newImageUrl) return;
    setImages((prev) => [...prev, newImageUrl]);
    setNewImageUrl('');
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleFinishWizard = () => {
    if (!title || !city) {
      showError('Required Fields Missing', 'Property Title and City are required');
      return;
    }

    const payload = {
      title,
      tagline: tagline || title,
      description: description || 'Luxury stay on IvStay.',
      category,
      property_type: propertyType,
      address: address || 'Main Villa Boulevard',
      city,
      state: state || 'Destination Region',
      zip_code: zipCode,
      latitude: Number(lat),
      longitude: Number(lng),
      price_per_night: Number(pricePerNight),
      weekend_surge_price: Number(weekendSurgePrice),
      cleaning_fee: Number(cleaningFee),
      service_fee_pct: Number(serviceFeePct),
      min_nights: Number(minNights),
      cancellation_policy: cancellationPolicy,
      max_guests: Number(maxGuests),
      bedrooms: Number(bedrooms),
      beds: Number(beds),
      bathrooms: Number(bathrooms),
      amenities,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80'],
      status,
      is_verified: true,
      is_featured: true,
    };

    if (existingProperty) {
      updateProperty(existingProperty.id, payload);
      showSuccess('Property Updated!', `${title} has been updated`);
    } else {
      addProperty(payload);
      showSuccess('Property Created!', `${title} is now published`);
    }

    navigate('/admin/properties');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Step Indicator Header */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-white">
            {existingProperty ? `Edit: ${existingProperty.title}` : 'Add New Luxury Stay'}
          </h2>
          <span className="text-xs font-bold text-brand-gold bg-amber-500/10 px-3 py-1 rounded-full">
            Step {currentStep} of 7
          </span>
        </div>

        {/* Progress pills bar */}
        <div className="grid grid-cols-7 gap-2">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`h-2 rounded-full transition-all ${
                s.num <= currentStep ? 'bg-brand-gold shadow-gold-glow' : 'bg-slate-800'
              }`}
              title={s.label}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 font-semibold">{steps[currentStep - 1].label}</p>
      </div>

      {/* Step Body Cards */}
      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        {/* Step 1: General Info */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Property Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Villa Seraphina Cliffside Estate"
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none focus:border-brand-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Editorial Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Panoramic sea view with private infinity pool"
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                >
                  <option value="bnbs_and_villas">BnBs & Villas</option>
                  <option value="hotels">Hotels</option>
                  <option value="home_stays">Home Stays</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                >
                  <option value="villa">Private Villa</option>
                  <option value="bnb">Boutique BnB</option>
                  <option value="hotel">Boutique Hotel</option>
                  <option value="resort">Luxury Resort</option>
                  <option value="home_stay">Home Stay</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Detailed Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write an editorial description detailing architectural grandeur, view lines, and hospitality perks."
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Via Cristoforo Colombo 84"
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Positano"
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">State / Region</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Amalfi Coast"
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ZIP / Postal Code</label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="84017"
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Capacity & Layout */}
        {currentStep === 3 && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Max Guests</label>
              <input
                type="number"
                value={maxGuests}
                onChange={(e) => setMaxGuests(parseInt(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Beds</label>
              <input
                type="number"
                value={beds}
                onChange={(e) => setBeds(parseInt(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Bathrooms</label>
              <input
                type="number"
                step="0.5"
                value={bathrooms}
                onChange={(e) => setBathrooms(parseFloat(e.target.value))}
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {/* Step 4: Pricing & Policies */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Base Nightly Rate (₹)</label>
                <input
                  type="number"
                  value={pricePerNight}
                  onChange={(e) => setPricePerNight(parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Weekend Surge Rate (₹)</label>
                <input
                  type="number"
                  value={weekendSurgePrice}
                  onChange={(e) => setWeekendSurgePrice(parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cleaning Fee (₹)</label>
                <input
                  type="number"
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">IvStay to pay to hotel %</label>
                <input
                  type="number"
                  value={serviceFeePct}
                  onChange={(e) => setServiceFeePct(parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Min Nights Stay</label>
                <input
                  type="number"
                  value={minNights}
                  onChange={(e) => setMinNights(parseInt(e.target.value))}
                  className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Cancellation Policy</label>
              <select
                value={cancellationPolicy}
                onChange={(e) => setCancellationPolicy(e.target.value as any)}
                className="w-full p-3 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
              >
                <option value="Flexible">Flexible (100% refund up to 48 hrs prior)</option>
                <option value="Moderate">Moderate (50% refund up to 5 days prior)</option>
                <option value="Strict">Strict (Non-refundable after booking)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 5: Amenities */}
        {currentStep === 5 && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Select Luxury Amenities & Inclusions
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableAmenities.map((amenity) => {
                const isChecked = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-colors text-left ${
                      isChecked
                        ? 'bg-amber-500/20 border-brand-gold text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-brand-gold border-brand-gold text-white' : 'border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Multi-Media Uploader */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-6 bg-slate-800/80 border-2 border-dashed border-slate-700 rounded-2xl text-center space-y-2">
              <UploadCloud className="w-8 h-8 text-brand-gold mx-auto" />
              <p className="text-xs font-bold text-white">Add Photo URL or Upload File</p>
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <input
                  type="file"
                  accept="image/*"
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-gold file:text-white hover:file:bg-brand-goldHover"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs"
                  />
                  <Button onClick={addImage} variant="gold" size="sm">
                    Add Photo
                  </Button>
                </div>
              </div>
            </div>

            {/* Photo List */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden h-28 border border-slate-700">
                  <img src={img} alt={`Uploaded ${idx}`} className="w-full h-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      Thumbnail Cover
                    </span>
                  )}
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Publishing & Review */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-800 rounded-2xl border border-slate-700 space-y-3">
              <h4 className="font-serif text-lg font-bold text-white">Final Review Summary</h4>
              <p className="text-xs text-slate-300">
                Title: <strong className="text-white">{title || 'Untitled'}</strong>
              </p>
              <p className="text-xs text-slate-300">
                City: <strong className="text-white">{city}</strong> • Nightly Rate:{' '}
                <strong className="text-brand-gold">₹{pricePerNight}</strong>
              </p>
              <p className="text-xs text-slate-300">Total Uploaded Media: {images.length} photos</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Publishing Status</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`flex-1 p-4 rounded-2xl border text-xs font-bold transition-colors ${
                    status === 'active'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Active (Live on Guest Portal)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`flex-1 p-4 rounded-2xl border text-xs font-bold transition-colors ${
                    status === 'draft'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Draft (Hidden)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Footer Navigation */}
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
            Previous Step
          </Button>

          {currentStep < 7 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1))}
              variant="gold"
              size="sm"
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" onClick={handleFinishWizard} variant="gold" size="sm" className="shadow-gold-glow">
              <CheckCircle className="w-4 h-4 mr-1" />
              Save & Publish Property
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
