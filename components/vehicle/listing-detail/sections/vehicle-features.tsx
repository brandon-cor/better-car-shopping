"use client";

import { DetailedListing } from "@/lib/schema";

interface VehicleFeaturesProps {
  listing: DetailedListing;
}

export function VehicleFeatures({ listing }: VehicleFeaturesProps) {
  if (!listing.features) return null;

  const { features } = listing;
  
  // Collect all features into categories
  const allFeatures: { category: string; items: string[] }[] = [];
  
  if (features.packages && features.packages.length > 0) {
    allFeatures.push({ category: "Packages", items: features.packages });
  }
  if (features.safety_features && features.safety_features.length > 0) {
    allFeatures.push({ category: "Safety", items: features.safety_features.slice(0, 12) });
  }
  if (features.tech_features && features.tech_features.length > 0) {
    allFeatures.push({ category: "Technology", items: features.tech_features.slice(0, 12) });
  }

  if (allFeatures.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Features & Options</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {allFeatures.map(({ category, items }) => (
          <div key={category} className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">{category}</p>
            <div className="border border-border/10 rounded-3xl p-5 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 group-hover:scale-125 group-hover:bg-primary transition-all" />
                    <span className="text-[11px] text-foreground/80 font-bold uppercase tracking-wide truncate group-hover:text-foreground transition-colors">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
