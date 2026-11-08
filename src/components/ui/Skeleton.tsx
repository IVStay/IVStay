import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-200/80 rounded-xl ${className}`} />
  );
};

export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm p-3">
      <Skeleton className="h-64 w-full rounded-2xl mb-4" />
      <div className="space-y-2 px-2 pb-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="pt-3 flex justify-between items-center border-t border-slate-100 mt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export const GallerySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[450px] rounded-3xl overflow-hidden">
      <Skeleton className="md:col-span-2 h-full rounded-2xl" />
      <div className="grid grid-cols-2 col-span-2 gap-3 h-full">
        <Skeleton className="h-full rounded-2xl" />
        <Skeleton className="h-full rounded-2xl" />
        <Skeleton className="h-full rounded-2xl" />
        <Skeleton className="h-full rounded-2xl" />
      </div>
    </div>
  );
};
