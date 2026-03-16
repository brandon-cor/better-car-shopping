"use client";

import { useState, useEffect, useRef } from "react";
import { Settings2, ChevronDown, Check, X, Car, DollarSign, Fuel, Users, MapPin, Heart } from "lucide-react";

// Storage key for persisting preferences
const PREFERENCES_STORAGE_KEY = "vehique_user_preferences";

// Preference options
const PRIMARY_USE_OPTIONS = [
  { value: "daily_commute", label: "Daily Commute", description: "Fuel efficiency & reliability" },
  { value: "family", label: "Family", description: "Space, safety & comfort" },
  { value: "adventure", label: "Adventure", description: "Off-road capability & cargo" },
  { value: "luxury", label: "Luxury", description: "Premium features & comfort" },
  { value: "performance", label: "Performance", description: "Power & driving dynamics" },
  { value: "eco_friendly", label: "Eco-Friendly", description: "Electric or hybrid priority" },
];

const BUDGET_RANGE_OPTIONS = [
  { value: "under_15k", label: "Under $15k", description: "Budget-friendly" },
  { value: "15k_25k", label: "$15k - $25k", description: "Value-focused" },
  { value: "25k_40k", label: "$25k - $40k", description: "Mid-range" },
  { value: "40k_60k", label: "$40k - $60k", description: "Premium" },
  { value: "60k_plus", label: "$60k+", description: "Luxury" },
  { value: "flexible", label: "Flexible", description: "Open to options" },
];

const MUST_HAVE_FEATURES = [
  { value: "awd", label: "AWD/4WD" },
  { value: "sunroof", label: "Sunroof" },
  { value: "leather", label: "Leather Seats" },
  { value: "navigation", label: "Navigation" },
  { value: "backup_camera", label: "Backup Camera" },
  { value: "heated_seats", label: "Heated Seats" },
  { value: "apple_carplay", label: "Apple CarPlay" },
  { value: "android_auto", label: "Android Auto" },
  { value: "blind_spot", label: "Blind Spot Monitor" },
  { value: "third_row", label: "Third Row Seating" },
  { value: "towing", label: "Towing Package" },
  { value: "fuel_efficient", label: "Fuel Efficient" },
];

const DEALBREAKER_OPTIONS = [
  { value: "high_mileage", label: "High Mileage (100k+)" },
  { value: "accident_history", label: "Accident History" },
  { value: "salvage_title", label: "Salvage/Rebuilt Title" },
  { value: "no_carfax", label: "No CarFax Report" },
  { value: "manual_trans", label: "Manual Transmission" },
  { value: "no_warranty", label: "No Warranty" },
  { value: "single_owner", label: "Multiple Owners" },
];

