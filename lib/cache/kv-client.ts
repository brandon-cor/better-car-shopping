/**
 * Vercel KV Client Module
 * Provides distributed caching via Vercel KV (Redis)
 * Falls back gracefully if KV is not configured
 */

// Dynamic import to handle cases where @vercel/kv is not installed
let kv: any = null;

// Try to import @vercel/kv if available
async function getKVClient() {
  if (kv !== null) return kv;
  
  try {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
    return kv;
  } catch {
    // @vercel/kv not available
    kv = undefined;
    return undefined;
  }
}

/**
 * Check if KV is configured and available
 */
export function isKVConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get a value from Vercel KV
 * Returns null if not found, not configured, or on error
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  if (!isKVConfigured()) {
    return null;
  }

  try {
    const client = await getKVClient();
    if (!client) return null;

    // Set timeout for KV operations
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const value = await client.get(key);
      clearTimeout(timeout);
      
      if (value === null || value === undefined) {
        return null;
      }

      // Handle both string and object responses
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as unknown as T;
        }
      }
      
      return value as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.warn('[KV] Get operation timed out for key:', key);
      }
      throw err;
    }
  } catch (error) {
    console.error('[KV] Get error for key:', key, error);
    return null;
  }
}

/**
 * Set a value in Vercel KV with TTL
 */
export async function kvSet<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
  if (!isKVConfigured()) {
    return false;
  }

  try {
    const client = await getKVClient();
    if (!client) return false;

    // Set timeout for KV operations
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      await client.set(key, JSON.stringify(value), { ex: ttlSeconds });
      clearTimeout(timeout);
      return true;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.warn('[KV] Set operation timed out for key:', key);
      }
      throw err;
    }
  } catch (error) {
    console.error('[KV] Set error for key:', key, error);
    return false;
  }
}

/**
 * Delete a value from Vercel KV
 */
export async function kvDelete(key: string): Promise<boolean> {
  if (!isKVConfigured()) {
    return false;
  }

  try {
    const client = await getKVClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('[KV] Delete error for key:', key, error);
    return false;
  }
}

/**
 * Check if a key exists in Vercel KV
 */
export async function kvExists(key: string): Promise<boolean> {
  if (!isKVConfigured()) {
    return false;
  }

  try {
    const client = await getKVClient();
    if (!client) return false;

    const exists = await client.exists(key);
    return exists > 0;
  } catch {
    return false;
  }
}

