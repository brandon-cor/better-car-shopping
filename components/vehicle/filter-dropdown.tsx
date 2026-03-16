"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Loader2, Check, MapPin, Navigation, AlertCircle } from "lucide-react";
import { SearchParams } from "@/lib/schema";

// Radius options for location search
const RADIUS_OPTIONS = [
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 75, label: "75 mi" },
  { value: 100, label: "100 mi" },
];

const LOCATION_STORAGE_KEY = "vehique_user_location";

// MarketCheck comprehensive filter options
export const FILTER_CATEGORIES = {
  make: {
    label: "Make",
    type: "multiselect" as const,
    options: [
      "Acura", "Alfa Romeo", "Aston Martin", "Audi", "Bentley", "BMW", "Buick", "Cadillac",
      "Chevrolet", "Chrysler", "Dodge", "Ferrari", "Fiat", "Ford", "Genesis", "GMC", "Honda",
      "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus",
      "Lincoln", "Lotus", "Maserati", "Mazda", "McLaren", "Mercedes-Benz", "Mini", "Mitsubishi",
      "Nissan", "Polestar", "Porsche", "Ram", "Rivian", "Rolls-Royce", "Subaru", "Tesla",
      "Toyota", "Volkswagen", "Volvo"
    ],
  },
  price_min: {
    label: "Price (Min)",
    type: "price" as const,
    options: [0, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000],
  },
  price_max: {
    label: "Price (Max)",
    type: "price" as const,
    options: [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 500000],
  },
  miles_min: {
    label: "Mileage (Min)",
    type: "mileage" as const,
    options: [0, 10000, 25000, 50000, 75000, 100000],
  },
  miles_max: {
    label: "Mileage (Max)",
    type: "mileage" as const,
    options: [10000, 25000, 50000, 75000, 100000, 150000, 200000],
  },
  exterior_color: {
    label: "Exterior Color",
    type: "multicolor" as const,
    options: [
      { value: "black", label: "Black", hex: "#1a1a1a" },
      { value: "white", label: "White", hex: "#f5f5f5" },
      { value: "silver", label: "Silver", hex: "#c0c0c0" },
      { value: "gray", label: "Gray", hex: "#808080" },
      { value: "red", label: "Red", hex: "#dc2626" },
      { value: "blue", label: "Blue", hex: "#2563eb" },
      { value: "green", label: "Green", hex: "#16a34a" },
      { value: "brown", label: "Brown", hex: "#92400e" },
      { value: "beige", label: "Beige", hex: "#d4b896" },
      { value: "orange", label: "Orange", hex: "#ea580c" },
      { value: "gold", label: "Gold", hex: "#ca8a04" },
      { value: "yellow", label: "Yellow", hex: "#eab308" },
      { value: "purple", label: "Purple", hex: "#9333ea" },
    ],
  },
  body_type: {
    label: "Body Type",
    type: "multiselect" as const,
    options: ["Sedan", "SUV", "Truck", "Coupe", "Convertible", "Hatchback", "Wagon", "Van", "Minivan"],
  },
  fuel_type: {
    label: "Fuel Type",
    type: "multiselect" as const,
    options: ["Gasoline", "Diesel", "Electric", "Hybrid", "Plug-in Hybrid", "Flex Fuel"],
  },
  transmission: {
    label: "Transmission",
    type: "select" as const,
    options: ["Automatic", "Manual", "CVT"],
  },
  drivetrain: {
    label: "Drivetrain",
    type: "multiselect" as const,
    options: ["FWD", "RWD", "AWD", "4WD"],
  },
  car_type: {
    label: "Condition",
    type: "multiselect" as const,
    options: ["New", "Used", "Certified"],
  },
};

export type FilterValues = Partial<SearchParams> & {
  make?: string; // comma-separated for multi
  miles_min?: number;
  miles_max?: number;
  body_type?: string; // comma-separated for multi
  fuel_type?: string; // comma-separated for multi
  transmission?: string;
  drivetrain?: string; // comma-separated for multi
  car_type?: string; // comma-separated for multi
  exterior_color?: string; // comma-separated for multi
  zip?: string;
  radius?: number;
  city?: string; // City name from NL search
};

