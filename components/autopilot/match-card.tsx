"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { VehicleMatch } from "@/lib/autopilot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Car,
  MapPin,
  Gauge,
  ExternalLink,
  Heart,
  Sparkles,
  TrendingDown,
  Navigation,
  Building2,
  Clock,
  Globe,
} from "lucide-react";

// Source platform logos as simple SVG components
function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function OfferUpLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">O</text>
    </svg>
  );
}

function CraigslistLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-4h2v4zm0-6h-2V9h2v2z"/>
    </svg>
  );
}

function AutotraderLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  );
}

function CarGurusLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" fill="white"/>
    </svg>
  );
}

function GenericCarLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>
  );
}

// Get source logo component
function getSourceLogo(source: string): React.FC<{ className?: string }> {
  const s = source.toLowerCase();
  if (s.includes("facebook")) return FacebookLogo;
  if (s.includes("offerup")) return OfferUpLogo;
  if (s.includes("craigslist")) return CraigslistLogo;
  if (s.includes("autotrader")) return AutotraderLogo;
  if (s.includes("cargurus")) return CarGurusLogo;
  return GenericCarLogo;
}

interface MatchCardProps {
  match: VehicleMatch;
  idx?: number;
  userZipCode?: string;
  onAddToShowroom?: (match: VehicleMatch) => void;
  onClick?: (match: VehicleMatch) => void;
  isFavorite?: boolean;
}

// Simple distance estimation based on ZIP code (rough approximation)
// In production, use a proper geocoding API
function estimateDistance(vehicleLocation?: string, userZip?: string): number | undefined {
  if (!vehicleLocation || !userZip) return undefined;
  
  // Extract ZIP code from location string if present
  const zipMatch = vehicleLocation.match(/\b\d{5}\b/);
  if (zipMatch) {
    const vehicleZip = parseInt(zipMatch[0], 10);
    const userZipNum = parseInt(userZip, 10);
    
    // Very rough estimation based on ZIP code difference
    // This is just for demo - real implementation would use geocoding
    const diff = Math.abs(vehicleZip - userZipNum);
    if (diff < 100) return Math.round(diff * 0.5); // Nearby
    if (diff < 1000) return Math.round(diff * 0.3); // Same region
    return Math.round(diff * 0.2); // Far away
  }
  
  return undefined;
}

// Check if URL is valid
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// Get source name from URL
function getSourceFromUrl(url: string): string | undefined {
  if (!isValidUrl(url)) return undefined;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("facebook")) return "Facebook";
    if (hostname.includes("offerup")) return "OfferUp";
    if (hostname.includes("craigslist")) return "Craigslist";
    if (hostname.includes("autotrader")) return "Autotrader";
    if (hostname.includes("cargurus")) return "CarGurus";
    if (hostname.includes("cars.com")) return "Cars.com";
    if (hostname.includes("carmax")) return "CarMax";
    if (hostname.includes("carvana")) return "Carvana";
    if (hostname.includes("ebay")) return "eBay Motors";
    return hostname.replace("www.", "").split(".")[0];
  } catch {
    return undefined;
  }
}

// Get source badge color
function getSourceBadgeColor(source: string): { bg: string; text: string } {
  const s = source.toLowerCase();
  if (s.includes("facebook")) return { bg: "bg-blue-500/10", text: "text-blue-600" };
  if (s.includes("offerup")) return { bg: "bg-teal-500/10", text: "text-teal-600" };
  if (s.includes("craigslist")) return { bg: "bg-purple-500/10", text: "text-purple-600" };
  if (s.includes("autotrader")) return { bg: "bg-orange-500/10", text: "text-orange-600" };
  if (s.includes("cargurus")) return { bg: "bg-green-500/10", text: "text-green-600" };
  if (s.includes("cars.com")) return { bg: "bg-red-500/10", text: "text-red-600" };
  if (s.includes("carmax")) return { bg: "bg-yellow-500/10", text: "text-yellow-700" };
  if (s.includes("carvana")) return { bg: "bg-cyan-500/10", text: "text-cyan-600" };
  return { bg: "bg-gray-500/10", text: "text-gray-600" };
}

