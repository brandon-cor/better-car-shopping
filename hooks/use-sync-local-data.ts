/**
 * Hook to sync localStorage data to Supabase
 * Call this when user signs in to migrate their local data
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserStorage, setUserStorage, STORAGE_KEYS, getUserStorageKey } from "@/lib/storage/user-storage";

interface ChatSession {
  id: string;
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: number;
    sources?: Array<{ title: string; url: string; excerpt?: string }>;
  }>;
  createdAt: number;
  updatedAt: number;
}

interface SavedVehicle {
  id: string;
  title: string;
  price: string;
  image?: string | null;
  location?: string;
  dealer?: string;
  phone?: string;
  miles?: number;
  distance?: number;
  bodyType?: string;
  fuelType?: string;
  vdpUrl?: string;
  savedAt?: number;
}

/**
 * Hook that automatically syncs localStorage data to Supabase
 * when a user signs in for the first time
 */
export function useSyncLocalData() {
  const { isSignedIn, user } = useUser();
  const syncAttempted = useRef(false);

  const syncData = useCallback(async () => {
    if (typeof window === "undefined" || !user?.id) return;

    // Check if already synced for this user (stored per-user)
    const syncFlagKey = getUserStorageKey("sync_flag", user.id);
    const alreadySynced = localStorage.getItem(syncFlagKey);
    if (alreadySynced) {
      return; // Already synced for this user
    }

    // Get data from user-isolated storage
    const chatSessions = getUserStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS) || [];
    const favorites = getUserStorage<SavedVehicle[]>(STORAGE_KEYS.FAVORITES) || [];

    // Nothing to sync
    if (chatSessions.length === 0 && favorites.length === 0) {
      // Mark as synced anyway
      localStorage.setItem(syncFlagKey, String(Date.now()));
      return;
    }

    try {
      const response = await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatSessions, favorites }),
      });

      if (response.ok) {
        // Mark as synced
        localStorage.setItem(syncFlagKey, String(Date.now()));
      }
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  useEffect(() => {
    if (isSignedIn && user?.id && !syncAttempted.current) {
      syncAttempted.current = true;
      syncData();
    }
  }, [isSignedIn, user?.id, syncData]);

  // Return manual sync function for explicit calls
  return { syncData };
}

/**
 * Manually trigger sync (call from a button or after important actions)
 */
export async function manualSync(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const chatSessions = getUserStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS) || [];
  const favorites = getUserStorage<SavedVehicle[]>(STORAGE_KEYS.FAVORITES) || [];

  if (chatSessions.length === 0 && favorites.length === 0) return true;

  try {
    const response = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatSessions, favorites }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Sync only favorites (call when favorites change)
 */
export async function syncFavoritesOnly(favorites: SavedVehicle[]): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorites }),
    });

    if (!response.ok) {
      console.error("[Favorites] Sync failed:", response.status);
    } else {
      console.log("[Favorites] Synced", favorites.length, "items to Supabase");
    }

    return response.ok;
  } catch (err) {
    console.error("[Favorites] Sync error:", err);
    return false;
  }
}

