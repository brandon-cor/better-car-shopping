/**
 * User Favorites/Showroom Service
 * Syncs saved vehicles to Supabase
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import { ensureUser } from "./users";

export interface SavedVehicle {
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

interface FavoriteRow {
  id: string;
  user_id: string;
  vehicle_id: string;
  vehicle_data: SavedVehicle;
  created_at: string;
}

/**
 * Save/sync all favorites to Supabase
 * Replaces existing favorites with new list
 */
export async function syncFavorites(
  userId: string,
  favorites: SavedVehicle[]
): Promise<{ synced: number; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { synced: 0, error: "Supabase not configured" };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { synced: 0, error: "Failed to connect to Supabase" };
  }

  await ensureUser(userId);

  try {
    // Delete existing favorites for this user
    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId);

    // If no favorites, we're done
    if (favorites.length === 0) {
      return { synced: 0 };
    }

    // Insert new favorites
    const rows = favorites.map((vehicle, index) => ({
      user_id: userId,
      vehicle_id: vehicle.id,
      vehicle_data: {
        ...vehicle,
        savedAt: vehicle.savedAt || Date.now() - index * 1000, // Preserve order
      },
    }));

    const { error } = await supabase
      .from("user_favorites")
      .insert(rows);

    if (error) {
      console.error("[Favorites] Supabase insert error:", error);
      return { synced: 0, error: error.message };
    }

    console.log("[Favorites] Successfully synced", favorites.length, "favorites to Supabase for user:", userId);
    return { synced: favorites.length };
  } catch (err) {
    console.error("Error syncing favorites:", err);
    return { synced: 0, error: "Failed to sync favorites" };
  }
}

/**
 * Get all favorites for a user
 */
export async function getFavorites(userId: string): Promise<SavedVehicle[]> {
  if (!isSupabaseConfigured()) {
    console.log("[Favorites] Supabase not configured");
    return [];
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.log("[Favorites] Failed to get Supabase client");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("user_favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Favorites] Error fetching favorites:", error);
      return [];
    }

    if (!data) {
      console.log("[Favorites] No data returned for user:", userId);
      return [];
    }

    console.log("[Favorites] Fetched", data.length, "favorites from Supabase for user:", userId);
    return (data as FavoriteRow[]).map((row) => row.vehicle_data);
  } catch (err) {
    console.error("[Favorites] Unexpected error:", err);
    return [];
  }
}

/**
 * Add a single favorite
 */
export async function addFavorite(
  userId: string,
  vehicle: SavedVehicle
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  await ensureUser(userId);

  try {
    const { error } = await supabase.from("user_favorites").upsert(
      {
        user_id: userId,
        vehicle_id: vehicle.id,
        vehicle_data: {
          ...vehicle,
          savedAt: vehicle.savedAt || Date.now(),
        },
      },
      { onConflict: "user_id,vehicle_id" }
    );

    return !error;
  } catch {
    return false;
  }
}

/**
 * Remove a single favorite
 */
export async function removeFavorite(
  userId: string,
  vehicleId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId)
      .eq("vehicle_id", vehicleId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Delete all favorites for a user
 */
export async function deleteFavorites(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