const FUEL_PREFERENCE_OPTIONS = [
  { value: "gasoline", label: "Gasoline" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
  { value: "diesel", label: "Diesel" },
  { value: "no_preference", label: "No Preference" },
];

// User preferences type
export interface UserPreferences {
  primaryUse?: string;
  budgetRange?: string;
  mustHaveFeatures?: string[];
  dealbreakers?: string[];
  fuelPreference?: string;
  preferredBrands?: string[];
  maxDistance?: number;
}

interface PersonalizationDropdownProps {
  onPreferencesChange?: (preferences: UserPreferences) => void;
}

export function PersonalizationDropdown({ onPreferencesChange }: PersonalizationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [hasPreferences, setHasPreferences] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerIconStrokeWidth = 2.5;

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
        setHasPreferences(Object.keys(parsed).some(key => {
          const val = parsed[key];
          return val && (Array.isArray(val) ? val.length > 0 : true);
        }));
      }
    } catch {}
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (Object.keys(preferences).length > 0) {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
      const hasAny = Object.keys(preferences).some(key => {
        const val = preferences[key as keyof UserPreferences];
        return val && (Array.isArray(val) ? val.length > 0 : true);
      });
      setHasPreferences(hasAny);
      onPreferencesChange?.(preferences);
    }
  }, [preferences, onPreferencesChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayValue = (key: "mustHaveFeatures" | "dealbreakers" | "preferredBrands", value: string) => {
    const current = preferences[key] || [];
    const index = current.indexOf(value);
    if (index >= 0) {
      updatePreference(key, current.filter(v => v !== value));
    } else {
      updatePreference(key, [...current, value]);
    }
  };

  const isArrayValueSelected = (key: "mustHaveFeatures" | "dealbreakers" | "preferredBrands", value: string): boolean => {
    return (preferences[key] || []).includes(value);
  };

  const clearAllPreferences = () => {
    setPreferences({});
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
    setHasPreferences(false);
  };

  const countActivePreferences = (): number => {
    let count = 0;
    if (preferences.primaryUse) count++;
    if (preferences.budgetRange) count++;
    if (preferences.mustHaveFeatures?.length) count++;
    if (preferences.dealbreakers?.length) count++;
    if (preferences.fuelPreference) count++;
    return count;
  };

  const activeCount = countActivePreferences();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-foreground/5 rounded-lg transition-colors text-black hover:text-black group"
        title="Personalize your search"
      >
        <Settings2 className="w-4 h-4" strokeWidth={headerIconStrokeWidth} />
        {hasPreferences && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] max-h-[80vh] bg-card border border-border/60 rounded-2xl shadow-2xl z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Personalize Search</h3>
                <p className="text-[10px] text-muted-foreground">AI will prioritize your preferences</p>
              </div>
            </div>
            {activeCount > 0 && (
              <button
                onClick={clearAllPreferences}
                className="text-[10px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wider flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Preference Sections */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {/* Primary Use */}
            <PreferenceSection
              icon={<Car className="w-3.5 h-3.5" />}
              title="What will you use this car for?"
            >
              <div className="grid grid-cols-2 gap-2">
                {PRIMARY_USE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("primaryUse", preferences.primaryUse === option.value ? undefined : option.value)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      preferences.primaryUse === option.value
                        ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-card"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-xs font-semibold block">{option.label}</span>
                    <span className={`text-[9px] ${preferences.primaryUse === option.value ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </PreferenceSection>

            {/* Budget Range */}
            <PreferenceSection
              icon={<DollarSign className="w-3.5 h-3.5" />}
              title="What's your budget range?"
            >
              <div className="grid grid-cols-3 gap-2">
                {BUDGET_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("budgetRange", preferences.budgetRange === option.value ? undefined : option.value)}
                    className={`p-2.5 rounded-xl text-center transition-all ${
                      preferences.budgetRange === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    <span className="text-[10px] font-semibold block">{option.label}</span>
                  </button>
                ))}
              </div>
            </PreferenceSection>

            {/* Fuel Preference */}
            <PreferenceSection
              icon={<Fuel className="w-3.5 h-3.5" />}
              title="Fuel preference?"
            >
              <div className="flex flex-wrap gap-2">
                {FUEL_PREFERENCE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => updatePreference("fuelPreference", preferences.fuelPreference === option.value ? undefined : option.value)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5 ${
                      preferences.fuelPreference === option.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    {preferences.fuelPreference === option.value && <Check className="w-3 h-3" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </PreferenceSection>

            {/* Must-Have Features */}
            <PreferenceSection
              icon={<Heart className="w-3.5 h-3.5" />}
              title="Must-have features"
              badge={preferences.mustHaveFeatures?.length}
            >
              <div className="flex flex-wrap gap-2">
                {MUST_HAVE_FEATURES.map((feature) => (
                  <button
                    key={feature.value}
                    onClick={() => toggleArrayValue("mustHaveFeatures", feature.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                      isArrayValueSelected("mustHaveFeatures", feature.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    {isArrayValueSelected("mustHaveFeatures", feature.value) && <Check className="w-2.5 h-2.5" />}
                    {feature.label}
                  </button>
                ))}
              </div>
            </PreferenceSection>

            {/* Dealbreakers */}
            <PreferenceSection
              icon={<X className="w-3.5 h-3.5" />}
              title="Dealbreakers"
              badge={preferences.dealbreakers?.length}
            >
              <div className="flex flex-wrap gap-2">
                {DEALBREAKER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleArrayValue("dealbreakers", option.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                      isArrayValueSelected("dealbreakers", option.value)
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-muted/40 hover:bg-muted/60"
                    }`}
                  >
                    {isArrayValueSelected("dealbreakers", option.value) && <Check className="w-2.5 h-2.5" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </PreferenceSection>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-5 py-4 border-t border-border/40 bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                {activeCount > 0 ? (
                  <>
                    <span className="text-primary font-semibold">{activeCount}</span> preference{activeCount !== 1 ? "s" : ""} set
                  </>
                ) : (
                  "No preferences set yet"
                )}
              </p>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Preference section component
function PreferenceSection({ 
  icon, 
  title, 
  badge,
  children 
}: { 
  icon: React.ReactNode;
  title: string; 
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="px-5 py-4 border-b border-border/30 last:border-b-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-xs font-semibold">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full min-w-[16px] text-center">
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
