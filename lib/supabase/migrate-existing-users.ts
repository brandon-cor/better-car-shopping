/**
 * Migrate Existing Users from Clerk to Supabase
 * 
 * Run this script to sync all existing Clerk users to Supabase.
 * This is useful for initial setup or data recovery.
 * 
 * Usage:
 * npx tsx lib/supabase/migrate-existing-users.ts
 * 
 * Required env vars (you likely already have these set in .env.local):
 * - CLERK_SECRET_KEY (your standard Clerk server secret)
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

// Load environment variables from .env and .env.local
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env", override: true }); // .env takes priority (override .env.local values)

import { createClient } from "@supabase/supabase-js";

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  last_sign_in_at: number | null;
  external_accounts: Array<{ provider: string }>;
  public_metadata: Record<string, unknown>;
}

interface ClerkUserListResponse {
  data: ClerkUser[];
  total_count: number;
}

async function fetchAllClerkUsers(): Promise<ClerkUser[]> {
  // Uses CLERK_SECRET_KEY (the standard Clerk server-side secret key you already have)
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
  
  if (!CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY is required - this is your standard Clerk secret key");
  }

  const allUsers: ClerkUser[] = [];
  let offset = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`,
      {
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch Clerk users: ${error}`);
    }

    const data: ClerkUser[] = await response.json();
    
    if (data.length === 0) {
      hasMore = false;
    } else {
      allUsers.push(...data);
      offset += limit;
      console.log(`Fetched ${allUsers.length} users so far...`);
    }
  }

  return allUsers;
}

async function migrateUsers() {
  console.log("Starting user migration from Clerk to Supabase...\n");

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch all users from Clerk
    console.log("Fetching users from Clerk...");
    const clerkUsers = await fetchAllClerkUsers();
    console.log(`Found ${clerkUsers.length} users in Clerk\n`);

    if (clerkUsers.length === 0) {
      console.log("No users to migrate.");
      return;
    }

    // Prepare users for insertion
    const usersToInsert = clerkUsers.map((user) => ({
      id: user.id,
      email: user.email_addresses[0]?.email_address || null,
      first_name: user.first_name,
      last_name: user.last_name,
      image_url: user.image_url,
      created_at: new Date(user.created_at).toISOString(),
      updated_at: new Date().toISOString(),
      last_sign_in_at: user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toISOString()
        : null,
      sign_in_count: 0,
      metadata: {
        clerkCreatedAt: user.created_at,
        externalAccounts: user.external_accounts?.map((a) => a.provider) || [],
        publicMetadata: user.public_metadata || {},
        migratedAt: new Date().toISOString(),
      },
    }));

    // Insert users in batches
    const batchSize = 50;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < usersToInsert.length; i += batchSize) {
      const batch = usersToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from("users")
        .upsert(batch, { onConflict: "id" })
        .select();

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      } else {
        // Count new vs updated
        const existingIds = new Set();
        const { data: existing } = await supabase
          .from("users")
          .select("id")
          .in("id", batch.map((u) => u.id));
        
        existing?.forEach((u) => existingIds.add(u.id));
        
        inserted += batch.length;
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users`);
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`Total users processed: ${usersToInsert.length}`);
    console.log(`Successfully upserted: ${inserted}`);
    console.log(`Errors: ${errors}`);

    // Also create sign_up activities for all migrated users
    console.log("\nCreating sign_up activities...");
    
    const activities = clerkUsers.map((user) => ({
      user_id: user.id,
      type: "sign_up" as const,
      metadata: {
        email: user.email_addresses[0]?.email_address || null,
        provider: user.external_accounts?.[0]?.provider || "email",
        migratedFromClerk: true,
        originalCreatedAt: new Date(user.created_at).toISOString(),
      },
      created_at: new Date(user.created_at).toISOString(),
    }));

    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = activities.slice(i, i + batchSize);
      
      const { error } = await supabase.from("user_activities").insert(batch);

      if (error) {
        console.error(`Error inserting activities batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Created activities batch ${Math.floor(i / batchSize) + 1}`);
      }
    }

    console.log("\nMigration finished!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateUsers();

