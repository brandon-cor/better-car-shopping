"use client";

import { 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Tag,
  Activity,
  Timer,
  Package
} from "lucide-react";
import { DetailedListing } from "@/lib/schema";
import { formatPrice } from "@/lib/types";

interface PriceInsightsProps {
  listing: DetailedListing;
}

export function PriceInsights({ listing }: PriceInsightsProps) {
  const priceChange = listing.price_change_percent;
  const refPrice = listing.ref_price;
  const currentPrice = listing.price;
  const dom = listing.dom || listing.daysonmarket;
  const firstSeenDate = listing.first_seen_at_mc_date || listing.first_seen_at_date;
  
  // Calculate price difference
  const priceDiff = refPrice && currentPrice ? currentPrice - refPrice : null;
  const hasPriceHistory = priceChange !== undefined && priceChange !== 0;
  
  // Format date
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return undefined;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return undefined;
    }
  };
  
  // Determine price trend
  const getPriceTrend = () => {
    if (!priceChange || priceChange === 0) return null;
    if (priceChange < 0) {
      return {
        direction: 'down' as const,
        icon: <TrendingDown className="w-4 h-4" />,
        color: 'text-primary',
        bgColor: '',
        borderColor: 'border-primary/20',
        label: 'Below Market',
        percent: Math.abs(priceChange).toFixed(1)
      };
    }
    return {
      direction: 'up' as const,
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'text-muted-foreground',
      bgColor: '',
      borderColor: 'border-border/40',
      label: 'Above Market',
      percent: Math.abs(priceChange).toFixed(1)
    };
  };
  
  const priceTrend = getPriceTrend();
  
  // Determine market position based on days on market
  const getMarketPosition = () => {
    if (!dom) return null;
    if (dom <= 14) {
      return { label: 'New Listing', color: 'text-primary', bg: 'bg-primary/5', icon: <Clock className="w-3.5 h-3.5" /> };
    }
    if (dom <= 30) {
      return { label: 'Fresh', color: 'text-primary', bg: 'bg-primary/5', icon: <CheckCircle2 className="w-3.5 h-3.5" /> };
    }
    if (dom <= 60) {
      return { label: 'Available', color: 'text-muted-foreground', bg: 'bg-muted/5', icon: <AlertCircle className="w-3.5 h-3.5" /> };
    }
    return { label: 'Mature', color: 'text-muted-foreground', bg: 'bg-muted/5', icon: <Calendar className="w-3.5 h-3.5" /> };
  };
  
  const marketPosition = getMarketPosition();
  
  // Don't render if no meaningful data
  if (!hasPriceHistory && !dom && !firstSeenDate) return null;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Pricing & Market Analysis</h2>
      </div>

      <div className="rounded-2xl border border-border/10 shadow-sm overflow-hidden">
        {/* Price Comparison Header */}
        <div className="p-5 border-b border-border/20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Asking Price</p>
              <p className="text-3xl font-black text-primary tracking-tight">
                {formatPrice(currentPrice)}
              </p>
            </div>
            
            {priceTrend && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${priceTrend.bgColor} ${priceTrend.color} ${priceTrend.borderColor} border`}>
                {priceTrend.icon}
                <span>{priceTrend.percent}% {priceTrend.label}</span>
              </div>
            )}
          </div>
          
          {refPrice && currentPrice && priceDiff !== null && (
            <div className="mt-4 pt-4 border-t border-border/10">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Market Value</p>
                  <p className="text-base font-bold">{formatPrice(refPrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Your Price</p>
                  <p className="text-base font-bold">{formatPrice(currentPrice)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">You Save</p>
                  <p className={`text-base font-bold ${priceDiff < 0 ? 'text-primary' : 'text-foreground'}`}>
                    {priceDiff === 0 ? '$0' : priceDiff < 0 ? `+${formatPrice(Math.abs(priceDiff))}` : `-${formatPrice(Math.abs(priceDiff))}`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border/20">
          {/* Days on Market */}
          {dom !== undefined && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 text-primary mb-2">
                <Timer className="w-4 h-4" />
              </div>
              <p className="text-xl font-black">{dom}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Days Listed</p>
              {marketPosition && (
                <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${marketPosition.color} ${marketPosition.bg}`}>
                  {marketPosition.icon}
                  {marketPosition.label}
                </span>
              )}
            </div>
          )}

          {/* 180d Market Avg */}
          {listing.dom_180 !== undefined && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground/60 mb-2">
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-xl font-black">{listing.dom_180}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Avg Market Days</p>
            </div>
          )}

          {/* Active Duration */}
          {listing.dom_active !== undefined && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground/60 mb-2">
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xl font-black">{listing.dom_active}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Active Days</p>
            </div>
          )}

          {/* Availability */}
          <div className="p-4 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground/60 mb-2">
              <Package className="w-4 h-4" />
            </div>
            <p className="text-xl font-black">{listing.in_transit ? 'Transit' : 'Stock'}</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Availability</p>
          </div>
        </div>

        {/* Timeline Footer */}
        {(firstSeenDate || listing.last_seen_at_date) && (
          <div className="px-5 py-3 bg-muted/10 border-t border-border/20 flex items-center justify-between text-xs">
            {firstSeenDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                <span>First listed: <span className="font-semibold text-foreground">{formatDate(firstSeenDate)}</span></span>
              </div>
            )}
            {listing.last_seen_at_date && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span>Verified: <span className="font-semibold text-foreground">{formatDate(listing.last_seen_at_date)}</span></span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