// Stored location data structure
interface StoredLocation {
  zip: string;
  city?: string;
  state?: string;
  detectedAt: number;
}

interface FilterDropdownProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

// Helper to parse comma-separated string to array
function parseMulti(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map(v => v.trim()).filter(Boolean);
}

// Helper to convert array to comma-separated string
function toMulti(arr: string[]): string | undefined {
  if (arr.length === 0) return undefined;
  return arr.join(",");
}

// Keys that are visible in the filter dropdown UI
const VISIBLE_FILTER_KEYS = [
  'zip', 'radius', 'make', 'price_min', 'price_max', 'year_min', 'year_max', 
  'miles_min', 'miles_max', 'exterior_color', 'body_type', 
  'fuel_type', 'transmission', 'drivetrain', 'car_type'
];

// Helper to compare filter objects (only visible keys)
function filtersEqual(a: FilterValues, b: FilterValues): boolean {
  for (const key of VISIBLE_FILTER_KEYS) {
    const valA = a[key as keyof FilterValues];
    const valB = b[key as keyof FilterValues];
    if (valA !== valB) return false;
  }
  return true;
}

// Count only visible filters
function countVisibleFilters(f: FilterValues): number {
  let count = 0;
  if (f.zip || f.radius) count++; // Count as 1 for location
  if (f.make) count++;
  if (f.price_min || f.price_max) count++; // Count as 1 for price range
  if (f.year_min || f.year_max) count++; // Count as 1 for year range
  if (f.miles_min || f.miles_max) count++; // Count as 1 for mileage range
  if (f.exterior_color) count++;
  if (f.body_type) count++;
  if (f.fuel_type) count++;
  if (f.transmission) count++;
  if (f.drivetrain) count++;
  if (f.car_type) count++;
  return count;
}

