/**
 * IndexedDB Storage Wrapper
 * Provides async storage for large data (research history, etc.)
 * Falls back to memory storage if IndexedDB is unavailable
 */

const DB_NAME = 'vehique-db';
const DB_VERSION = 1;

// Store configurations
const STORES = {
  'research-sessions': { keyPath: 'id' },
} as const;

type StoreName = keyof typeof STORES;

let db: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase | null> | null = null;

// Fallback memory storage for environments where IndexedDB is unavailable
const memoryFallback: Map<string, Map<string, unknown>> = new Map();

/**
 * Check if IndexedDB is available
 */
function isIndexedDBAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    // Check for IndexedDB support
    if (!window.indexedDB) return false;
    
    // Safari private mode check
    const testKey = '_idb_test';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase | null> {
  if (db) return db;
  if (dbPromise) return dbPromise;

  if (!isIndexedDBAvailable()) {
    console.warn('[IndexedDB] Not available, using memory fallback');
    return null;
  }

  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Failed to open database:', request.error);
        resolve(null);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        // Create stores
        for (const [storeName, config] of Object.entries(STORES)) {
          if (!database.objectStoreNames.contains(storeName)) {
            database.createObjectStore(storeName, { keyPath: config.keyPath });
          }
        }
      };
    } catch (error) {
      console.error('[IndexedDB] Error initializing:', error);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Get all records from a store
 */
export async function getAll<T>(storeName: StoreName): Promise<T[]> {
  const database = await initDB();

  if (!database) {
    // Use memory fallback
    const store = memoryFallback.get(storeName);
    return store ? Array.from(store.values()) as T[] : [];
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('[IndexedDB] getAll error:', request.error);
        resolve([]);
      };
    } catch (error) {
      console.error('[IndexedDB] getAll error:', error);
      resolve([]);
    }
  });
}

/**
 * Get a single record by key
 */
export async function get<T>(storeName: StoreName, key: string): Promise<T | null> {
  const database = await initDB();

  if (!database) {
    const store = memoryFallback.get(storeName);
    return (store?.get(key) as T) || null;
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error('[IndexedDB] get error:', request.error);
        resolve(null);
      };
    } catch (error) {
      console.error('[IndexedDB] get error:', error);
      resolve(null);
    }
  });
}

/**
 * Add or update a record
 */
export async function put<T extends { id: string }>(
  storeName: StoreName,
  record: T
): Promise<void> {
  const database = await initDB();

  if (!database) {
    // Use memory fallback
    if (!memoryFallback.has(storeName)) {
      memoryFallback.set(storeName, new Map());
    }
    memoryFallback.get(storeName)!.set(record.id, record);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] put error:', request.error);
        resolve();
      };
    } catch (error) {
      console.error('[IndexedDB] put error:', error);
      resolve();
    }
  });
}

/**
 * Remove a record by key
 */
export async function remove(storeName: StoreName, key: string): Promise<void> {
  const database = await initDB();

  if (!database) {
    memoryFallback.get(storeName)?.delete(key);
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] remove error:', request.error);
        resolve();
      };
    } catch (error) {
      console.error('[IndexedDB] remove error:', error);
      resolve();
    }
  });
}

/**
 * Clear all records in a store
 */
export async function clear(storeName: StoreName): Promise<void> {
  const database = await initDB();

  if (!database) {
    memoryFallback.get(storeName)?.clear();
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('[IndexedDB] clear error:', request.error);
        resolve();
      };
    } catch (error) {
      console.error('[IndexedDB] clear error:', error);
      resolve();
    }
  });
}

/**
 * Migrate data from localStorage to IndexedDB
 * Call on first load to move existing data
 */
export async function migrateFromLocalStorage<T extends { id: string }>(
  storeName: StoreName,
  localStorageKey: string
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const data = localStorage.getItem(localStorageKey);
    if (!data) return false;

    const records: T[] = JSON.parse(data);
    if (!Array.isArray(records) || records.length === 0) return false;

    // Store all records in IndexedDB
    for (const record of records) {
      await put(storeName, record);
    }

    // Clear localStorage key after successful migration
    localStorage.removeItem(localStorageKey);
    
    console.log(`[IndexedDB] Migrated ${records.length} records from "${localStorageKey}"`);
    return true;
  } catch (error) {
    console.error('[IndexedDB] Migration error:', error);
    return false;
  }
}

