"use client";

import { History, ShieldAlert, Users, ExternalLink, FileCheck, Gauge } from "lucide-react";
import { DetailedListing } from "@/lib/schema";

interface VehicleHistoryProps {
  listing: DetailedListing;
}

export function VehicleHistory({ listing }: VehicleHistoryProps) {
  const history = listing.history;
  const accidents = history?.accident_count ?? 0;
  const owners = history?.ownership_history?.length ?? (listing.carfax_1_owner ? 1 : undefined);
  
  // Find potential history report links
  // Often dealers include these in their VDP or they might be in specific fields we can look for
  const hasCarfax = listing.carfax_clean_title !== undefined || listing.carfax_1_owner !== undefined;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">History & Condition</h2>
      </div>

      <div className="rounded-2xl p-4 border border-border/10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-2">
          {/* Mileage */}
          <div className="text-center md:text-left space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
              <Gauge className="w-3 h-3" />
              Current Odometer
            </p>
            <p className="text-2xl font-black text-foreground tracking-tighter">
              {listing.miles ? listing.miles.toLocaleString() : '—'}
              <span className="text-xs ml-1 text-muted-foreground font-medium uppercase">mi</span>
            </p>
          </div>

          {/* Accidents */}
          <div className="text-center md:text-left space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
              <ShieldAlert className="w-3 h-3" />
              Reported Accidents
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              {accidents > 0 ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-primary" />
                  <p className="text-2xl font-black text-foreground tracking-tighter">{accidents}</p>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 text-primary" />
                  <p className="text-2xl font-black text-foreground tracking-tighter">None</p>
                </>
              )}
            </div>
          </div>

          {/* Owners */}
          <div className="text-center md:text-left space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center md:justify-start gap-1">
              <Users className="w-3 h-3" />
              Previous Owners
            </p>
            <div className="flex items-center justify-center md:justify-start gap-1.5">
              <Users className="w-4 h-4 text-primary/60" />
              <p className="text-2xl font-black text-foreground tracking-tighter">
                {owners ?? '—'}
              </p>
            </div>
          </div>
        </div>

        {/* History Sources */}
        <div className="mt-6 pt-4 border-t border-border/10">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Verification Sources</p>
          <div className="flex flex-wrap items-center gap-2">
            {hasCarfax && (
              <a 
                href={listing.vdp_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
              >
                <div className="w-5 h-5 rounded-md text-muted-foreground font-black text-[9px]">CF</div>
                <div className="flex-1">
                  <p className="text-[9px] font-bold leading-tight">CARFAX® Report</p>
                </div>
                <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            )}
            
            <a 
              href={listing.vdp_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              <div className="w-5 h-5 rounded-md text-muted-foreground font-black text-[9px]">AC</div>
              <div className="flex-1">
                <p className="text-[9px] font-bold leading-tight">AutoCheck®</p>
              </div>
              <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <p className="text-[8px] text-muted-foreground italic ml-auto">
              *Reports hosted on authorized dealer site
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

