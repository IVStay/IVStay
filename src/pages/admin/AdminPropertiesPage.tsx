import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProperties } from '../../context/PropertyContext';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatINR } from '../../utils/currency';
import { stayPath } from '../../lib/links';
import type { Property } from '../../types';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Crown,
  Sparkles,
  MapPin,
  Star,
} from 'lucide-react';

export const AdminPropertiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { properties, loading, loadError, setPropertyStatus, deleteProperty } = useProperties();
  const { showSuccess, showInfo, showError } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'bnbs_and_villas' | 'hotels' | 'home_stays'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');

  const filteredProperties = properties.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (
      search &&
      !p.title.toLowerCase().includes(search.toLowerCase()) &&
      !p.city.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleToggleStatus = async (prop: Property) => {
    const nextStatus = prop.status === 'active' ? 'draft' : 'active';
    if (nextStatus === 'active' && prop.images.length === 0) {
      showError('Add a photo first', `${prop.title} needs at least one photo before it can go live.`);
      return;
    }
    setBusyId(prop.id);
    try {
      await setPropertyStatus(prop.id, nextStatus);
      showSuccess(nextStatus === 'active' ? 'Now live' : 'Hidden', `${prop.title} is now ${nextStatus === 'active' ? 'live on the site' : 'a draft'}`);
    } catch (error) {
      showError('Could not change status', error instanceof Error ? error.message : String(error));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (prop: Property) => {
    if (!confirm(`Delete "${prop.title}" and its photos? This cannot be undone.`)) return;
    setBusyId(prop.id);
    try {
      await deleteProperty(prop.id);
      showInfo('Stay deleted', `${prop.title} was removed`);
    } catch (error) {
      showError('Could not delete', error instanceof Error ? error.message : String(error));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-extrabold text-white">Property Management Engine</h1>
          <p className="text-xs text-slate-400 mt-1">
            Master table, publishing status toggles, and multi-step CRUD management wizard
          </p>
        </div>

        <Link to="/admin/properties/new">
          <Button variant="gold" size="sm" className="shadow-gold-glow">
            <Plus className="w-4 h-4 mr-1" /> Add New Property
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or city..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-brand-gold"
          />
        </div>

        {/* Category & Status Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-800 p-1 rounded-full border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1 rounded-full ${
                categoryFilter === 'all' ? 'bg-brand-gold text-white' : 'text-slate-400'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setCategoryFilter('bnbs_and_villas')}
              className={`px-3 py-1 rounded-full ${
                categoryFilter === 'bnbs_and_villas' ? 'bg-brand-gold text-white' : 'text-slate-400'
              }`}
            >
              Villas & BnBs
            </button>
            <button
              onClick={() => setCategoryFilter('hotels')}
              className={`px-3 py-1 rounded-full ${
                categoryFilter === 'hotels' ? 'bg-brand-gold text-white' : 'text-slate-400'
              }`}
            >
              Hotels
            </button>
            <button
              onClick={() => setCategoryFilter('home_stays')}
              className={`px-3 py-1 rounded-full ${
                categoryFilter === 'home_stays' ? 'bg-brand-gold text-white' : 'text-slate-400'
              }`}
            >
              Home Stays
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-bold"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Property Master Table */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
              <th className="py-4 px-4">Property</th>
              <th className="py-4 px-4">Category</th>
              <th className="py-4 px-4">Location</th>
              <th className="py-4 px-4">Nightly Price</th>
              <th className="py-4 px-4">Capacity</th>
              <th className="py-4 px-4">Rating</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredProperties.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  {loading
                    ? 'Loading stays…'
                    : loadError
                    ? `Couldn't load stays: ${loadError}`
                    : properties.length === 0
                    ? 'No stays yet. Click “Add New Property” to create the first one.'
                    : 'No stays match these filters.'}
                </td>
              </tr>
            )}
            {filteredProperties.map((prop) => (
              <tr key={prop.id} className="hover:bg-slate-800/50 transition-colors">
                {/* Property Name & Thumbnail */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3 max-w-xs">
                    {prop.images[0] ? (
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-12 h-12 rounded-xl object-cover ring-1 ring-brand-gold/40 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-800 ring-1 ring-slate-700 shrink-0 flex items-center justify-center text-[9px] text-slate-500">
                        No photo
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="font-bold text-white text-xs truncate">{prop.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{prop.tagline}</p>
                    </div>
                  </div>
                </td>

                {/* Category Badge */}
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      prop.category === 'bnbs_and_villas'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : prop.category === 'hotels'
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : 'bg-green-500/10 text-green-300 border-green-500/30'
                    }`}
                  >
                    {prop.category === 'bnbs_and_villas' ? <Crown className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                    {prop.category === 'bnbs_and_villas' ? 'Villa / BnB' : prop.category === 'hotels' ? 'Hotel' : 'Home Stay'}
                  </span>
                </td>

                {/* Location */}
                <td className="py-4 px-4 font-semibold text-slate-300">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                    <span>{prop.city}, {prop.state}</span>
                  </div>
                </td>

                {/* Price */}
                <td className="py-4 px-4 font-serif font-extrabold text-white text-sm">
                  {formatINR(prop.price_per_night)}
                </td>

                {/* Capacity */}
                <td className="py-4 px-4 font-semibold">
                  {prop.max_guests} Guests{prop.bedrooms != null ? ` (${prop.bedrooms} BR)` : ''}
                </td>

                {/* Rating */}
                <td className="py-4 px-4 font-bold text-amber-300">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{prop.review_count > 0 ? prop.rating.toFixed(2) : 'New'}</span>
                  </div>
                </td>

                {/* Status Toggle Button */}
                <td className="py-4 px-4">
                  <button
                    onClick={() => void handleToggleStatus(prop)}
                    disabled={busyId === prop.id}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      prop.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {prop.status.toUpperCase()}
                  </button>
                </td>

                {/* Actions */}
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={stayPath(prop)}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Preview Stay"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/admin/properties/edit/${prop.id}`}
                      className="p-1.5 rounded-lg bg-brand-gold text-white hover:bg-brand-goldHover transition-colors"
                      title="Edit Property"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => void handleDelete(prop)}
                      disabled={busyId === prop.id}
                      className="p-1.5 rounded-lg bg-rose-950 text-rose-400 hover:bg-rose-900 transition-colors"
                      title="Delete Property"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
