"use client";

import { createContext, useContext, useEffect, useRef, useCallback, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  getUserStorage,
  setUserStorage,
  setCurrentUserId,
  migrateLegacyStorage,
  handleUserSignOut,
  STORAGE_KEYS,
} from "@/lib/storage/user-storage";

interface DataSyncContextValue {
  syncNow: () => Promise<void>;
  isSynced: boolean;
  lastSyncTime: number | null;
}

const DataSyncContext = createContext<DataSyncContextValue>({
  syncNow: async () => {},
  isSynced: false,
  lastSyncTime: null,
});

export function useDataSync() {
  return useContext(DataSyncContext);
}

interface ChatSession {
  id: string;
  title: string;
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
}

interface SavedVehicle {
  id: string;
  title: string;
  price: string;
  savedAt?: number;
  [key: string]: unknown;
}

/**
 * Provider that syncs localStorage data with Supabase bidirectionally
 * - On every sign-in: fetches from Supabase and merges with local data
 * - Real-time: individual providers handle pushing changes to Supabase
 */
export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user } = useUser();
  const syncAttempted = useRef(false);
  const [isSynced, setIsSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  /**
   * Fetch data from Supabase and merge with user-isolated localStorage
   * This runs on every sign-in to get data from other devices
   */
  const syncData = useCallback(async () => {
    if (typeof window === "undefined" || !user?.id) return;

    // Set current user ID and migrate any legacy storage data
    setCurrentUserId(user.id);
    migrateLegacyStorage(user.id);

    // Get local data from user-isolated storage
    const localChats = getUserStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS) || [];
    const localPrefs = getUserStorage<Record<string, unknown>>(STORAGE_KEYS.PREFERENCES) || {};
    const localFavorites = getUserStorage<SavedVehicle[]>(STORAGE_KEYS.FAVORITES) || [];

    try {
      // First, push local data to Supabase (in case it's newer)
      const hasLocalData = localChats.length > 0 || Object.keys(localPrefs).length > 0 || localFavorites.length > 0;
      if (hasLocalData) {
        await fetch("/api/user/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            chatSessions: localChats, 
            preferences: localPrefs,
            favorites: localFavorites,
          }),
        });
      }

      // Then fetch from Supabase (might have data from other devices)
      const response = await fetch("/api/user/sync");
      if (response.ok) {
        const data = await response.json();
        console.log("[DataSync] Fetched from Supabase:", {
          chatSessions: data.chatSessions?.length || 0,
          favorites: data.favorites?.length || 0,
          preferences: Object.keys(data.preferences || {}).length,
        });

        // Merge chat sessions (combine unique by ID, prefer newer updatedAt)
        if (data.chatSessions?.length > 0) {
          const chatMap = new Map<string, ChatSession>();
          
          // Add local chats
          for (const session of localChats) {
            chatMap.set(session.id, session);
          }
          
          // Add/update with Supabase chats (newer wins)
          for (const session of data.chatSessions) {
            const existing = chatMap.get(session.id);
            if (!existing || session.updatedAt > existing.updatedAt) {
              chatMap.set(session.id, session);
            }
          }
          
          // Sort by updatedAt descending
          const merged = Array.from(chatMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
          setUserStorage(STORAGE_KEYS.CHAT_SESSIONS, merged);
        }

        // Merge preferences (local takes priority, Supabase fills gaps)
        if (data.preferences && Object.keys(data.preferences).length > 0) {
          const mergedPrefs = { ...data.preferences, ...localPrefs };
          setUserStorage(STORAGE_KEYS.PREFERENCES, mergedPrefs);
        }

        // Merge favorites (combine unique by ID, Supabase + local)
        const favMap = new Map<string, SavedVehicle>();
        
        // Add Supabase favorites first
        if (data.favorites?.length > 0) {
          for (const fav of data.favorites) {
            favMap.set(fav.id, fav);
          }
        }
        
        // Override with local favorites (more recent)
        for (const fav of localFavorites) {
          favMap.set(fav.id, fav);
        }
        
        const merged = Array.from(favMap.values());
        
        // Always save to user storage
        setUserStorage(STORAGE_KEYS.FAVORITES, merged);
        
        // Always dispatch event so page.tsx can update state
        window.dispatchEvent(new CustomEvent("favorites-updated", { detail: merged }));
        
        // If we had Supabase favorites but no local, sync back to Supabase
        // This ensures the data is properly associated with this device
        if (data.favorites?.length > 0 && localFavorites.length === 0) {
          console.log("[DataSync] Restored", merged.length, "favorites from Supabase");
        }
      }

      setIsSynced(true);
      setLastSyncTime(Date.now());
    } catch (err) {
      console.error("Data sync failed:", err);
      // Still mark as synced to avoid blocking
      setIsSynced(true);
    }
  }, [user?.id]);

  // Sync on sign-in, clear user ID on sign-out
  useEffect(() => {
    if (isSignedIn && user?.id && !syncAttempted.current) {
      syncAttempted.current = true;
      syncData();
    }
    
    // Reset sync flag and clear user ID when user signs out
    if (!isSignedIn) {
      syncAttempted.current = false;
      setIsSynced(false);
      handleUserSignOut(); // Clear current user ID to prevent data mixing
    }
  }, [isSignedIn, user?.id, syncData]);

  /**
   * Manual sync - push all local user data to Supabase
   */
  const syncNow = useCallback(async () => {
    if (!user?.id) return;

    const chatSessions = getUserStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS) || [];
    const preferences = getUserStorage<Record<string, unknown>>(STORAGE_KEYS.PREFERENCES) || {};
    const favorites = getUserStorage<SavedVehicle[]>(STORAGE_KEYS.FAVORITES) || [];

    try {
      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatSessions, preferences, favorites }),
      });
      setLastSyncTime(Date.now());
    } catch {
      // Silent fail
    }
  }, [user?.id]);

  return (
    <DataSyncContext.Provider value={{ syncNow, isSynced, lastSyncTime }}>
      {children}
    </DataSyncContext.Provider>
  );
}
