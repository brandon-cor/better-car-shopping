"use client";

import { useRef, useCallback, useState } from "react";
import Image from "next/image";
import { MapPin, Building2, Phone, ExternalLink, Heart, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { DisplayListing } from "@/lib/types";
import { usePrefetch } from "@/lib/hooks/use-prefetch";

interface VehicleCardProps {
  listing: DisplayListing;
  idx: number;
  favorites: DisplayListing[];
  toggleFavorite: (listing: DisplayListing) => void;
  openCallDialog: (listing: DisplayListing) => void;
  loading: string | null;
  isSelected?: boolean;
  onSelect?: (listing: DisplayListing) => void;
  onClick?: (listing: DisplayListing) => void;
  isLoading?: boolean;
}

/**
 * Vehicle Card Skeleton for loading states
 */
export function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm rounded-2xl flex flex-col h-full animate-pulse">
      <div className="p-2 pb-0">
        <AspectRatio ratio={16 / 10} className="bg-muted/30 rounded-xl" />
      </div>
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="h-4 bg-muted/30 rounded w-3/4" />
        <div className="h-6 bg-muted/30 rounded w-1/3" />
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-4 flex flex-col flex-1">
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-muted/30 rounded w-1/2" />
          <div className="h-3 bg-muted/30 rounded w-2/3" />
        </div>
        <div className="h-3 bg-muted/30 rounded w-full mb-4" />
        <div className="mt-auto pt-2">
          <div className="flex items-center gap-2">
            <div className="flex-[1.2] h-8 bg-muted/30 rounded-lg" />
            <div className="flex-1 h-8 bg-muted/30 rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function VehicleCard({
  listing,
  idx,
  favorites,
  toggleFavorite,
  openCallDialog,
  loading,
  isSelected = false,
  onSelect,
  onClick,
  isLoading = false,
}: VehicleCardProps) {
  const isFavorite = favorites.some((f) => f.id === listing.id);
  const { prefetch, cancelPrefetch } = usePrefetch();
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // Check if image URL is external (not from our domain)
  const isExternalImage = listing.image ? !listing.image.startsWith('/') : false;

  // Handle prefetch on hover
  const handleMouseEnter = useCallback(() => {
    // Delay prefetch slightly to avoid prefetching on quick mouse movements
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetch(`/api/listing/${listing.id}`);
    }, 150);
  }, [listing.id, prefetch]);

  const handleMouseLeave = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
      prefetchTimeoutRef.current = null;
    }
    cancelPrefetch(`/api/listing/${listing.id}`);
  }, [listing.id, cancelPrefetch]);

  if (isLoading) {
    return <VehicleCardSkeleton />;
  }

  return (
    <Card
      key={listing.id}
      onClick={() => onClick?.(listing)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`overflow-hidden border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group rounded-2xl flex flex-col h-full relative animate-in fade-in zoom-in-95 ${
        onClick ? "cursor-pointer" : ""
      }`}
      style={{ animationDelay: `${(idx % 15) * 50}ms`, animationFillMode: "both" }}
    >
      {/* Selection checkbox (top-left) */}
      {onSelect && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(listing);
          }}
          className="absolute top-4 left-4 z-10 p-1.5 rounded-lg bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-all"
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
              isSelected
                ? "bg-primary border-2 border-primary"
                : "bg-transparent border-2 border-muted-foreground/40"
            }`}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </button>
      )}
      {/* Favorite button (top-right) */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(listing);
        }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-all group/heart"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover/heart:text-red-500"
          }`}
        />
      </button>
      <div className="p-2 pb-0">
        <AspectRatio ratio={16 / 10} className="bg-background rounded-xl overflow-hidden flex items-center justify-center relative">
          {imageError || !listing.image ? (
            <Image
              src="/placeholder-image.svg"
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-opacity duration-300"
              unoptimized
            />
          ) : (
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-opacity duration-300"
              onError={() => setImageError(true)}
              unoptimized={isExternalImage}
            />
          )}
        </AspectRatio>
      </div>
      <CardHeader className="p-4 pb-2 space-y-1">
        <h3 className="font-bold text-[13px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
        <p className="text-xl font-black text-primary tracking-tight">{listing.price}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 pb-4 flex flex-col flex-1">
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
            <MapPin className="w-2.5 h-2.5 shrink-0 text-primary/70" />
            <span className="truncate">{listing.location}</span>
          </div>
          <div className="flex items-start gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
            <Building2 className="w-2.5 h-2.5 shrink-0 mt-0.5 text-primary/70" />
            <span className="line-clamp-1 leading-relaxed">{listing.dealer}</span>
          </div>
        </div>

        {(listing.miles !== undefined || listing.bodyType || listing.fuelType || listing.distance !== undefined) && (
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 mb-4 pb-3 border-b border-border/5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {listing.miles !== undefined && <span className="font-bold">{listing.miles.toLocaleString()} mi</span>}
              {listing.bodyType && <span className="font-bold capitalize">{listing.bodyType}</span>}
              {listing.fuelType && <span className="font-bold capitalize text-primary/60">{listing.fuelType}</span>}
            </div>
            {listing.distance !== undefined && (
              <div className="flex items-center gap-1 text-primary/60 font-bold shrink-0 ml-2">
                <Navigation className="w-2.5 h-2.5" />
                <span>{listing.distance < 1 ? "<1" : Math.round(listing.distance)} mi</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openCallDialog(listing);
              }}
              disabled={loading === listing.id || !listing.phone}
              className="flex-[1.2] h-8 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] px-2"
            >
              <Phone className="w-2.5 h-2.5 mr-1 shrink-0" />
              <span className="truncate">{loading === listing.id ? "..." : "Call"}</span>
            </Button>
            {listing.vdpUrl ? (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(listing.vdpUrl, "_blank", "noopener,noreferrer");
                }}
                variant="outline"
                className="flex-1 h-8 rounded-lg text-[8px] font-black uppercase tracking-widest border-border/60 hover:bg-foreground hover:text-background transition-all active:scale-[0.98] px-2"
              >
                <ExternalLink className="w-2.5 h-2.5 mr-1 shrink-0" />
                <span className="truncate">Details</span>
              </Button>
            ) : (
              <div className="flex-1 h-8 rounded-lg border border-dashed border-border/20 flex items-center justify-center opacity-40">
                <span className="text-[7px] font-bold uppercase tracking-widest">N/A</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
