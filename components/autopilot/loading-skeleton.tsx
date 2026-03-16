"use client";

/**
 * Loading skeletons for Autopilot components
 */

export function ScoutCardSkeleton() {
  return (
    <div className="bg-card/60 border border-border/30 rounded-2xl overflow-hidden animate-pulse">
      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 rounded-lg p-3">
              <div className="h-3 bg-muted rounded w-1/2 mb-2" />
              <div className="h-6 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>

        {/* Query preview */}
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>

        {/* Button */}
        <div className="h-10 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="bg-card/60 border border-border/30 rounded-2xl overflow-hidden animate-pulse">
      {/* Image */}
      <div className="aspect-[16/10] bg-muted" />

      {/* Content */}
      <div className="p-4">
        <div className="h-5 bg-muted rounded w-3/4 mb-2" />
        <div className="flex gap-2 mb-3">
          <div className="h-4 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
        <div className="flex gap-1.5 mb-4">
          <div className="h-5 bg-muted rounded-full w-14" />
          <div className="h-5 bg-muted rounded-full w-16" />
        </div>
        <div className="h-3 bg-muted rounded w-1/2 mb-4" />
        <div className="flex gap-2">
          <div className="h-9 bg-muted rounded flex-1" />
          <div className="h-9 w-9 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export function ScoutListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 bg-muted rounded w-40 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-28 bg-muted rounded animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2" />
            <div className="h-8 bg-muted rounded w-12" />
          </div>
        ))}
      </div>

      {/* Scout cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ScoutCardSkeleton />
        <ScoutCardSkeleton />
      </div>
    </div>
  );
}

export function MatchGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <MatchCardSkeleton key={i} />
      ))}
    </div>
  );
}

