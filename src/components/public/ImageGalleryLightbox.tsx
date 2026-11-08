import React, { useState } from 'react';
import { Grid, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface ImageGalleryLightboxProps {
  images: string[];
  title: string;
}

export const ImageGalleryLightbox: React.FC<ImageGalleryLightboxProps> = ({ images, title }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const displayImages = images.slice(0, 5);

  const openAtIndex = (idx: number) => {
    setActiveIdx(idx);
    setIsLightboxOpen(true);
  };

  return (
    <div className="relative">
      {/* 5-Photo Mosaic Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-[380px] sm:h-[480px] rounded-3xl overflow-hidden shadow-lg border border-slate-100">
        {/* Main Big Cover Photo */}
        <div
          onClick={() => openAtIndex(0)}
          className="md:col-span-2 h-full relative cursor-pointer group overflow-hidden"
        >
          <img
            src={displayImages[0]}
            alt={`${title} main`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>

        {/* 4 Side Mosaic Grid Photos */}
        <div className="hidden md:grid grid-cols-2 col-span-2 gap-3 h-full">
          {displayImages.slice(1, 5).map((img, idx) => (
            <div
              key={idx}
              onClick={() => openAtIndex(idx + 1)}
              className="relative h-full cursor-pointer group overflow-hidden rounded-2xl"
            >
              <img
                src={img}
                alt={`${title} detail ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Show All Photos Floating Trigger Button */}
        <button
          onClick={() => openAtIndex(0)}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold hover:bg-white transition-all shadow-md"
        >
          <Grid className="w-4 h-4 text-brand-gold" />
          <span>Show All {images.length} Photos</span>
        </button>
      </div>

      {/* Full-Screen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold">{title}</h3>
              <p className="text-xs text-slate-400">
                Photo {activeIdx + 1} of {images.length}
              </p>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Photo Viewing Area */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={images[activeIdx]}
              alt={`${title} full ${activeIdx + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Nav Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                  className="absolute left-4 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors shadow-xl"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveIdx((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-4 p-3 rounded-full bg-slate-800/80 text-white hover:bg-slate-700 transition-colors shadow-xl"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip Footer */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-slate-800">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  idx === activeIdx ? 'border-brand-gold scale-105' : 'border-transparent opacity-50'
                }`}
              >
                <img src={img} alt={`thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
