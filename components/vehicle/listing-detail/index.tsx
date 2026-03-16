"use client";

import { useEffect, useState, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailedListing } from "@/lib/schema";
import { formatPrice, formatLocation } from "@/lib/types";
import { DisplayListing } from "@/lib/types";
import { useListingDetails } from "@/lib/hooks/use-listing-details";
import { ImageGallery } from "./sections/image-gallery";
import { VehicleHeader } from "./sections/vehicle-header";
import { VehicleSpecs } from "./sections/vehicle-specs";
import { DealerInfo } from "./sections/dealer-info";
import { VehicleFeatures } from "./sections/vehicle-features";
import { VehicleHighlights } from "./sections/vehicle-highlights";
import { PriceInsights } from "./sections/price-insights";
import { ActionButtons } from "./sections/action-buttons";
import { VehicleHistory } from "./sections/vehicle-history";
import { SimilarRecommendations } from "./sections/similar-recommendations";

interface ListingDetailViewProps {
  listingId: string;
  initialListing?: DisplayListing;
  favorites: DisplayListing[];
  toggleFavorite: (listing: DisplayListing) => void;
  openCallDialog: (listing: DisplayListing) => void;
  loading: string | null;
  onBack: () => void;
  onListingClick?: (id: string) => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-10 w-32 bg-muted/20 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video bg-muted/20 rounded-2xl animate-pulse" />
          <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
          <div className="h-64 bg-muted/20 rounded-2xl animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />
          <div className="h-32 bg-muted/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onBack }: { error: Error; onBack: () => void }) {
  return (
    <div className="text-center py-24 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="text-muted-foreground">
        {error.message || "Failed to load listing details"}
      </p>
      <Button onClick={onBack} variant="outline">
        Go Back
      </Button>
    </div>
  );
}

export function ListingDetailView({
  listingId,
  initialListing,
  favorites,
  toggleFavorite,
  openCallDialog,
  loading,
  onBack,
  onListingClick,
}: ListingDetailViewProps) {
  // Track if we're transitioning to a new listing
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousListingId, setPreviousListingId] = useState<string | null>(null);

  // Pass initialData to prevent stale data flash
  const { listing, isLoading, isError, isStale } = useListingDetails(listingId, {
    initialData: initialListing?.raw as DetailedListing | undefined,
  });

  // Handle listing ID changes
  useEffect(() => {
    if (previousListingId !== null && previousListingId !== listingId) {
      // If we don't have initial data for the new listing, show transition
      if (!initialListing) {
        setIsTransitioning(true);
      }
    }
    setPreviousListingId(listingId);
  }, [listingId, previousListingId, initialListing]);

  // Clear transition when new data arrives
  useEffect(() => {
    if (listing && listing.id === listingId) {
      setIsTransitioning(false);
    }
  }, [listing, listingId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onBack();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onBack]);

  // Show loading skeleton during transition without initial data
  if (isTransitioning || (isLoading && !initialListing)) {
    return <LoadingSkeleton />;
  }

  const detailedListing = listing || initialListing?.raw;

  if (isError && !initialListing) {
    return <ErrorState error={isError} onBack={onBack} />;
  }

  if (!detailedListing) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-muted-foreground">Listing not found</p>
        <Button onClick={onBack} variant="outline">Go Back</Button>
      </div>
    );
  }

  const images = detailedListing.media?.photo_links || 
                (initialListing?.image ? [initialListing.image] : []);
  
  const displayListing: DisplayListing = initialListing || {
    id: detailedListing.id,
    title: detailedListing.heading || "Vehicle",
    price: formatPrice(detailedListing.price),
    location: formatLocation(detailedListing.dealer),
    dealer: detailedListing.dealer?.name || "Dealer",
    phone: detailedListing.dealer?.phone,
    image: images[0],
    miles: detailedListing.miles,
    bodyType: detailedListing.body_type,
    fuelType: detailedListing.fuel_type,
    vdpUrl: detailedListing.vdp_url,
    raw: detailedListing,
  };

  // Check if we have high value features to display
  const extra = detailedListing.extra as { high_value_features?: string[] } | undefined;
  const hasHighlights = extra?.high_value_features && 
                        extra.high_value_features.length > 0;
  
  // Check if we have price insights data
  const hasPriceInsights = detailedListing.price_change_percent !== undefined || 
                           detailedListing.dom !== undefined ||
                           detailedListing.first_seen_at_mc_date !== undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 pt-2 pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Show stale indicator while revalidating */}
      {isStale && (
        <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium text-amber-600">
          Updating...
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-8 space-y-3">
          {/* Compact Back Button - Moved inside to align sidebar with top of image */}
          <div className="flex items-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2 h-6 px-2 text-[10px] uppercase font-bold tracking-wider"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Search
            </Button>
          </div>

          <div className="space-y-4">
            <Suspense fallback={<div className="aspect-[21/9] bg-muted/20 rounded-xl animate-pulse" />}>
              <ImageGallery images={images} title={detailedListing.heading || "Vehicle"} />
            </Suspense>
          </div>

          <div className="space-y-14 pt-10">
            {/* Key Features - prioritized immediately below gallery */}
            <Suspense fallback={<div className="h-64 bg-muted/20 rounded-2xl animate-pulse" />}>
              <VehicleSpecs listing={detailedListing} />
            </Suspense>

            {/* History & Condition */}
            <Suspense fallback={<div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />}>
              <VehicleHistory listing={detailedListing} />
            </Suspense>

            {/* Features & Options */}
            {hasHighlights ? (
              <Suspense fallback={<div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />}>
                <VehicleHighlights listing={detailedListing} />
              </Suspense>
            ) : detailedListing.features ? (
              <Suspense fallback={<div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />}>
                <VehicleFeatures listing={detailedListing} />
              </Suspense>
            ) : null}

            {/* Price & Market Insights */}
            {hasPriceInsights && (
              <Suspense fallback={<div className="h-32 bg-muted/20 rounded-xl animate-pulse" />}>
                <PriceInsights listing={detailedListing} />
              </Suspense>
            )}

            {/* Dealer Information */}
            {detailedListing.dealer && (
              <Suspense fallback={<div className="h-48 bg-muted/20 rounded-2xl animate-pulse" />}>
                <DealerInfo listing={detailedListing} distance={initialListing?.distance} />
              </Suspense>
            )}

            {/* Similar Recommendations */}
            <Suspense fallback={<div className="h-64 bg-muted/20 rounded-2xl animate-pulse" />}>
              <SimilarRecommendations 
                listingId={detailedListing.id}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                openCallDialog={openCallDialog}
                loading={loading}
                onListingClick={onListingClick as ((id: string) => void) | undefined}
              />
            </Suspense>
          </div>
        </div>

        {/* Right Column - Quick Info & Actions */}
        <div className="lg:col-span-4">
          <div className="sticky top-14 space-y-3">
            <Suspense fallback={<div className="h-44 bg-muted/20 rounded-xl animate-pulse" />}>
              <VehicleHeader listing={detailedListing} variant="sidebar" />
            </Suspense>

            <Suspense fallback={<div className="h-36 bg-muted/20 rounded-xl animate-pulse" />}>
              <ActionButtons
                listing={detailedListing}
                displayListing={displayListing}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                openCallDialog={openCallDialog}
                loading={loading}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
