"use client";

import { useState } from "react";
import { Scout } from "@/lib/autopilot";
import { formatInterval } from "@/lib/autopilot/schema";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Radar,
  Play,
  Pause,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  Bell,
  Zap,
} from "lucide-react";

interface ScoutCardProps {
  scout: Scout;
  onViewMatches: (scout: Scout) => void;
  onPause: (scoutId: string) => Promise<void>;
  onResume: (scoutId: string) => Promise<void>;
  onDelete: (scoutId: string) => Promise<void>;
}

export function ScoutCard({
  scout,
  onViewMatches,
  onPause,
  onResume,
  onDelete,
}: ScoutCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isActive = scout.status === "active";
  const isPaused = scout.status === "paused";

  const handleTogglePause = async () => {
    setIsLoading(true);
    try {
      if (isActive) {
        await onPause(scout.id);
      } else {
        await onResume(scout.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(scout.id);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  // Format next run time
  const getNextRunText = () => {
    if (!scout.nextRunTimestamp) {
      return isPaused ? "Paused" : "—";
    }
    const nextRun = new Date(scout.nextRunTimestamp);
    const now = new Date();
    const diffMs = nextRun.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return "Scanning now...";
    }
    
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `in ${diffMins}m`;
    }
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
      return `in ${diffHours}h`;
    }
    
    return nextRun.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // Format last checked time
  const getLastCheckedText = () => {
    if (!scout.lastChecked) {
      return "Never";
    }
    const lastChecked = new Date(scout.lastChecked);
    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    
    const diffMins = Math.round(diffMs / (1000 * 60));
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="group relative bg-card/60 hover:bg-card border border-border/30 hover:border-primary/20 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
      {/* Status indicator line */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
          isActive
            ? "bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-500/50"
            : isPaused
            ? "bg-gradient-to-b from-amber-500 via-amber-400 to-amber-500/50"
            : "bg-gradient-to-b from-muted-foreground/40 via-muted-foreground/20 to-transparent"
        }`}
      />

      <div className="p-5 pl-6">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Icon */}
            <div
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : isPaused
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Radar className="w-5 h-5" />
            </div>

            {/* Title & Status */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate leading-tight">
                {scout.displayName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : isPaused
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? "bg-emerald-500 animate-pulse" : isPaused ? "bg-amber-500" : "bg-muted-foreground"
                    }`}
                  />
                  {scout.status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatInterval(scout.intervalSeconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleTogglePause}
              disabled={isLoading}
            >
              {isActive ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Scout</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this scout? This will stop monitoring and remove all discovered matches.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Matches</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-foreground">{scout.matchCount}</span>
              {scout.newMatchCount > 0 && (
                <span className="text-xs font-semibold text-emerald-500">
                  +{scout.newMatchCount} new
                </span>
              )}
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Next Scan</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{getNextRunText()}</span>
          </div>

          <div className="bg-muted/30 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">
              <Bell className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wide font-medium">Last Run</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{getLastCheckedText()}</span>
          </div>
        </div>

        {/* Query Preview */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {scout.query.length > 100 ? scout.query.slice(0, 100) + "..." : scout.query}
        </p>

        {/* View Matches Button */}
        <Button
          variant="outline"
          className="w-full group/btn hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
          onClick={() => onViewMatches(scout)}
        >
          <span className="flex items-center gap-2">
            {scout.newMatchCount > 0 ? (
              <>
                <Zap className="w-4 h-4 text-emerald-500 group-hover/btn:text-primary-foreground" />
                View {scout.newMatchCount} New Matches
              </>
            ) : (
              <>
                View All Matches
              </>
            )}
            <ChevronRight className="w-4 h-4 opacity-50 group-hover/btn:translate-x-1 transition-transform" />
          </span>
        </Button>
      </div>
    </div>
  );
}

