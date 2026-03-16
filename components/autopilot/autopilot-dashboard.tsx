"use client";

import { useState, useEffect, useCallback } from "react";
import { Scout, VehicleMatch, ScoutUpdate, ScoutInterval } from "@/lib/autopilot";
import { ScoutCard } from "./scout-card";
import { MatchCard } from "./match-card";
import { CreateScoutDialog } from "./create-scout-dialog";
import { Button } from "@/components/ui/button";
import { EmptyStateCards, CardEvent } from "@/components/ui/empty-state-cards";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/components/providers/preferences-provider";
import { useUser, SignUpButton, SignInButton } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Radar,
  Plus,
  ArrowLeft,
  Loader2,
  Sparkles,
  Zap,
  Target,
  Bot,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Link2,
  Users,
  Timer,
  Globe,
  Search,
} from "lucide-react";
import { UpgradeLimitModal, LimitFeature } from "@/components/pricing";

/**
 * Check if a URL is valid (starts with http:// or https://)
 */
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parse content sections from Yutori update.
 * Yutori returns content with sections like "What's new:", "Fast-moving listings:", etc.
 */
interface ParsedContent {
  title?: string;
  subtitle?: string;
  sections: Array<{
    heading: string;
    content: string;
    items?: Array<{
      text: string;
      source?: string;
      sourceUrl?: string;
    }>;
  }>;
  summary?: string;
}

/**
 * Split vehicle listings from a paragraph.
 * Vehicles are separated by patterns like "2001 Honda" or ". 2014 Kia"
 */
function splitVehicleListings(text: string, citations?: Array<{ url: string }>): Array<{ text: string; source?: string; sourceUrl?: string }> {
  if (!text) return [];
  
  // Pattern to match start of vehicle listing: Year (4 digits) followed by Make
  // Look for: ". YYYY Make" or start of string "YYYY Make"
  const vehiclePattern = /(?:^|[.!]\s*)(\d{4}\s+[A-Z][a-zA-Z-]+)/g;
  
  const items: Array<{ text: string; source?: string; sourceUrl?: string }> = [];
  let lastIndex = 0;
  let match;
  const matches: { index: number; text: string }[] = [];
  
  // Find all vehicle starts
  while ((match = vehiclePattern.exec(text)) !== null) {
    // Get the actual start position of the year
    const yearMatch = match[1];
    const yearIndex = text.indexOf(yearMatch, match.index);
    matches.push({ index: yearIndex, text: yearMatch });
  }
  
  // Extract each vehicle listing
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : text.length;
    let itemText = text.slice(start, end).trim();
    
    // Clean up trailing punctuation
    itemText = itemText.replace(/[.!]\s*$/, "").trim();
    
    if (itemText.length > 10) {
      // Extract source from parentheses at end
      let source: string | undefined;
      let sourceUrl: string | undefined;
      
      const sourceMatch = itemText.match(/\(([^)]+)\)\.?\s*$/);
      if (sourceMatch) {
        const possibleSource = sourceMatch[1].toLowerCase();
        if (possibleSource.includes("facebook")) {
          source = "Facebook";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        } else if (possibleSource.includes("offerup")) {
          source = "OfferUp";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        } else if (possibleSource.includes("craigslist")) {
          source = "Craigslist";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        } else if (possibleSource.includes("autotrader")) {
          source = "Autotrader";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        } else if (possibleSource.includes("cargurus")) {
          source = "CarGurus";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        } else if (possibleSource.includes("cars.com")) {
          source = "Cars.com";
          itemText = itemText.replace(/\s*\([^)]*\)\.?\s*$/, "");
        }
      }
      
      // Try to find matching citation URL (only use valid URLs)
      if (citations && citations.length > 0 && source) {
        const citation = citations.find(c => {
          if (!isValidUrl(c.url)) return false;
          const url = c.url.toLowerCase();
          if (source === "Facebook") return url.includes("facebook.com");
          if (source === "OfferUp") return url.includes("offerup.com");
          if (source === "Craigslist") return url.includes("craigslist");
          if (source === "Autotrader") return url.includes("autotrader");
          if (source === "CarGurus") return url.includes("cargurus");
          if (source === "Cars.com") return url.includes("cars.com");
          return false;
        });
        if (citation) {
          sourceUrl = citation.url;
        }
      }
      
      items.push({ text: itemText, source, sourceUrl });
    }
  }
  
  return items;
}

