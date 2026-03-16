"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getUserStorage, setUserStorage, removeUserStorage, STORAGE_KEYS } from "@/lib/storage/user-storage";

/**
 * User preferences interface
 */
export interface Preferences {
  /** User's ZIP code for location-based search */
  zipCode?: string;
  /** Search radius in miles */
  radius?: number;
  /** Preferred makes (comma-separated) */
  preferredMakes?: string;
  /** Preferred body types */
  preferredBodyTypes?: string[];
  /** Max price preference */
  maxPrice?: number;
  /** Min year preference */
  minYear?: number;
  /** Preferred fuel types */
  preferredFuelTypes?: string[];
  /** Last search location */
  lastLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
}

interface PreferencesContextValue {
  preferences: Preferences;
  setPreferences: (prefs: Preferences) => void;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  clearPreferences: () => void;
  isLoaded: boolean;
}

const DEBOUNCE_DELAY = 1000;
const SUPABASE_SYNC_DELAY = 3000; // Sync to Supabase after 3 seconds of inactivity

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

/**
 * Preferences Provider
 * Provides reactive preferences context with debounced localStorage and Supabase persistence
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<Preferences>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preferencesRef = useRef<Preferences>({});

  // Keep ref in sync with state
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  // Load preferences from user-isolated storage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = getUserStorage<Preferences>(STORAGE_KEYS.PREFERENCES);
    if (stored) {
      setPreferencesState(stored);
      preferencesRef.current = stored;
    }

    setIsLoaded(true);
  }, []);

  // Debounced sync to Supabase
  const syncToSupabase = useCallback((prefs: Preferences) => {
    if (supabaseSyncTimeoutRef.current) {
      clearTimeout(supabaseSyncTimeoutRef.current);
    }

    supabaseSyncTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: prefs }),
        });
      } catch {
        // Silent fail
      }
      supabaseSyncTimeoutRef.current = null;
    }, SUPABASE_SYNC_DELAY);
  }, []);

  // Debounced save to user-isolated storage
  const saveToStorage = useCallback((prefs: Preferences) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setUserStorage(STORAGE_KEYS.PREFERENCES, prefs);
      saveTimeoutRef.current = null;
    }, DEBOUNCE_DELAY);

    // Also sync to Supabase (with longer debounce)
    syncToSupabase(prefs);
  }, [syncToSupabase]);

  // Flush pending saves on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Perform final save synchronously to user-isolated storage
        setUserStorage(STORAGE_KEYS.PREFERENCES, preferencesRef.current);
      }
      if (supabaseSyncTimeoutRef.current) {
        clearTimeout(supabaseSyncTimeoutRef.current);
      }
    };
  }, []);

  const setPreferences = useCallback((newPrefs: Preferences) => {
    setPreferencesState(newPrefs);
    saveToStorage(newPrefs);
  }, [saveToStorage]);

  const updatePreference = useCallback(<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => {
    setPreferencesState(prev => {
      const updated = { ...prev, [key]: value };
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  const clearPreferences = useCallback(() => {
    setPreferencesState({});
    removeUserStorage(STORAGE_KEYS.PREFERENCES);
    // Also clear in Supabase
    syncToSupabase({});
  }, [syncToSupabase]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreferences,
        updatePreference,
        clearPreferences,
        isLoaded,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Hook to access user preferences
 * Must be used within a PreferencesProvider
 */
export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  
  return context;
}

/**
 * Get preferences hash for cache key generation
 */
export function getPreferencesHash(preferences: Preferences): string {
  const relevantPrefs = {
    zipCode: preferences.zipCode,
    radius: preferences.radius,
    preferredMakes: preferences.preferredMakes,
    maxPrice: preferences.maxPrice,
  };
  
  // Simple hash for cache key
  const str = JSON.stringify(relevantPrefs);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}
