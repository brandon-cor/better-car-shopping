"use client";

import { ChevronDown, ArrowUpDown, Check } from "lucide-react";

export const SORT_OPTIONS = [
  { label: "Best Match", value: "best_match", sort_by: undefined, sort_order: undefined },
  { label: "Price: Low to High", value: "price_asc", sort_by: "price", sort_order: "asc" },
  { label: "Price: High to Low", value: "price_desc", sort_by: "price", sort_order: "desc" },
  { label: "Mileage: Low to High", value: "miles_asc", sort_by: "miles", sort_order: "asc" },
  { label: "Mileage: High to Low", value: "miles_desc", sort_by: "miles", sort_order: "desc" },
  { label: "Year: Newest", value: "year_desc", sort_by: "year", sort_order: "desc" },
  { label: "Year: Oldest", value: "year_asc", sort_by: "year", sort_order: "asc" },
  { label: "Distance: Nearest", value: "dist_asc", sort_by: "dist", sort_order: "asc" },
  { label: "Date Added: Newest", value: "date_desc", sort_by: "first_seen_at", sort_order: "desc" },
  { label: "Date Added: Oldest", value: "date_asc", sort_by: "first_seen_at", sort_order: "asc" },
];

interface SortDropdownProps {
  currentSort: typeof SORT_OPTIONS[0];
  setCurrentSort: (option: typeof SORT_OPTIONS[0]) => void;
  isSortOpen: boolean;
  setIsSortOpen: (open: boolean) => void;
}

export function SortDropdown({ currentSort, setCurrentSort, isSortOpen, setIsSortOpen }: SortDropdownProps) {
  return (
    <div className="relative sort-dropdown">
      <button
        onClick={() => setIsSortOpen(!isSortOpen)}
        className="flex items-center gap-2.5 bg-card border border-border/40 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent transition-all active:scale-[0.98] min-w-[160px] justify-between"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
          <span className="uppercase tracking-wider">{currentSort.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isSortOpen ? "rotate-180" : ""}`} />
      </button>

      {isSortOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-card border border-border/60 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setCurrentSort(option);
                setIsSortOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-accent transition-colors group"
            >
              <span className={currentSort.value === option.value ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}>
                {option.label}
              </span>
              {currentSort.value === option.value && (
                <Check className="w-3.5 h-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
