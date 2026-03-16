import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Image Gallery Hook with preloading
 * Preloads adjacent images for smoother navigation
 */
export function useImageGallery(images: string[] = []) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const preloadedUrls = useRef<Set<string>>(new Set());
  const lastImagesRef = useRef<string[]>([]);

  // Clear preloaded cache when images array changes
  useEffect(() => {
    const imagesKey = images.join('|');
    const lastKey = lastImagesRef.current.join('|');
    
    if (imagesKey !== lastKey) {
      preloadedUrls.current.clear();
      lastImagesRef.current = images;
      // Reset to first image when gallery changes
      if (currentIndex >= images.length) {
        setCurrentIndex(0);
      }
    }
  }, [images, currentIndex]);

  // Preload adjacent images when currentIndex changes
  useEffect(() => {
    if (images.length === 0) return;

    // Calculate indices to preload (current, next 2, previous 1)
    const indicesToPreload = [
      currentIndex,
      currentIndex + 1,
      currentIndex + 2,
      currentIndex - 1,
    ].filter(idx => idx >= 0 && idx < images.length);

    // Limit preloading to 5 images ahead max
    const maxPreload = Math.min(currentIndex + 5, images.length - 1);
    for (let i = currentIndex + 1; i <= maxPreload; i++) {
      if (!indicesToPreload.includes(i)) {
        indicesToPreload.push(i);
      }
    }

    // Preload images that haven't been preloaded yet
    indicesToPreload.forEach(idx => {
      const url = images[idx];
      if (url && !preloadedUrls.current.has(url)) {
        preloadedUrls.current.add(url);
        
        // Create Image object to trigger browser cache
        const img = new Image();
        img.src = url;
      }
    });
  }, [currentIndex, images]);

  const nextImage = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  const openLightbox = useCallback((index?: number) => {
    if (index !== undefined) {
      setCurrentIndex(index);
    }
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  return {
    currentIndex,
    currentImage: images[currentIndex] || null,
    isLightboxOpen,
    nextImage,
    prevImage,
    goToImage,
    openLightbox,
    closeLightbox,
    totalImages: images.length,
    /** Number of images preloaded in this session */
    preloadedCount: preloadedUrls.current.size,
  };
}
