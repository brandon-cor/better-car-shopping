/**
 * Debounced LocalStorage Utility
 * Prevents UI jank from excessive localStorage writes
 */

interface DebouncedStorage<T> {
  /** Schedule a write after the debounce delay */
  write: (data: T) => void;
  /** Immediately execute any pending write */
  flush: () => void;
  /** Cancel any pending write */
  cancel: () => void;
  /** Read the current value from localStorage */
  read: () => T | null;
}

/**
 * Create a debounced storage writer for a specific key
 * @param key - The localStorage key
 * @param delayMs - Debounce delay in milliseconds (default: 1000ms)
 */
export function createDebouncedStorage<T>(
  key: string,
  delayMs: number = 1000
): DebouncedStorage<T> {
  let pendingData: T | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const performWrite = () => {
    if (pendingData === null) return;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(pendingData));
      }
    } catch (error) {
      console.warn(`[DebouncedStorage] Failed to write to key "${key}":`, error);
    }
    
    pendingData = null;
    timeoutId = null;
  };

  return {
    write(data: T): void {
      pendingData = data;

      // Clear existing timeout
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      // Schedule new write
      timeoutId = setTimeout(performWrite, delayMs);
    },

    flush(): void {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      performWrite();
    },

    cancel(): void {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingData = null;
    },

    read(): T | null {
      if (typeof window === 'undefined') return null;
      
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
  };
}

/**
 * Create a debounced storage writer with initial value support
 */
export function createDebouncedStorageWithDefault<T>(
  key: string,
  defaultValue: T,
  delayMs: number = 1000
): DebouncedStorage<T> & { readOrDefault: () => T } {
  const storage = createDebouncedStorage<T>(key, delayMs);

  return {
    ...storage,
    readOrDefault(): T {
      const value = storage.read();
      return value !== null ? value : defaultValue;
    },
  };
}

