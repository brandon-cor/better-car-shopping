"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useImageGallery } from "@/lib/hooks/use-image-gallery";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const {
    currentIndex,
    currentImage,
    nextImage,
    prevImage,
    goToImage,
    totalImages,
  } = useImageGallery(images);

  const hasMultipleImages = totalImages > 1;
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = useMemo(() => {
    return (imageUrl: string) => {
      setFailedImages((prev) => new Set(prev).add(imageUrl));
    };
  }, []);

  const getImageSrc = (imageUrl: string) => {
    return failedImages.has(imageUrl) ? "/placeholder-image.svg" : imageUrl;
  };

  const isExternalImage = (imageUrl: string) => {
    return !imageUrl.startsWith('/');
  };

  if (images.length === 0) {
    return (
      <div className="overflow-hidden border border-border/40 bg-card rounded-xl">
        <div className="relative aspect-[16/10] md:aspect-[21/9] bg-muted/10 overflow-hidden flex items-center justify-center">
          <Image
            src="/placeholder-image.svg"
            alt={title}
            width={600}
            height={300}
            className="object-cover opacity-50"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] md:aspect-[16/10] bg-muted/10 overflow-hidden rounded-xl group border border-border/40">
        {currentImage && (
          <Image
            src={getImageSrc(currentImage)}
            alt={`${title} - Image ${currentIndex + 1}`}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-[1.02]"
            priority={currentIndex === 0}
            sizes="(max-width: 768px) 100vw, 1200px"
            onError={() => handleImageError(currentImage)}
            unoptimized={failedImages.has(currentImage) || isExternalImage(currentImage)}
          />
        )}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-md border border-border/40 shadow-sm hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/60 backdrop-blur-md border border-border/40 shadow-sm hover:scale-105 transition-all opacity-0 group-hover:opacity-100 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.slice(0, 10).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToImage(idx)}
                  className={`h-1 rounded-full transition-all ${
                    idx === currentIndex
                      ? "w-4 bg-primary"
                      : "w-1 bg-background/40 hover:bg-background/60"
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {hasMultipleImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => goToImage(idx)}
              className={`shrink-0 w-16 h-11 rounded-lg overflow-hidden border transition-all ${
                idx === currentIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/40 hover:border-border"
              }`}
              aria-label={`Thumbnail ${idx + 1}`}
            >
              <Image
                src={getImageSrc(img)}
                alt={`${title} thumbnail ${idx + 1}`}
                width={64}
                height={44}
                className="w-full h-full object-cover"
                onError={() => handleImageError(img)}
                unoptimized={failedImages.has(img) || isExternalImage(img)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

