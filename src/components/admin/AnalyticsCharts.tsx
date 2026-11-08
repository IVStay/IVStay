import React from 'react';
import { Sparkles, TrendingUp, Building2, Crown } from 'lucide-react';

export const AnalyticsCharts: React.FC = () => {
  // Monthly Revenue Data Points
  const monthlyRevenue = [
    { month: 'Apr', revenue: 42000 },
    { month: 'May', revenue: 58000 },
    { month: 'Jun', revenue: 84000 },
    { month: 'Jul', revenue: 112000 },
    { month: 'Aug', revenue: 128000 },
    { month: 'Sep', revenue: 96000 },
  ];

  const maxRev = Math.max(...monthlyRevenue.map((d) => d.revenue));

  // Category Revenue Share
  const categoryShare = [
    { name: 'Villas & BnBs', pct: 68, color: 'bg-brand-gold', icon: Crown },
    { name: 'Boutique Hotels', pct: 32, color: 'bg-indigo-500', icon: Building2 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Monthly Revenue Trend SVG Chart */}
      <div className="lg:col-span-8 bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-gold" />
              Monthly Revenue Performance ($)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time gross booking volume trend</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Peak Season +32%
          </span>
        </div>

        {/* Custom Bar Visualization */}
        <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-slate-800 pb-4">
          {monthlyRevenue.map((item) => {
            const heightPct = (item.revenue / maxRev) * 100;
            return (
              <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-amber-300 bg-slate-800 px-2 py-0.5 rounded">
                  ${(item.revenue / 1000).toFixed(0)}k
                </div>
                <div
                  className="w-full max-w-[48px] bg-gradient-to-t from-amber-600 to-brand-gold rounded-2xl group-hover:scale-105 transition-all shadow-gold-glow"
                  style={{ height: `${heightPct}%` }}
                />
                <span className="text-xs font-bold text-slate-400 group-hover:text-white">
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="lg:col-span-4 bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-6">
        <div>
          <h3 className="font-serif text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-gold" />
            Category Revenue Split
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Villas & BnBs vs Boutique Hotels</p>
        </div>

        <div className="space-y-6 pt-4">
          {categoryShare.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-white">
                  <span className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-brand-gold" />
                    {cat.name}
                  </span>
                  <span className="font-serif text-base text-amber-300">{cat.pct}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full transition-all duration-700`} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 text-[11px] text-slate-300 space-y-1">
          <p className="font-bold text-white">IvStay Recommendation:</p>
          <p className="text-slate-400">Villas & BnBs generate 2.1x higher average order value ($1,450/night) compared to boutique hotels.</p>
        </div>
      </div>
    </div>
  );
};
