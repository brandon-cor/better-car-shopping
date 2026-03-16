"use client";

import { useSimilarVehicles } from "@/lib/hooks/use-similar-vehicles";
import { VehicleCard } from "../../vehicle-card";
import { DisplayListing, formatPrice, formatLocation } from "@/lib/types";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimilarRecommendationsProps {
  listingId: string;
  favorites: DisplayListing[];
  toggleFavorite: (listing: DisplayListing) => void;
  openCallDialog: (listing: DisplayListing) => void;
  loading: string | null;
  onListingClick?: (id: string) => void;
}

export function SimilarRecommendations({
  listingId,
  favorites,
  toggleFavorite,
  openCallDialog,
  loading,
  onListingClick,
}: SimilarRecommendationsProps) {
  const { similarVehicles, isLoading, isAiRanked, isError } = useSimilarVehicles(listingId);

  if (isError) {
    console.error("Similar recommendations error:", isError);
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pt-12 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted/20 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[400px] bg-muted/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!similarVehicles || similarVehicles.length === 0) {
    return (
      <div className="pt-16 pb-8 border-t border-border/40 text-center space-y-2">
        <p className="text-sm text-muted-foreground font-medium">No similar recommendations found for this specific vehicle.</p>
      </div>
    );
  }

  // Take only top 3
  const displayListings = similarVehicles.slice(0, 3).map((l: any) => ({
    id: l.id,
    title: l.heading,
    price: formatPrice(l.price),
    location: formatLocation(l.dealer),
    dealer: l.dealer?.name || "Dealer",
    phone: l.dealer?.phone,
    image: l.media?.photo_links?.[0] || "/placeholder-image.svg",
    miles: l.miles,
    bodyType: l.body_type,
    fuelType: l.fuel_type,
    vdpUrl: l.vdp_url,
    distance: l.distance,
    raw: l,
  }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-1">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">Similar Recommendations</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Based on this car's features and your personal preferences
          </p>
        </div>
        <Button variant="ghost" className="hidden md:flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5 h-8">
          View All Similar
          <ArrowRight className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayListings.map((listing: DisplayListing, idx: number) => (
          <div key={listing.id} className="transition-all duration-500 hover:scale-[1.03] hover:z-10">
            <VehicleCard
              listing={listing}
              idx={idx}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              openCallDialog={openCallDialog}
              loading={loading}
              onClick={(l) => {
                 if (onListingClick) {
                   onListingClick(l.id);
                   // Scroll to top when changing listing
                   document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                 } else {
                   window.location.href = `?id=${l.id}`;
                 }
              }}
            />
          </div>
        ))}
      </div>
      
      <div className="md:hidden">
        <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest border-border/60">
          View All Similar
        </Button>
      </div>
    </div>
  );
}

