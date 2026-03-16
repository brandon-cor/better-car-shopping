"use client";

import { Phone, ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailedListing } from "@/lib/schema";
import { DisplayListing } from "@/lib/types";

interface ActionButtonsProps {
  listing: DetailedListing;
  displayListing: DisplayListing;
  favorites: DisplayListing[];
  toggleFavorite: (listing: DisplayListing) => void;
  openCallDialog: (listing: DisplayListing) => void;
  loading: string | null;
}

export function ActionButtons({
  listing,
  displayListing,
  favorites,
  toggleFavorite,
  openCallDialog,
  loading,
}: ActionButtonsProps) {
  const isFavorite = favorites.some((f) => f.id === displayListing.id);
  const phoneNumber = listing.dealer?.phone;

  return (
    <div className="bg-card/80 border border-border/30 rounded-2xl p-3 shadow-sm shadow-foreground/5 space-y-2.5">
      <div className="space-y-1">
        <Button
          onClick={() => openCallDialog(displayListing)}
          disabled={loading === listing.id || !phoneNumber}
          className="w-full h-11 rounded-xl font-bold text-sm uppercase tracking-wider shadow-md shadow-primary/15 hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Phone className="w-4 h-4 mr-2" />
          {loading === listing.id ? "Connecting..." : "Contact Dealer"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {listing.vdp_url && (
          <Button
            onClick={() => window.open(listing.vdp_url, "_blank", "noopener,noreferrer")}
            variant="outline"
            className="h-10 rounded-lg text-xs font-bold uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            Dealer Website
          </Button>
        )}
        <Button
          onClick={() => phoneNumber && window.open(`tel:${phoneNumber}`)}
          variant="outline"
          disabled={!phoneNumber}
          className="h-10 rounded-lg text-xs font-bold uppercase tracking-wider border-border/60 hover:bg-muted/40 transition-colors flex items-center justify-center gap-2"
        >
          <Phone className="w-3.5 h-3.5 mr-0 text-muted-foreground" />
          {phoneNumber ? phoneNumber : "Phone Unavailable"}
        </Button>
        <Button
          onClick={() => toggleFavorite(displayListing)}
          variant="outline"
          className="h-10 rounded-lg text-xs font-bold uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-colors"
        >
          <Heart
            className={`w-3.5 h-3.5 mr-2 transition-colors ${
              isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
          {isFavorite ? "Saved" : "Save Car"}
        </Button>
      </div>
    </div>
  );
}

