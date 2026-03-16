"use client";

import { Plus, Layout, Globe } from "lucide-react";
import { DisplayListing } from "@/lib/types";
import { SearchParams } from "@/lib/schema";

interface SearchSidebarProps {
  search: string;
  searchParams: Partial<SearchParams>;
  listingsCount: number;
  totalFound: number;
}

export function SearchSidebar({ search, searchParams, listingsCount, totalFound }: SearchSidebarProps) {
  return (
    <aside className="w-[280px] border-r border-border/10 p-6 flex flex-col gap-10 hidden lg:flex shrink-0">
      <div className="flex items-center gap-2">
        <button className="p-2.5 bg-foreground/5 rounded-xl border border-border/40 hover:bg-foreground/10 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
        <button className="p-2.5 bg-foreground/5 rounded-xl border border-border/40 hover:bg-foreground/10 transition-colors">
          <Layout className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-2.5 bg-foreground/5 rounded-xl border border-border/40 hover:bg-foreground/10 transition-colors">
          <Globe className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-50">Current Search</p>
          <div className="p-4 bg-foreground/[0.02] border border-border/20 rounded-2xl space-y-3">
            <p className="text-[13px] font-semibold leading-relaxed">
              {search.trim() ? (
                `Find a ${search}`
              ) : (
                Object.keys(searchParams).length > 0 
                  ? `Showing filtered results for your search`
                  : "No active search filters"
              )}
            </p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {listingsCount} of {totalFound.toLocaleString()} results
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