export function FilterDropdown({ filters, onFiltersChange, isOpen, setIsOpen }: FilterDropdownProps) {
  const [pendingFilters, setPendingFilters] = useState<FilterValues>(filters);
  
  // Compute which sections should be expanded based on active filters
  const getExpandedFromFilters = (f: FilterValues): Set<string> => {
    const expanded = new Set<string>();
    if (f.zip || f.radius) expanded.add("location");
    if (f.make) expanded.add("make");
    if (f.price_min || f.price_max) expanded.add("price_range");
    if (f.year_min || f.year_max) expanded.add("year_range");
    if (f.miles_min || f.miles_max) expanded.add("mileage");
    if (f.exterior_color) expanded.add("exterior_color");
    if (f.body_type) expanded.add("body_type");
    if (f.fuel_type) expanded.add("fuel_type");
    if (f.transmission) expanded.add("transmission");
    if (f.drivetrain) expanded.add("drivetrain");
    if (f.car_type) expanded.add("car_type");
    return expanded;
  };
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => getExpandedFromFilters(filters));
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const locationInitialized = useRef(false);

  // Reverse geocode coordinates to get zip code and city
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<{ zip: string; city?: string; state?: string } | null> => {
    try {
      // Use free Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        { headers: { 'User-Agent': 'Vehique-App' } }
      );
      if (!response.ok) return null;
      const data = await response.json();
      const address = data.address || {};
      const zip = address.postcode;
      if (!zip) return null;
      return {
        zip: zip.split('-')[0], // Handle ZIP+4 format
        city: address.city || address.town || address.village || address.municipality,
        state: address.state,
      };
    } catch {
      return null;
    }
  }, []);

  // Detect user location using browser geolocation
  const detectLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes cache
        });
      });

      const { latitude, longitude } = position.coords;
      const location = await reverseGeocode(latitude, longitude);

      if (location) {
        // Store in localStorage for persistence
        const stored: StoredLocation = {
          zip: location.zip,
          city: location.city,
          state: location.state,
          detectedAt: Date.now(),
        };
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(stored));

        // Update filters
        setPendingFilters(prev => ({
          ...prev,
          zip: location.zip,
          radius: prev.radius || 25, // Default 25 miles if not set
        }));
        setDetectedCity(location.city && location.state ? `${location.city}, ${location.state}` : location.city || null);
      } else {
        setLocationError("Could not determine zip code");
      }
    } catch (error: any) {
      if (error.code === 1) {
        setLocationError("Location access denied");
      } else if (error.code === 2) {
        setLocationError("Location unavailable");
      } else if (error.code === 3) {
        setLocationError("Location request timed out");
      } else {
        setLocationError("Could not detect location");
      }
    } finally {
      setIsDetectingLocation(false);
    }
  }, [reverseGeocode]);

  // Load location from storage or auto-detect
  useEffect(() => {
    if (locationInitialized.current) return;
    locationInitialized.current = true;

    // Check if filters already have zip (from NL search)
    if (filters.zip) {
      setDetectedCity(null); // Will be shown as manual entry
      return;
    }

    // Try to load from localStorage
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed: StoredLocation = JSON.parse(stored);
        // Check if less than 24 hours old
        if (Date.now() - parsed.detectedAt < 24 * 60 * 60 * 1000) {
          setPendingFilters(prev => ({
            ...prev,
            zip: parsed.zip,
            radius: prev.radius || 25,
          }));
          setDetectedCity(parsed.city && parsed.state ? `${parsed.city}, ${parsed.state}` : parsed.city || null);
          return;
        }
      }
    } catch {}

    // Auto-detect if no stored location and geolocation is available
    if (navigator.geolocation) {
      detectLocation();
    }
  }, [filters.zip, detectLocation]);

  // Sync pending filters and expanded sections when applied filters change (e.g., from NL search)
  useEffect(() => {
    setPendingFilters(filters);
    setExpandedSections(getExpandedFromFilters(filters));
    setPreviewCount(null);
    // If zip came from NL search, clear detected city label
    if (filters.zip && filters.zip !== pendingFilters.zip) {
      setDetectedCity(null);
    }
  }, [filters]);

  // Count active applied filters (only visible ones)
  const activeFilterCount = countVisibleFilters(filters);

  // Check if there are pending changes
  const hasChanges = !filtersEqual(pendingFilters, filters);

  // Fetch preview count with debounce
  const fetchPreviewCount = useCallback(async (filterParams: FilterValues) => {
    setIsLoadingCount(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
      queryParams.set("rows", "0");
      queryParams.set("start", "0");

      const res = await fetch(`/api/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewCount(data.num_found || 0);
      }
    } catch (err) {
      console.error("Error fetching preview count:", err);
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  // Debounced preview count fetch when pending filters change
  useEffect(() => {
    if (!hasChanges) {
      setPreviewCount(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPreviewCount(pendingFilters);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [pendingFilters, hasChanges, fetchPreviewCount]);

  // Close dropdown handler
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    if (hasChanges) {
      setPendingFilters(filters);
      setPreviewCount(null);
    }
  }, [setIsOpen, hasChanges, filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const updatePendingFilter = (key: string, value: any) => {
    if (value === "" || value === undefined || value === null) {
      const newFilters = { ...pendingFilters };
      delete (newFilters as any)[key];
      setPendingFilters(newFilters);
    } else {
      setPendingFilters({ ...pendingFilters, [key]: value });
    }
  };

  // Toggle multi-select value
  const toggleMultiValue = (key: string, value: string) => {
    const current = parseMulti((pendingFilters as any)[key]);
    const index = current.indexOf(value);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(value);
    }
    updatePendingFilter(key, toMulti(current));
  };

  // Check if value is selected in multi-select
  const isMultiSelected = (key: string, value: string): boolean => {
    return parseMulti((pendingFilters as any)[key]).includes(value);
  };

  const clearAllFilters = () => {
    setPendingFilters({});
  };

  const applyFilters = () => {
    onFiltersChange(pendingFilters);
    setPreviewCount(null);
    setIsOpen(false);
  };

  const formatPrice = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${val}`;
  };

  const formatMileage = (val: number) => {
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k mi`;
    return `${val} mi`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  // Count selected items for a multi-select field
  const getMultiCount = (key: string): number => {
    return parseMulti((pendingFilters as any)[key]).length;
  };

  return (
    <div className="relative filter-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 bg-card border border-border/40 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent transition-all active:scale-[0.98] min-w-[120px] justify-between"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
          <span className="uppercase tracking-wider">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[18px] text-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Invisible backdrop to catch outside clicks - touch-none prevents it from capturing scroll gestures */}
          <div 
            className="fixed inset-0 z-[99] touch-none" 
            onClick={closeDropdown}
          />
          <div 
            className="absolute right-0 mt-2 w-[420px] max-h-[75vh] bg-card border border-border/60 rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden flex flex-col"
          >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-muted/30 shrink-0">
            <span className="text-sm font-bold">Filters</span>
            {Object.keys(pendingFilters).length > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] font-semibold text-primary hover:text-primary/80 uppercase tracking-wider flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          {/* Filter Sections */}
          <div className="overflow-y-auto flex-1 custom-scrollbar touch-pan-y">
            {/* Location - First filter */}
            <FilterSection
              title="Location"
              isExpanded={expandedSections.has("location")}
              onToggle={() => toggleSection("location")}
              hasValue={!!(pendingFilters.zip || pendingFilters.radius)}
              onClear={() => {
                updatePendingFilter("zip", undefined);
                updatePendingFilter("radius", undefined);
                setDetectedCity(null);
              }}
            >
              <div className="space-y-4">
                {/* Zip Code Input */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Zip Code</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Enter zip code"
                        value={pendingFilters.zip || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                          updatePendingFilter("zip", value || undefined);
                          if (value.length === 5 && !pendingFilters.radius) {
                            updatePendingFilter("radius", 25);
                          }
                          setDetectedCity(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        maxLength={5}
                      />
                    </div>
                    <button
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-medium bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all disabled:opacity-50"
                      title="Detect my location"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Navigation className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden sm:inline">Detect</span>
                    </button>
                  </div>
                  {/* Location feedback */}
                  {(detectedCity || pendingFilters.city) && pendingFilters.zip && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500" />
                      {detectedCity || pendingFilters.city}
                    </p>
                  )}
                  {locationError && (
                    <p className="mt-1.5 text-[10px] text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {locationError}
                    </p>
                  )}
                </div>

                {/* Radius Dropdown */}
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Search Radius</label>
                  <div className="grid grid-cols-4 gap-2">
                    {RADIUS_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updatePendingFilter("radius", option.value || undefined)}
                        className={`px-2 py-2 text-[10px] font-medium rounded-lg transition-all ${
                          pendingFilters.radius === option.value || (option.value === 0 && !pendingFilters.radius && !pendingFilters.zip)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 hover:bg-muted text-foreground/80"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Make - Multi-select */}
            <FilterSection
              title="Make"
              isExpanded={expandedSections.has("make")}
              onToggle={() => toggleSection("make")}
              hasValue={!!pendingFilters.make}
              count={getMultiCount("make")}
              onClear={() => updatePendingFilter("make", undefined)}
            >
              <div className="max-h-[224px] overflow-y-auto custom-scrollbar pr-1 touch-pan-y">
                <div className="grid grid-cols-3 gap-2">
                  {/* Any Make option - selected when no makes are chosen */}
                  <button
                    onClick={() => updatePendingFilter("make", undefined)}
                    className={`col-span-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      !pendingFilters.make
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80 border border-dashed border-border/40"
                    }`}
                  >
                    {!pendingFilters.make && <Check className="w-3 h-3" />}
                    Any Make
                  </button>
                  {FILTER_CATEGORIES.make.options.map((make) => (
                    <button
                      key={make}
                      onClick={() => toggleMultiValue("make", make)}
                      className={`px-2 py-2 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                        isMultiSelected("make", make)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted text-foreground/80"
                      }`}
                    >
                      {isMultiSelected("make", make) && <Check className="w-3 h-3" />}
                      {make}
                    </button>
                  ))}
                </div>
              </div>
            </FilterSection>

            {/* Price Range */}
            <FilterSection
              title="Price Range"
              isExpanded={expandedSections.has("price_range")}
              onToggle={() => toggleSection("price_range")}
              hasValue={!!(pendingFilters.price_min || pendingFilters.price_max)}
              onClear={() => {
                updatePendingFilter("price_min", undefined);
                updatePendingFilter("price_max", undefined);
              }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Min</label>
                    <select
                      value={pendingFilters.price_min || ""}
                      onChange={(e) => updatePendingFilter("price_min", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No Min</option>
                      {FILTER_CATEGORIES.price_min.options.map((val) => (
                        <option key={val} value={val}>{formatPrice(val)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-muted-foreground mt-5 text-sm">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Max</label>
                    <select
                      value={pendingFilters.price_max || ""}
                      onChange={(e) => updatePendingFilter("price_max", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No Max</option>
                      {FILTER_CATEGORIES.price_max.options.map((val) => (
                        <option key={val} value={val}>{formatPrice(val)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Year Range */}
            <FilterSection
              title="Year"
              isExpanded={expandedSections.has("year_range")}
              onToggle={() => toggleSection("year_range")}
              hasValue={!!(pendingFilters.year_min || pendingFilters.year_max)}
              onClear={() => {
                updatePendingFilter("year_min", undefined);
                updatePendingFilter("year_max", undefined);
              }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">From</label>
                    <select
                      value={pendingFilters.year_min || ""}
                      onChange={(e) => updatePendingFilter("year_min", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Any</option>
                      {Array.from({ length: 26 }, (_, i) => new Date().getFullYear() + 1 - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-muted-foreground mt-5 text-sm">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">To</label>
                    <select
                      value={pendingFilters.year_max || ""}
                      onChange={(e) => updatePendingFilter("year_max", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Any</option>
                      {Array.from({ length: 26 }, (_, i) => new Date().getFullYear() + 1 - i).map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Mileage */}
            <FilterSection
              title="Mileage"
              isExpanded={expandedSections.has("mileage")}
              onToggle={() => toggleSection("mileage")}
              hasValue={!!(pendingFilters.miles_min || pendingFilters.miles_max)}
              onClear={() => {
                updatePendingFilter("miles_min", undefined);
                updatePendingFilter("miles_max", undefined);
              }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Min</label>
                    <select
                      value={pendingFilters.miles_min || ""}
                      onChange={(e) => updatePendingFilter("miles_min", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No Min</option>
                      {FILTER_CATEGORIES.miles_min.options.map((val) => (
                        <option key={val} value={val}>{formatMileage(val)}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-muted-foreground mt-5 text-sm">—</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Max</label>
                    <select
                      value={pendingFilters.miles_max || ""}
                      onChange={(e) => updatePendingFilter("miles_max", e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 text-xs bg-muted/50 border border-border/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">No Max</option>
                      {FILTER_CATEGORIES.miles_max.options.map((val) => (
                        <option key={val} value={val}>{formatMileage(val)}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FilterSection>

            {/* Exterior Color - Multi-select */}
            <FilterSection
              title="Exterior Color"
              isExpanded={expandedSections.has("exterior_color")}
              onToggle={() => toggleSection("exterior_color")}
              hasValue={!!pendingFilters.exterior_color}
              count={getMultiCount("exterior_color")}
              onClear={() => updatePendingFilter("exterior_color", undefined)}
            >
              <div className="grid grid-cols-4 gap-3">
                {FILTER_CATEGORIES.exterior_color.options.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => toggleMultiValue("exterior_color", color.value)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all relative ${
                      isMultiSelected("exterior_color", color.value)
                        ? "bg-primary/10 ring-2 ring-primary"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full border border-border/60 shadow-sm relative"
                      style={{ backgroundColor: color.hex }}
                    >
                      {isMultiSelected("exterior_color", color.value) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check className={`w-4 h-4 ${color.value === "white" || color.value === "beige" || color.value === "yellow" || color.value === "silver" ? "text-gray-800" : "text-white"}`} />
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-medium">{color.label}</span>
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Body Type - Multi-select */}
            <FilterSection
              title="Body Type"
              isExpanded={expandedSections.has("body_type")}
              onToggle={() => toggleSection("body_type")}
              hasValue={!!pendingFilters.body_type}
              count={getMultiCount("body_type")}
              onClear={() => updatePendingFilter("body_type", undefined)}
            >
              <div className="grid grid-cols-3 gap-2">
                {FILTER_CATEGORIES.body_type.options.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleMultiValue("body_type", type)}
                    className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                      isMultiSelected("body_type", type)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {isMultiSelected("body_type", type) && <Check className="w-3 h-3" />}
                    {type}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Fuel Type - Multi-select */}
            <FilterSection
              title="Fuel Type"
              isExpanded={expandedSections.has("fuel_type")}
              onToggle={() => toggleSection("fuel_type")}
              hasValue={!!pendingFilters.fuel_type}
              count={getMultiCount("fuel_type")}
              onClear={() => updatePendingFilter("fuel_type", undefined)}
            >
              <div className="grid grid-cols-2 gap-2">
                {FILTER_CATEGORIES.fuel_type.options.map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() => toggleMultiValue("fuel_type", fuel)}
                    className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                      isMultiSelected("fuel_type", fuel)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {isMultiSelected("fuel_type", fuel) && <Check className="w-3 h-3" />}
                    {fuel}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Transmission - Single select */}
            <FilterSection
              title="Transmission"
              isExpanded={expandedSections.has("transmission")}
              onToggle={() => toggleSection("transmission")}
              hasValue={!!pendingFilters.transmission}
              onClear={() => updatePendingFilter("transmission", undefined)}
            >
              <div className="grid grid-cols-3 gap-2">
                {FILTER_CATEGORIES.transmission.options.map((trans) => (
                  <button
                    key={trans}
                    onClick={() => updatePendingFilter("transmission", pendingFilters.transmission === trans ? undefined : trans)}
                    className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-all ${
                      pendingFilters.transmission === trans
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {trans}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Drivetrain - Multi-select */}
            <FilterSection
              title="Drivetrain"
              isExpanded={expandedSections.has("drivetrain")}
              onToggle={() => toggleSection("drivetrain")}
              hasValue={!!pendingFilters.drivetrain}
              count={getMultiCount("drivetrain")}
              onClear={() => updatePendingFilter("drivetrain", undefined)}
            >
              <div className="grid grid-cols-4 gap-2">
                {FILTER_CATEGORIES.drivetrain.options.map((drive) => (
                  <button
                    key={drive}
                    onClick={() => toggleMultiValue("drivetrain", drive)}
                    className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                      isMultiSelected("drivetrain", drive)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {isMultiSelected("drivetrain", drive) && <Check className="w-3 h-3" />}
                    {drive}
                  </button>
                ))}
              </div>
            </FilterSection>

            {/* Condition - Multi-select */}
            <FilterSection
              title="Condition"
              isExpanded={expandedSections.has("car_type")}
              onToggle={() => toggleSection("car_type")}
              hasValue={!!pendingFilters.car_type}
              count={getMultiCount("car_type")}
              onClear={() => updatePendingFilter("car_type", undefined)}
            >
              <div className="grid grid-cols-3 gap-2">
                {FILTER_CATEGORIES.car_type.options.map((condition) => (
                  <button
                    key={condition}
                    onClick={() => toggleMultiValue("car_type", condition)}
                    className={`px-3 py-2 text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1 ${
                      isMultiSelected("car_type", condition)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 hover:bg-muted text-foreground/80"
                    }`}
                  >
                    {isMultiSelected("car_type", condition) && <Check className="w-3 h-3" />}
                    {condition}
                  </button>
                ))}
              </div>
            </FilterSection>
          </div>

          {/* Footer with Apply Button */}
          <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-muted/20">
            <button
              onClick={applyFilters}
              disabled={!hasChanges}
              className={`w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                hasChanges
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isLoadingCount ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Counting...</span>
                </>
              ) : hasChanges && previewCount !== null ? (
                <span>Apply • {formatCount(previewCount)} listings</span>
              ) : (
                <span>Apply Filters</span>
              )}
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

// Collapsible section component
function FilterSection({ 
  title, 
  isExpanded, 
  onToggle, 
  hasValue, 
  count,
  onClear,
  children 
}: { 
  title: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  hasValue: boolean;
  count?: number;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors bg-card"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          {hasValue && (
            count && count > 1 ? (
              <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[18px] text-center">
                {count}
              </span>
            ) : (
              <span className="w-2 h-2 bg-primary rounded-full" />
            )
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isExpanded && (
        <div className="px-5 pt-2 pb-6 bg-muted/10 max-h-[400px] overflow-y-auto custom-scrollbar touch-pan-y">
          {hasValue && onClear && (
            <div className="flex justify-end mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="text-[10px] font-medium text-primary hover:text-primary/70 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