export function MatchCard({
  match,
  idx = 0,
  userZipCode,
  onAddToShowroom,
  onClick,
  isFavorite = false,
}: MatchCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Calculate distance
  const distance = estimateDistance(match.location, userZipCode);
  
  // Get source from URL
  const source = match.url ? getSourceFromUrl(match.url) : undefined;
  const sourceColors = source ? getSourceBadgeColor(source) : null;
  
  // Check if image URL is external
  const isExternalImage = match.image ? !match.image.startsWith("/") : false;

  // Format mileage
  const formatMiles = (miles?: number) => {
    if (!miles) return null;
    if (miles >= 1000) {
      return `${(miles / 1000).toFixed(0)}k mi`;
    }
    return `${miles.toLocaleString()} mi`;
  };

  // Format time since discovery
  const getDiscoveredText = useCallback(() => {
    if (!match.discoveredAt) return null;
    const discovered = new Date(match.discoveredAt);
    const now = new Date();
    const diffMs = now.getTime() - discovered.getTime();
    
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  }, [match.discoveredAt]);
  
  // Check if we have a valid URL to open
  const hasValidUrl = isValidUrl(match.url);
  
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(match);
    } else if (hasValidUrl && match.url) {
      window.open(match.url, "_blank", "noopener,noreferrer");
    }
  }, [match, onClick, hasValidUrl]);

  const discoveredText = getDiscoveredText();

  return (
    <Card
      onClick={handleClick}
      className={`overflow-hidden border-border bg-card shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 group rounded-2xl flex flex-col h-full relative animate-in fade-in zoom-in-95 ${hasValidUrl || onClick ? "cursor-pointer" : ""}`}
      style={{ animationDelay: `${(idx % 12) * 50}ms`, animationFillMode: "both" }}
    >
      {/* New badge (top-left) */}
      {match.isNew && (
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
            <Sparkles className="w-3 h-3" />
            New
          </span>
        </div>
      )}

      {/* Favorite button (top-right) */}
      {onAddToShowroom && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onAddToShowroom(match);
          }}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-all group/heart"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover/heart:text-red-500"
            }`}
          />
        </button>
      )}

      {/* Price drop badge */}
      {match.priceChange?.direction === "down" && (
        <div className="absolute top-4 right-14 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg">
            <TrendingDown className="w-3 h-3" />
            -{match.priceChange.percentage}%
          </span>
        </div>
      )}

      {/* Image */}
      <div className="p-2 pb-0">
        <AspectRatio ratio={16 / 10} className="bg-muted rounded-xl overflow-hidden flex items-center justify-center relative">
          {imageError || !match.image ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Car className="w-12 h-12 text-muted-foreground/30" />
            </div>
          ) : (
            <Image
              src={match.image}
              alt={match.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImageError(true)}
              unoptimized={isExternalImage}
            />
          )}
          
          {/* Source badge overlay */}
          {source && sourceColors && (
            <div className="absolute top-2 right-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${sourceColors.bg} ${sourceColors.text} text-[10px] font-bold backdrop-blur-sm`}>
                <Globe className="w-3 h-3" />
                {source}
              </span>
            </div>
          )}
          
          {/* Time badge overlay */}
          {discoveredText && (
            <div className="absolute bottom-2 right-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 text-white text-[10px] font-medium backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                {discoveredText}
              </span>
            </div>
          )}
        </AspectRatio>
      </div>

      {/* Content */}
      <CardHeader className="p-4 pb-2 space-y-1">
        <h3 className="font-bold text-[13px] leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {match.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xl font-black text-primary tracking-tight">
            {match.price}
          </p>
          {match.priceChange && (
            <span className="text-xs text-muted-foreground line-through">
              {match.priceChange.previous}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 pb-4 flex flex-col flex-1">
        {/* Location & Dealer */}
        <div className="space-y-2 mb-3">
          {match.location && (
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
              <MapPin className="w-2.5 h-2.5 shrink-0 text-primary/70" />
              <span className="truncate">{match.location}</span>
            </div>
          )}
          {match.dealer && (
            <div className="flex items-start gap-2 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
              <Building2 className="w-2.5 h-2.5 shrink-0 mt-0.5 text-primary/70" />
              <span className="line-clamp-1 leading-relaxed">{match.dealer}</span>
            </div>
          )}
        </div>

        {/* Specs row */}
        <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 mb-4 pb-3 border-b border-border/5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {match.miles && (
              <span className="font-bold flex items-center gap-1">
                <Gauge className="w-2.5 h-2.5" />
                {formatMiles(match.miles)}
              </span>
            )}
            {match.bodyType && (
              <span className="font-bold capitalize">{match.bodyType}</span>
            )}
            {match.fuelType && (
              <span className="font-bold capitalize text-primary/60">{match.fuelType}</span>
            )}
            {match.exteriorColor && (
              <span className="font-bold capitalize">{match.exteriorColor}</span>
            )}
          </div>
          {distance !== undefined && (
            <div className="flex items-center gap-1 text-primary/60 font-bold shrink-0 ml-2">
              <Navigation className="w-2.5 h-2.5" />
              <span>{distance < 1 ? "<1" : Math.round(distance)} mi away</span>
            </div>
          )}
        </div>

        {/* Source button - only show if we have a valid URL */}
        {hasValidUrl && (
          <div className="mt-auto pt-2">
            {source && sourceColors ? (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (match.url) {
                    window.open(match.url, "_blank", "noopener,noreferrer");
                  }
                }}
                variant="outline"
                className={`w-full h-9 rounded-lg text-xs font-semibold border-border/60 transition-all active:scale-[0.98] px-3 ${sourceColors.bg} ${sourceColors.text} border-0 hover:opacity-80`}
              >
                {(() => {
                  const SourceLogo = getSourceLogo(source);
                  return <SourceLogo className="w-4 h-4 mr-2 shrink-0" />;
                })()}
                <span>View on {source}</span>
                <ExternalLink className="w-3 h-3 ml-auto shrink-0 opacity-60" />
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (match.url) {
                    window.open(match.url, "_blank", "noopener,noreferrer");
                  }
                }}
                variant="outline"
                className="w-full h-9 rounded-lg text-xs font-semibold border-border/60 hover:bg-foreground hover:text-background transition-all active:scale-[0.98] px-3"
              >
                <Globe className="w-4 h-4 mr-2 shrink-0" />
                <span>View Listing</span>
                <ExternalLink className="w-3 h-3 ml-auto shrink-0 opacity-60" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for MatchCard
 */
export function MatchCardSkeleton() {
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
