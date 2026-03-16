"use client";

import { useState } from "react";
import { 
  Car, 
  Gauge, 
  Fuel, 
  Settings, 
  TrendingDown,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { DetailedListing } from "@/lib/schema";
import { formatPrice } from "@/lib/types";

interface VehicleHeaderProps {
  listing: DetailedListing;
  variant?: "full" | "sidebar";
}

function VinBadge({ vin }: { vin: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy VIN:', err);
    }
  };
  
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-[10px] font-medium text-muted-foreground uppercase shrink-0">VIN</span>
      <span className="text-xs font-mono text-muted-foreground tracking-wide truncate">{vin}</span>
      <button
        onClick={handleCopy}
        className="ml-auto p-0.5 hover:text-primary transition-colors shrink-0"
        title="Copy VIN"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-primary" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    </div>
  );
}


export function VehicleHeader({ listing, variant = "full" }: VehicleHeaderProps) {
  const build = listing.build;
  const priceChange = listing.price_change_percent;
  const hasPriceReduction = priceChange !== undefined && priceChange < 0;
  const isSidebar = variant === "sidebar";
  
  const title = listing.heading || 
    [listing.year, listing.make, listing.model, listing.trim].filter(Boolean).join(' ');

  // Sidebar variant - clean vertical layout
  if (isSidebar) {
    return (
      <div className="bg-card border border-border/30 rounded-xl p-4 space-y-3">
        {/* Title */}
        <h1 className="text-lg font-bold text-foreground leading-snug">
          {title}
        </h1>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">
            {formatPrice(listing.price)}
          </span>
          {hasPriceReduction && (
            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              {Math.abs(priceChange).toFixed(1)}% below
            </span>
          )}
        </div>

        {/* VIN */}
        {listing.vin && <VinBadge vin={listing.vin} />}

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-border/10">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Mileage</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-primary" />
              {listing.miles ? `${listing.miles.toLocaleString()} mi` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Body</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-primary" />
              {listing.body_type || build?.body_type || '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Trans</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              <Settings className="w-3.5 h-3.5 text-primary" />
              {listing.transmission || build?.transmission || '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Fuel</p>
            <p className="text-sm font-semibold flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-primary" />
              {listing.fuel_type || build?.fuel_type || '—'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Full variant - original layout for main content area
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="space-y-0.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground leading-tight">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium flex-wrap">
              <span>{listing.year}</span>
              <span>{listing.make}</span>
              <span>{listing.model}</span>
              {listing.trim && <span className="text-primary/80">• {listing.trim}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {listing.vin && (
              <div className="flex items-center gap-2 border border-border/10 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase">VIN:</span>
                <span className="text-sm font-mono font-medium tracking-wide">{listing.vin}</span>
              </div>
            )}
            
            {listing.carfax_1_owner && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-border/40 text-muted-foreground text-[10px] font-bold uppercase">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                1-Owner
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end gap-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter">
              {formatPrice(listing.price)}
            </span>
            {listing.msrp && listing.msrp > (listing.price || 0) && (
              <span className="text-sm text-muted-foreground line-through font-medium">
                {formatPrice(listing.msrp)}
              </span>
            )}
          </div>
          {hasPriceReduction && (
            <div className="flex items-center gap-1 px-2 py-0.5 border border-primary/20 text-primary rounded text-[10px] font-bold">
              <TrendingDown className="w-3 h-3" />
              <span>{Math.abs(priceChange).toFixed(1)}% below market</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Specs Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/10">
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Mileage</span>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Gauge className="w-3.5 h-3.5 text-primary" />
            <span>{listing.miles ? `${listing.miles.toLocaleString()} mi` : '—'}</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Body Style</span>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Car className="w-3.5 h-3.5 text-primary" />
            <span>{listing.body_type || build?.body_type || '—'}</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Transmission</span>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Settings className="w-3.5 h-3.5 text-primary" />
            <span>{listing.transmission || build?.transmission || '—'}</span>
          </div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fuel Type</span>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            <Fuel className="w-3.5 h-3.5 text-primary" />
            <span>{listing.fuel_type || build?.fuel_type || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