function parseUpdateContent(content: string, citations?: Array<{ url: string }>): ParsedContent {
  if (!content) return { sections: [] };
  
  const result: ParsedContent = { sections: [] };
  
  // Clean up HTML tags and markdown
  let cleaned = content
    .replace(/<[^>]*>/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .trim();
  
  // Split by double newlines or section headers
  const parts = cleaned.split(/\n\n+/);
  
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    
    // Check if this is a section header (contains colon)
    const headerMatch = trimmed.match(/^([^:]{3,60}):\s*([\s\S]*)$/);
    
    if (headerMatch) {
      const heading = headerMatch[1].trim();
      const sectionContent = headerMatch[2].trim();
      
      // Check if this looks like a market summary
      if (heading.toLowerCase().includes("summary") || heading.toLowerCase().includes("market")) {
        result.summary = sectionContent;
      } else if (heading.toLowerCase().includes("title") || heading.toLowerCase() === "what's new") {
        // This might be an intro paragraph
        result.sections.push({
          heading,
          content: sectionContent,
          items: [],
        });
      } else {
        // Try to split content into vehicle listings
        const items = splitVehicleListings(sectionContent, citations);
        
        result.sections.push({
          heading,
          content: items.length > 0 ? "" : sectionContent,
          items: items.length > 0 ? items : [],
        });
      }
    } else {
      // No header - might be title or intro
      if (!result.title && trimmed.length < 100) {
        result.title = trimmed;
      } else if (!result.summary) {
        result.summary = trimmed;
      }
    }
  }
  
  return result;
}

/**
 * Get source badge color based on platform
 */
