"use client";

import { Loader2 } from "lucide-react";
import { DisplayListing } from "@/lib/types";
import { VehicleCard } from "./vehicle-card";

// Skeleton card component for loading state
function SkeletonCard() {
  return (
    <div className="group relative bg-card border border-border/30 rounded-2xl overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-muted/40" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-muted/40 rounded-lg w-4/5" />
          <div className="h-5 bg-muted/30 rounded-lg w-1/3" />
        </div>
        
        {/* Location & dealer */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted/30 rounded-full" />
            <div className="h-3 bg-muted/30 rounded w-24" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-muted/30 rounded-full" />
            <div className="h-3 bg-muted/30 rounded w-32" />
          </div>
        </div>
        
        {/* Stats row */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-3 bg-muted/20 rounded w-16" />
          <div className="h-3 bg-muted/20 rounded w-12" />
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-muted/20 rounded-lg flex-1" />
          <div className="h-8 bg-muted/20 rounded-lg flex-1" />
        </div>
      </div>
    </div>
  );
}

interface ListingGridProps {
  listings: DisplayListing[];
  listingsLoading: boolean;
  favorites: DisplayListing[];
  toggleFavorite: (listing: DisplayListing) => void;
  openCallDialog: (listing: DisplayListing) => void;
  loading: string | null;
  loadMoreRef: React.RefObject<HTMLDivElement | null>;
  loadingMore: boolean;
  hasMore: boolean;
  isSidebarVisible?: boolean;
  selectedListings?: DisplayListing[];
  onSelectListing?: (listing: DisplayListing) => void;
  onCardClick?: (listing: DisplayListing) => void;
}

export function ListingGrid({
  listings,
  listingsLoading,
  favorites,
  toggleFavorite,
  openCallDialog,
  loading,
  loadMoreRef,
  loadingMore,
  hasMore,
  isSidebarVisible = true,
  selectedListings = [],
  onSelectListing,
  onCardClick,
}: ListingGridProps) {
  if (listingsLoading) {
    // Show skeleton cards during loading
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${
        isSidebarVisible 
          ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      }`}>
        {Array.from({ length: 12 }).map((_, idx) => (
          <SkeletonCard key={idx} />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-border/20 rounded-3xl">
        <p className="text-sm text-muted-foreground">No listings found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 ${
        isSidebarVisible 
          ? "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
          : "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      }`}>
        {listings.map((listing, idx) => (
          <VehicleCard
            key={`${listing.id}-${idx}`}
            listing={listing}
            idx={idx}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            openCallDialog={openCallDialog}
            loading={loading}
            isSelected={selectedListings.some(s => s.id === listing.id)}
            onSelect={onSelectListing}
            onClick={onCardClick}
          />
        ))}
      </div>

      <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
        {loadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] font-bold uppercase tracking-widest animate-in fade-in duration-300">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Loading more results...
          </div>
        )}
        {!hasMore && listings.length > 0 && (
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
            End of results
          </p>
        )}
      </div>
    </div>
  );
}
