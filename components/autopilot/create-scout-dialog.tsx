"use client";

import { useState, useEffect } from "react";
import { ScoutInterval } from "@/lib/autopilot";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Loader2,
  ArrowRight,
} from "lucide-react";
import { BinocularsIcon } from "@/components/ui/binoculars-icon";

interface CreateScoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateScout: (query: string, interval: ScoutInterval) => Promise<void>;
}

const ROTATING_PLACEHOLDERS = [
  "Scout for Toyota RAV4 under $30k...",
  "Scout for EVs with 250+ mile range...",
  "Scout for trucks with towing package...",
  "Scout for luxury sedans under $45k...",
  "Scout for certified pre-owned Honda...",
  "Scout for SUVs with third row seating...",
];

const EXAMPLE_SCOUTS = [
  { query: "SUVs under $35k with AWD", category: "SUV" },
  { query: "Toyota Camry 2020-2024 low miles", category: "Sedan" },
  { query: "Electric vehicles in California", category: "EV" },
  { query: "Pickup trucks with 4WD", category: "Truck" },
  { query: "Certified pre-owned BMW", category: "Luxury" },
  { query: "Minivans under $30k", category: "Family" },
];

// Helper function to detect frequency from natural language query
function detectIntervalFromQuery(query: string): ScoutInterval {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes("hourly") || lowerQuery.includes("every hour")) {
    return "hourly";
  }
  // Default to daily for most vehicle monitoring
  return "daily";
}

export function CreateScoutDialog({
  open,
  onOpenChange,
  onCreateScout,
}: CreateScoutDialogProps) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Rotate placeholder text like Yutori does
  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError("Please describe what vehicles you want to scout");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Detect interval from query text, default to daily
      const interval = detectIntervalFromQuery(query);
      await onCreateScout(query.trim(), interval);
      setQuery("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deploy scout");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden.Root>
          <DialogTitle>Deploy a Scout</DialogTitle>
        </VisuallyHidden.Root>
        
        {/* Header with icon and title - similar to Yutori */}
        <div className="p-6 pb-4 text-center">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center">
            <BinocularsIcon className="w-12 h-12" animate={false} />
          </div>
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            Scouts monitor the market.
          </h2>
          <p className="text-2xl font-semibold text-muted-foreground">
            For you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-2">
          {/* Simple input like Yutori */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              placeholder={ROTATING_PLACEHOLDERS[placeholderIndex]}
              className="w-full h-14 pl-5 pr-14 rounded-full border-2 border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base transition-all"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-destructive mt-2 text-center">{error}</p>
          )}
        </form>

        {/* Example scouts as clickable chips - like Yutori's category examples */}
        <div className="px-6 pb-6 pt-4">
          <p className="text-xs text-muted-foreground text-center mb-3">
            Try one of these examples
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_SCOUTS.map((example, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleExampleClick(example.query)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50 disabled:opacity-50"
              >
                {example.query}
              </button>
            ))}
          </div>
        </div>

        {/* Subtle footer info */}
        <div className="border-t border-border/50 px-6 py-4 bg-muted/30">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Your scout will continuously monitor listings and alert you when new matches appear.
            Include location or specific criteria for better results.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

