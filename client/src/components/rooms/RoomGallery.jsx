import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, BedDouble } from 'lucide-react';

export default function RoomGallery({ images = [] }) {
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images.length) {
    return (
      <div className="w-full h-[400px] bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl flex items-center justify-center">
        <BedDouble className="w-20 h-20 text-navy-300" />
      </div>
    );
  }

  const goTo = (i) => setCurrent((i + images.length) % images.length);

  return (
    <>
      {/* Main Gallery */}
      <div className="relative group">
        <div className="overflow-hidden rounded-2xl">
          <img
            src={images[current]?.image_url || images[current]}
            alt={`Room image ${current + 1}`}
            className="w-full h-[400px] lg:h-[500px] object-cover transition-transform duration-500"
          />
        </div>

        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(current - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => goTo(current + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}

        {/* Expand */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Expand className="w-4 h-4 text-white" />
        </button>

        {/* Counter */}
        <div className="absolute bottom-3 right-3 glass-dark rounded-full px-3 py-1 text-xs text-white font-medium">
          {current + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all ${
                idx === current ? 'ring-2 ring-gold-500 ring-offset-2' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.image_url || img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={images[current]?.image_url || images[current]}
            alt={`Room image ${current + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6 text-white" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
