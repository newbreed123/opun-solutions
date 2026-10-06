"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { TouchEvent, useState } from "react";
import type { ListingImage } from "@/lib/real-estate/listings/types";

export default function ListingGallery({
  images,
  fallbackAlt,
}: {
  images: ListingImage[];
  fallbackAlt: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const activeImage = images[activeIndex];

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX === null || images.length < 2) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);

    if (Math.abs(deltaX) < 45) return;
    if (deltaX > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  if (!activeImage) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dark-border bg-dark-card text-muted">
        <Home className="h-14 w-14" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section aria-label="Home photos" className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-lg border border-dark-border bg-dark-deep sm:aspect-[16/10]"
        onTouchStart={(event) => setTouchStartX(event.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.alt || fallbackAlt}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-dark-deep/80 text-white"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-dark-deep/80 text-white"
              aria-label="Next photo"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-28 flex-none overflow-hidden rounded-lg border ${
                activeIndex === index
                  ? "border-brand-cyan"
                  : "border-dark-border"
              }`}
              aria-label={`Show photo ${index + 1}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
