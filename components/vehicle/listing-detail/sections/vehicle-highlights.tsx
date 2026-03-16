"use client";

import { Check, Sparkles } from "lucide-react";
import { DetailedListing } from "@/lib/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface VehicleHighlightsProps {
  listing: DetailedListing;
}

export function VehicleHighlights({ listing }: VehicleHighlightsProps) {
  const highValueFeatures = listing.extra?.high_value_features;
  
  if (!highValueFeatures || highValueFeatures.length === 0) return null;
  
  // Group features by category
  const categoryMap: Record<string, string[]> = {};
  
  for (const feature of highValueFeatures) {
    const category = feature.category || 'Other';
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    if (feature.description && !categoryMap[category].includes(feature.description)) {
      categoryMap[category].push(feature.description);
    }
  }
  
  // Get all unique features for a flat list
  const allFeatures = [...new Set(highValueFeatures.map(f => f.description).filter(Boolean))];
  
  const categories = Object.entries(categoryMap).filter(([_, features]) => features.length > 0);
  
  if (categories.length === 0 && allFeatures.length === 0) return null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Features & Highlights</h2>
      </div>

      <div className="border border-border/10 rounded-3xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
          {allFeatures.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 group">
              <div className="w-5 h-5 flex items-center justify-center shrink-0 transition-colors">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-[11px] text-foreground/80 font-bold uppercase tracking-wide leading-tight group-hover:text-foreground transition-colors">{feature}</span>
            </div>
          ))}
        </div>
        
        {/* Factory Packages */}
        {listing.extra?.options_packages && listing.extra.options_packages.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border/10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
              Installed Packages
            </h4>
            <div className="flex flex-wrap gap-2">
              {listing.extra.options_packages.map((pkg, idx) => (
                <div 
                  key={idx}
                  className="px-3 py-1.5 rounded-xl border border-border/40 text-muted-foreground text-[10px] font-black uppercase tracking-wider shadow-sm hover:border-primary/40 hover:text-primary transition-all cursor-default"
                >
                  {pkg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
