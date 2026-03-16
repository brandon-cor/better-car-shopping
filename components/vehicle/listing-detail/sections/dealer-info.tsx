"use client";

import { Phone, MapPin, ExternalLink, Navigation } from "lucide-react";
import { DetailedListing } from "@/lib/schema";
import dynamic from "next/dynamic";

interface DealerMapProps {
  latitude: number;
  longitude: number;
  dealerName: string;
}

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic<DealerMapProps>(
  () => import("./dealer-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-48 bg-muted/20 rounded-xl animate-pulse flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground" />
      </div>
    ),
  }
);

interface DealerInfoProps {
  listing: DetailedListing;
  distance?: number;
}

export function DealerInfo({ listing, distance }: DealerInfoProps) {
  if (!listing.dealer) return null;

  const dealer = listing.dealer;
  const hasLocation = dealer.latitude !== undefined && dealer.longitude !== undefined;
  // Use passed distance or fallback to listing.dist
  const actualDistance = distance ?? listing.dist;
  
  // Build Google Maps URL
  const buildGoogleMapsUrl = () => {
    const address = [
      dealer.street,
      dealer.city,
      dealer.state,
      dealer.zip
    ].filter(Boolean).join(", ");
    
    if (hasLocation) {
      return `https://www.google.com/maps?q=${dealer.latitude},${dealer.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Dealer Information</h2>
      </div>
      
      <div className="rounded-2xl p-4 border border-border/10 shadow-sm">
        {/* Map Section - Top */}
        {hasLocation && (
          <div className="mb-6">
            <a
              href={buildGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="block group relative overflow-hidden rounded-xl border border-border/40 hover:border-primary/50 transition-all"
            >
              <div className="relative w-full h-48">
                <MapComponent 
                  latitude={dealer.latitude!} 
                  longitude={dealer.longitude!}
                  dealerName={dealer.name || "Dealer"}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg">
                    <Navigation className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">Open in Google Maps</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <p className="font-bold text-base leading-tight">{dealer.name}</p>
                {actualDistance !== undefined && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded text-xs font-bold text-primary shrink-0">
                    <Navigation className="w-3 h-3" />
                    {actualDistance < 1 ? "<1" : Math.round(actualDistance)} mi away
                  </div>
                )}
              </div>
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary/60" />
                <div className="text-xs">
                  {dealer.street && <p>{dealer.street}</p>}
                  <p>
                    {[dealer.city, dealer.state, dealer.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {dealer.phone && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <a href={`tel:${dealer.phone}`} className="font-bold hover:text-primary transition-colors">
                    {dealer.phone}
                  </a>
                </div>
              )}
              {dealer.website && (
                <div className="flex items-center gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-primary" />
                  <a 
                    href={dealer.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold hover:text-primary transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
              {hasLocation && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Navigation className="w-3.5 h-3.5 text-primary" />
                  <a 
                    href={buildGoogleMapsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold hover:text-primary transition-colors"
                  >
                    View on Map
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {dealer.rating && (
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 border border-border/40 text-muted-foreground rounded text-[10px] font-black uppercase tracking-wider">
                  {dealer.rating} / 5 Rating
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  ({dealer.review_count || 0} Reviews)
                </span>
              </div>
            )}
            
            {dealer.hours && (
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                <p className="font-bold uppercase tracking-widest text-foreground mb-1">Business Hours</p>
                <div className="grid grid-cols-2 gap-x-4">
                  {dealer.hours.monday && <p>Mon: {dealer.hours.monday}</p>}
                  {dealer.hours.tuesday && <p>Tue: {dealer.hours.tuesday}</p>}
                  {dealer.hours.wednesday && <p>Wed: {dealer.hours.wednesday}</p>}
                  {dealer.hours.thursday && <p>Thu: {dealer.hours.thursday}</p>}
                  {dealer.hours.friday && <p>Fri: {dealer.hours.friday}</p>}
                  {dealer.hours.saturday && <p>Sat: {dealer.hours.saturday}</p>}
                  {dealer.hours.sunday && <p>Sun: {dealer.hours.sunday}</p>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

