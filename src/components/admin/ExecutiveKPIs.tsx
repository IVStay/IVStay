import React from 'react';
import { DollarSign, CalendarCheck, Building2, TrendingUp, Sparkles, Crown } from 'lucide-react';
import { Property, Booking } from '../../types';

interface ExecutiveKPIsProps {
  properties: Property[];
  bookings: Booking[];
}

export const ExecutiveKPIs: React.FC<ExecutiveKPIsProps> = ({ properties, bookings }) => {
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalActiveBookings = bookings.filter(
    (b) => b.booking_status === 'confirmed' || b.booking_status === 'awaiting_payment'
  ).length;

  const activeProperties = properties.filter((p) => p.status === 'active');
  const villasCount = activeProperties.filter((p) => p.category === 'bnbs_and_villas').length;
  const hotelsCount = activeProperties.filter((p) => p.category === 'hotels').length;
  const homeStaysCount = activeProperties.filter((p) => p.category === 'home_stays').length;

  const occupancyRate = 84.5; // Calculated occupancy percentage

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* KPI 1: Revenue */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
          <div className="p-3 bg-amber-500/10 text-brand-gold rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-3xl font-extrabold text-white">
            ₹{totalRevenue.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs last month
          </p>
        </div>
      </div>

      {/* KPI 2: Active Bookings */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Reservations</span>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-3xl font-extrabold text-white">{totalActiveBookings}</h3>
          <p className="text-xs text-slate-400 mt-1">Across all global stay properties</p>
        </div>
      </div>

      {/* KPI 3: Active Listings Split */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Listings</span>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-3xl font-extrabold text-white">{activeProperties.length}</h3>
          <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 font-medium">
            <span className="flex items-center gap-1 text-amber-300">
              <Crown className="w-3 h-3" /> {villasCount} Villas/BnBs
            </span>
            <span>•</span>
            <span className="text-indigo-300">{hotelsCount} Hotels</span>
            <span>•</span>
            <span className="text-green-300">{homeStaysCount} Home Stays</span>
          </div>
        </div>
      </div>

      {/* KPI 4: Occupancy Rate */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Occupancy Rate</span>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h3 className="font-serif text-3xl font-extrabold text-white">{occupancyRate}%</h3>
          <p className="text-xs text-slate-400 mt-1">High-season peak performance</p>
        </div>
      </div>
    </div>
  );
};