function getSourceBadgeStyle(source: string): { bg: string; text: string } {
  const s = source.toLowerCase();
  if (s.includes("facebook")) return { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" };
  if (s.includes("offerup")) return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" };
  if (s.includes("craigslist")) return { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
  if (s.includes("autotrader")) return { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" };
  if (s.includes("cargurus")) return { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400" };
  if (s.includes("cars.com")) return { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" };
  return { bg: "bg-muted", text: "text-muted-foreground" };
}

/**
 * Format time saved from seconds to readable string
 */
function formatTimeSaved(seconds?: number): string {
  if (!seconds || seconds < 60) return "";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `~${minutes} minutes`;
  const hours = Math.round(minutes / 60);
  return `~${hours} hour${hours > 1 ? "s" : ""}`;
}

const AUTOPILOT_EMPTY_CARDS: CardEvent[] = [
  {
    id: 1,
    title: "Market Scanner",
    subtitle: "Monitoring SUVs under $35k",
    location: "San Francisco, CA",
    image: "/aesthetic/Surreal Cityscape Sunset Photo.png",
    badge: "Scanning",
    badgeIcon: "zap" as const,
  },
  {
    id: 2,
    title: "Price Watcher",
    subtitle: "Tracking Porsche 911 deals",
    location: "24/7 Monitoring",
    image: "/aesthetic/Sleek Race Car in Fog.png",
    badge: "Active",
    badgeIcon: "clock" as const,
  },
  {
    id: 3,
    title: "New Inventory Alert",
    subtitle: "Toyota Tacoma TRD Pro",
    location: "Los Angeles, CA",
    image: "/aesthetic/Classic Porsche Scene Photo.png",
    badge: "3 Found",
    badgeIcon: "star" as const,
  },
];

interface AutopilotDashboardProps {
  onDeepResearch?: (vehicle: VehicleMatch) => void;
  onAddToShowroom?: (vehicle: VehicleMatch) => void;
}

export function AutopilotDashboard({
  onDeepResearch,
  onAddToShowroom,
}: AutopilotDashboardProps) {
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const { isSignedIn, isLoaded } = useUser();
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Detail view state
  const [selectedScout, setSelectedScout] = useState<Scout | null>(null);
  const [scoutUpdates, setScoutUpdates] = useState<ScoutUpdate[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Upgrade modal state for rate limits
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeLimit, setUpgradeLimit] = useState<number | undefined>();
  const [upgradeResetTime, setUpgradeResetTime] = useState<number | undefined>();
  
  // Sign-up prompt dialog for non-authenticated users
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  // Fetch all scouts
  const fetchScouts = useCallback(async () => {
    // Wait for Clerk to load, then check if signed in
    if (!isLoaded) {
      return; // Will be called again when isLoaded changes
    }
    
    // Skip fetching if user is not signed in
    if (!isSignedIn) {
      setScouts([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const res = await fetch("/api/autopilot/scouts");
      
      // Handle 401 gracefully - user not authenticated
      if (res.status === 401) {
        setScouts([]);
        setIsLoading(false);
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch scouts");
      
      const data = await res.json();
      setScouts(data.scouts || []);
      
      if (data.isDemo) {
        console.log("Running in demo mode - Yutori API not configured");
      }
    } catch (error) {
      console.error("Error fetching scouts:", error);
      toast({
        title: "Error",
        description: "Failed to load your scouts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, isSignedIn, isLoaded]);

  // Fetch scout details and matches
  const fetchScoutDetails = useCallback(async (scoutId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/autopilot/scouts/${scoutId}`);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch scout details");
      }
      
      setSelectedScout(data.scout);
      setScoutUpdates(data.updates || []);
    } catch (error) {
      console.error("Error fetching scout details:", error);
      toast({
        title: "Error",
        description: "Failed to load matches. The scout may still be initializing.",
        variant: "destructive",
      });
      // Go back to list view on error
      setSelectedScout(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [toast]);

  // Create a new scout
  const handleCreateScout = useCallback(async (query: string, interval: ScoutInterval) => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/autopilot/scouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, interval }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        
        // Handle auth error - user session may have expired
        if (res.status === 401) {
          toast({
            title: "Session Expired",
            description: "Please sign in again to deploy a scout.",
            variant: "destructive",
          });
          return;
        }
        
        // Handle rate limit error
        if (res.status === 429 && error.code === "USER_LIMIT_REACHED") {
          setUpgradeLimit(error.limit);
          setUpgradeResetTime(error.reset);
          setIsUpgradeModalOpen(true);
          return; // Don't throw, modal will handle the message
        }
        
        throw new Error(error.error || "Failed to create scout");
      }
      
      const data = await res.json();
      
      toast({
        title: "Scout Deployed! 🚀",
        description: "Your scout is now monitoring the market for you.",
      });
      
      // Refresh the list
      await fetchScouts();
    } catch (error) {
      console.error("Error creating scout:", error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [toast, fetchScouts]);

  // Pause a scout
  const handlePauseScout = useCallback(async (scoutId: string) => {
    try {
      const res = await fetch(`/api/autopilot/scouts/${scoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause" }),
      });
      
      if (!res.ok) throw new Error("Failed to pause scout");
      
      toast({
        title: "Scout Paused",
        description: "Monitoring has been paused. Resume anytime.",
      });
      
      await fetchScouts();
    } catch (error) {
      console.error("Error pausing scout:", error);
      toast({
        title: "Error",
        description: "Failed to pause scout",
        variant: "destructive",
      });
    }
  }, [toast, fetchScouts]);

  // Resume a scout
  const handleResumeScout = useCallback(async (scoutId: string) => {
    try {
      const res = await fetch(`/api/autopilot/scouts/${scoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume" }),
      });
      
      if (!res.ok) throw new Error("Failed to resume scout");
      
      toast({
        title: "Scout Resumed",
        description: "Your scout is back to monitoring.",
      });
      
      await fetchScouts();
    } catch (error) {
      console.error("Error resuming scout:", error);
      toast({
        title: "Error",
        description: "Failed to resume scout",
        variant: "destructive",
      });
    }
  }, [toast, fetchScouts]);

  // Delete a scout
  const handleDeleteScout = useCallback(async (scoutId: string) => {
    try {
      const res = await fetch(`/api/autopilot/scouts/${scoutId}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete scout");
      
      toast({
        title: "Scout Deleted",
        description: "The scout has been removed.",
      });
      
      await fetchScouts();
    } catch (error) {
      console.error("Error deleting scout:", error);
      toast({
        title: "Error",
        description: "Failed to delete scout",
        variant: "destructive",
      });
    }
  }, [toast, fetchScouts]);

  // Open create dialog with auth check
  const handleOpenCreateDialog = useCallback(() => {
    if (!isLoaded || !isSignedIn) {
      setIsAuthDialogOpen(true);
      return;
    }
    setShowCreateDialog(true);
  }, [isSignedIn, isLoaded]);

  // View matches for a scout
  const handleViewMatches = useCallback((scout: Scout) => {
    setSelectedScout(scout);
    fetchScoutDetails(scout.id);
  }, [fetchScoutDetails]);

  // Go back to list view
  const handleBackToList = useCallback(() => {
    setSelectedScout(null);
    setScoutUpdates([]);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchScouts();
  }, [fetchScouts]);

  // Get all matches from updates
  const allMatches = scoutUpdates.flatMap((update) => update.vehicles);
  const newMatches = allMatches.filter((m) => m.isNew);
  const previousMatches = allMatches.filter((m) => !m.isNew);

  // Stats for header
  const activeScouts = scouts.filter((s) => s.status === "active").length;
  const totalMatches = scouts.reduce((sum, s) => sum + s.matchCount, 0);
  const newMatchesCount = scouts.reduce((sum, s) => sum + s.newMatchCount, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Radar className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Loading your scouts...</p>
        </div>
      </div>
    );
  }

  // Detail view (viewing matches for a specific scout)
  if (selectedScout) {
    return (
      <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        {/* Back button and header */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Scouts</span>
          </button>
        </div>

        {/* Scout info header */}
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/60 border border-border/30">
          <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            selectedScout.status === "active"
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-amber-500/10 text-amber-500"
          }`}>
            <Radar className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {selectedScout.displayName}
            </h2>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {selectedScout.query}
            </p>
          </div>
        </div>

        {/* Loading state */}
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : allMatches.length === 0 ? (
          <div className="space-y-6">
            {/* Show content summaries from updates if available */}
            {scoutUpdates.some(u => u.content) && (
              <div className="space-y-6">
                {scoutUpdates.filter(u => u.content).slice(0, 5).map((update) => {
                  const parsed = parseUpdateContent(update.content || "", update.citations);
                  const timeSaved = formatTimeSaved(update.stats?.sec_saved);
                  const agentCount = (update.stats?.num_tool_calls || 0) + (update.stats?.num_mcp_tool_calls || 0);
                  
                  return (
                    <div key={update.id} className="relative">
                      {/* Date header with accent line - Yutori style */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-rose-500/50 to-rose-500/0" />
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {new Date(update.createdAt).toLocaleDateString("en-US", { 
                            month: "short", 
                            day: "numeric", 
                            year: "numeric" 
                          }).toUpperCase()} AT {new Date(update.createdAt).toLocaleTimeString("en-US", { 
                            hour: "numeric", 
                            minute: "2-digit" 
                          }).toUpperCase()}
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-l from-rose-500/50 to-rose-500/0" />
                      </div>
                      
                      {/* Content card */}
                      <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                        <div className="p-6 space-y-5">
                          {/* Title */}
                          {parsed.title && (
                            <h3 className="text-xl font-semibold text-foreground">
                              {parsed.title}
                            </h3>
                          )}
                          
                          {/* Sections */}
                          {parsed.sections.map((section, sIdx) => (
                            <div key={sIdx} className="space-y-3">
                              <h4 className="text-sm font-semibold text-foreground">
                                {section.heading}:
                              </h4>
                              
                              {/* Section content paragraph */}
                              {section.content && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {section.content}
                                </p>
                              )}
                              
                              {/* Section items as bullet list - one line each */}
                              {section.items && section.items.length > 0 && (
                                <ul className="space-y-1.5">
                                  {section.items.map((item, iIdx) => (
                                    <li key={iIdx} className="flex items-center gap-2 text-sm">
                                      <span className="text-muted-foreground">•</span>
                                      <span className="flex-1 text-foreground truncate">
                                        {item.text.replace(/\s*\([^)]*\)\.?\s*$/, "")}
                                      </span>
                                      {item.source && item.sourceUrl && isValidUrl(item.sourceUrl) ? (
                                        <a 
                                          href={item.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer hover:opacity-80 transition-opacity ${getSourceBadgeStyle(item.source).bg} ${getSourceBadgeStyle(item.source).text}`}
                                        >
                                          <Globe className="w-3 h-3" />
                                          {item.source}
                                        </a>
                                      ) : item.source ? (
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${getSourceBadgeStyle(item.source).bg} ${getSourceBadgeStyle(item.source).text}`}>
                                          <Globe className="w-3 h-3" />
                                          {item.source}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                          
                          {/* Market summary */}
                          {parsed.summary && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-foreground">
                                Market summary:
                              </h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {parsed.summary}
                              </p>
                            </div>
                          )}
                          
                          {/* If no parsed sections, show raw content nicely */}
                          {parsed.sections.length === 0 && !parsed.summary && update.content && (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                              {update.content
                                .replace(/<[^>]*>/g, "")
                                .replace(/\*\*([^*]+)\*\*/g, "$1")
                                .replace(/\*([^*]+)\*/g, "$1")
                                .slice(0, 1000)}
                            </p>
                          )}
                        </div>
                        
                        {/* Footer with stats and actions - Yutori style */}
                        <div className="px-6 py-4 bg-muted/30 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {agentCount > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{agentCount} agents</span>
                                </span>
                              )}
                              {timeSaved && (
                                <span className="flex items-center gap-1.5">
                                  <Timer className="w-3.5 h-3.5" />
                                  <span>saving you {timeSaved} of browsing</span>
                                </span>
                              )}
                              {update.citations && update.citations.length > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <Globe className="w-3.5 h-3.5" />
                                  <span>{update.citations.length} sources</span>
                                </span>
                              )}
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex items-center gap-1">
                              {update.citations && update.citations.length > 0 && (
                                <button
                                  onClick={() => window.open(update.citations![0].url, "_blank")}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                  title="View source"
                                >
                                  <Link2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(update.content || "");
                                  toast({ title: "Copied to clipboard" });
                                }}
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Copy content"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Helpful"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Not helpful"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* No updates message */}
            {!scoutUpdates.some(u => u.content) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <Target className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No matches yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your scout is actively monitoring. New matches will appear here as they're discovered.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* New matches section */}
            {newMatches.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    {newMatches.length} New Matches
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {newMatches.map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      idx={idx}
                      userZipCode={preferences.zipCode}
                      onAddToShowroom={onAddToShowroom}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Previous matches section */}
            {previousMatches.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Previous Matches ({previousMatches.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previousMatches.map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      idx={idx}
                      userZipCode={preferences.zipCode}
                      onAddToShowroom={onAddToShowroom}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            {activeScouts > 0 && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-background">
                <span className="text-[10px] font-bold text-white">{activeScouts}</span>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Autopilot Scouts
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/15 text-primary border border-primary/20">
                Beta
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {scouts.length === 0
                ? "Deploy scouts to monitor the market 24/7"
                : `${activeScouts} active • ${totalMatches} matches found`}
            </p>
          </div>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          New Scout
        </Button>
      </div>

      {/* Stats bar (if we have scouts) */}
      {scouts.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-card/60 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Radar className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Active Scouts</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{activeScouts}</span>
          </div>
          <div className="p-4 rounded-xl bg-card/60 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">Total Matches</span>
            </div>
            <span className="text-2xl font-bold text-foreground">{totalMatches}</span>
          </div>
          <div className="p-4 rounded-xl bg-card/60 border border-border/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide font-medium">New Matches</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{newMatchesCount}</span>
              {newMatchesCount > 0 && (
                <span className="text-xs font-semibold text-emerald-500">needs review</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {scouts.length === 0 ? (
        <EmptyStateCards
          cards={AUTOPILOT_EMPTY_CARDS}
          title="Deploy Autopilot Scouts"
          description="Scouts monitor the market 24/7 so you don't have to. They'll alert you when matching vehicles appear."
          action={{
            label: "Deploy New Scout",
            onClick: handleOpenCreateDialog,
          }}
        />
      ) : (
        // Scout list
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {scouts.map((scout) => (
            <ScoutCard
              key={scout.id}
              scout={scout}
              onViewMatches={handleViewMatches}
              onPause={handlePauseScout}
              onResume={handleResumeScout}
              onDelete={handleDeleteScout}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CreateScoutDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateScout={handleCreateScout}
      />
      
      {/* Upgrade modal for scout creation limit */}
      <UpgradeLimitModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature="SCOUT_CREATE"
        limit={upgradeLimit}
        resetTime={upgradeResetTime}
      />
      
      {/* Auth dialog for non-signed-in users */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md font-google-sans-flex border-border/60 shadow-2xl">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-[900] tracking-tighter text-foreground">
              Deploy your autonomous scout
            </DialogTitle>
            <DialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
              Create a free account to deploy AI scouts that monitor the market 24/7 and notify you when your dream car appears.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 group">
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground/90 tracking-wide">24/7 market monitoring</span>
              </div>
              <div className="flex items-center gap-3.5 group">
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground/90 tracking-wide">Instant match notifications</span>
              </div>
              <div className="flex items-center gap-3.5 group">
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Search className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground/90 tracking-wide">AI-powered recommendations</span>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start flex-col sm:flex-row gap-3 sm:gap-2">
            <SignUpButton mode="modal">
              <Button className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                Sign Up Free
              </Button>
            </SignUpButton>
            <SignInButton mode="modal">
              <Button variant="outline" className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest border-border/40 hover:bg-foreground/5 hover:text-foreground hover:border-foreground/20 text-muted-foreground transition-all">
                Sign In
              </Button>
            </SignInButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


