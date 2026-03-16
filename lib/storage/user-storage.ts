/**
 * User-Isolated Storage Utility
 * Ensures data is properly isolated per user on shared devices
 */

const ANON_USER_KEY = "vehique_anonymous";
const CURRENT_USER_KEY = "vehique_current_user_id";

// Storage key prefixes
export const STORAGE_KEYS = {
  CHAT_SESSIONS: "chat_sessions",
  CURRENT_SESSION: "current_session_id",
  PREFERENCES: "preferences",
  FAVORITES: "favorites",
} as const;

/**
 * Get the current user ID from localStorage
 * Returns "anonymous" if no user is signed in
 */
export function getCurrentUserId(): string {
  if (typeof window === "undefined") return ANON_USER_KEY;
  return localStorage.getItem(CURRENT_USER_KEY) || ANON_USER_KEY;
}

/**
 * Set the current user ID
 * Call this when user signs in
 */
export function setCurrentUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * Generate a user-namespaced storage key
 */
export function getUserStorageKey(key: string, userId?: string): string {
  const uid = userId || getCurrentUserId();
  return `vehique_${uid}_${key}`;
}

/**
 * Get data from user-isolated storage
 */
export function getUserStorage<T>(key: string, userId?: string): T | null {
  if (typeof window === "undefined") return null;
  
  try {
    const storageKey = getUserStorageKey(key, userId);
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Set data in user-isolated storage
 */
export function setUserStorage<T>(key: string, value: T, userId?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const storageKey = getUserStorageKey(key, userId);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Storage full or other error
  }
}

/**
 * Remove data from user-isolated storage
 */
export function removeUserStorage(key: string, userId?: string): void {
  if (typeof window === "undefined") return;
  
  const storageKey = getUserStorageKey(key, userId);
  localStorage.removeItem(storageKey);
}

/**
 * Clear all data for a specific user
 * Call this when user explicitly wants to clear their data
 */
export function clearUserData(userId?: string): void {
  if (typeof window === "undefined") return;
  
  const uid = userId || getCurrentUserId();
  const prefix = `vehique_${uid}_`;
  
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Migrate legacy storage to user-namespaced storage
 * Call this once when user signs in to migrate old data
 */
export function migrateLegacyStorage(userId: string): void {
  if (typeof window === "undefined") return;
  
  // Legacy keys to check and migrate
  const legacyMappings = [
    { legacy: "vehique_chat_sessions", new: STORAGE_KEYS.CHAT_SESSIONS },
    { legacy: "vehique_current_session_id", new: STORAGE_KEYS.CURRENT_SESSION },
    { legacy: "vehique_user_preferences", new: STORAGE_KEYS.PREFERENCES },
    { legacy: "favorites", new: STORAGE_KEYS.FAVORITES },
  ];
  
  for (const { legacy, new: newKey } of legacyMappings) {
    const legacyData = localStorage.getItem(legacy);
    if (legacyData) {
      // Check if user already has data in new format
      const userKey = getUserStorageKey(newKey, userId);
      const existingUserData = localStorage.getItem(userKey);
      
      // Only migrate if user doesn't already have data
      if (!existingUserData) {
        localStorage.setItem(userKey, legacyData);
      }
      
      // Remove legacy key after migration
      localStorage.removeItem(legacy);
    }
  }
}

/**
 * Handle user sign-out
 * Clears current user ID but preserves user data in Supabase
 */
export function handleUserSignOut(): void {
  if (typeof window === "undefined") return;
  
  // Clear current user marker
  localStorage.removeItem(CURRENT_USER_KEY);
  
  // Clear anonymous data (if any) to prevent data leakage
  clearUserData(ANON_USER_KEY);
}

