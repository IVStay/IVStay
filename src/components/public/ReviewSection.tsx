import React from 'react';
import { Star, Sparkles, CheckCircle } from 'lucide-react';
import { Review, ReviewSubRatings } from '../../types';

interface ReviewSectionProps {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  rating,
  reviewCount,
  reviews,
}) => {
  // Average each sub-rating across the actual reviews
  const average = (key: keyof ReviewSubRatings) =>
    reviews.length ? reviews.reduce((sum, r) => sum + (r.sub_ratings?.[key] || 0), 0) / reviews.length : 0;
  const avgSubRatings: ReviewSubRatings = {
    cleanliness: average('cleanliness'),
    accuracy: average('accuracy'),
    communication: average('communication'),
    location: average('location'),
    value: average('value'),
  };

  const categories = [
    { label: 'Cleanliness', score: avgSubRatings.cleanliness },
    { label: 'Accuracy', score: avgSubRatings.accuracy },
    { label: 'Communication', score: avgSubRatings.communication },
    { label: 'Location', score: avgSubRatings.location },
    { label: 'Value & Amenities', score: avgSubRatings.value },
  ];

  return (
    <div className="space-y-8 pt-8 border-t border-slate-200">
      {/* Overall Score Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand-slate text-brand-gold flex items-center justify-center font-serif font-bold text-2xl shadow-md">
            {rating.toFixed(2)}
          </div>
          <div>
            <h3 className="font-serif text-2xl font-bold text-brand-slate flex items-center gap-2">
              Guest Feedback & Reviews
              <span className="text-xs font-sans font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                IvStay Verified
              </span>
            </h3>
            <p className="text-xs text-slate-500">Based on {reviewCount} authenticated guest stays</p>
          </div>
        </div>
      </div>

      {/* 5-Category Sub-Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
        {categories.map((cat) => (
          <div key={cat.label} className="space-y-1">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>{cat.label}</span>
              <span className="font-bold text-brand-slate">{cat.score.toFixed(1)}</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gold rounded-full transition-all duration-500"
                style={{ width: `${(cat.score / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Guest Reviews Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={rev.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                  alt={rev.user_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-gold/30"
                />
                <div>
                  <h5 className="font-bold text-sm text-brand-slate flex items-center gap-1">
                    {rev.user_name}
                    <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Stayed in {new Date(rev.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold bg-amber-50 px-2.5 py-1 rounded-full text-amber-800">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{rev.rating.toFixed(1)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed italic">
              "{rev.comment}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
