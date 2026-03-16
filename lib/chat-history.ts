import { ChatMessage } from "@/components/chat/chat-sidebar";
import { getUserStorage, setUserStorage, removeUserStorage, STORAGE_KEYS } from "@/lib/storage/user-storage";

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Queue for pending Supabase syncs
let syncQueue: ChatSession[] = [];
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE = 2000; // 2 seconds

// Generate title from messages - finds first meaningful query
export function generateSessionTitle(messages: ChatMessage[]): string {
  const userMessages = messages.filter(m => m.role === "user");
  if (userMessages.length === 0) return "New Chat";
  
  // Skip greetings/short messages, find first substantive one
  const greetings = /^(hey|hi|hello|yo|sup|what's up|howdy|greetings|thanks|thank you|ok|okay|yes|no|sure|please|help)[\s!?.]*$/i;
  
  const substantive = userMessages.find(m => {
    const content = m.content.trim();
    return content.length > 10 && !greetings.test(content);
  });
  
  const content = (substantive || userMessages[0]).content.trim();
  
  // If still too short or generic, use timestamp
  if (content.length <= 5 || greetings.test(content)) {
    return `Chat ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }
  
  // Truncate to ~40 chars, break at word boundary
  if (content.length <= 40) return content;
  return content.slice(0, 40).replace(/\s+\S*$/, "") + "...";
}

export function getSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  return getUserStorage<ChatSession[]>(STORAGE_KEYS.CHAT_SESSIONS) || [];
}

/**
 * Debounced sync to Supabase
 */
function queueSupabaseSync(session: ChatSession): void {
  if (typeof window === "undefined") return;

  // Add to queue (or update existing)
  const idx = syncQueue.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    syncQueue[idx] = session;
  } else {
    syncQueue.push(session);
  }

  // Debounce the sync
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    const toSync = [...syncQueue];
    syncQueue = [];

    try {
      await fetch("/api/user/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatSessions: toSync }),
      });
    } catch {
      // Re-queue on failure silently
      syncQueue.push(...toSync);
    }
  }, SYNC_DEBOUNCE);
}

export function saveSession(session: ChatSession): void {
  if (typeof window === "undefined") return;

  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session);
  }
  setUserStorage(STORAGE_KEYS.CHAT_SESSIONS, sessions);

  // Queue Supabase sync (debounced)
  queueSupabaseSync(session);
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;

  const sessions = getSessions().filter(s => s.id !== id);
  setUserStorage(STORAGE_KEYS.CHAT_SESSIONS, sessions);

  // Note: Supabase delete happens via DataSyncProvider on next full sync
}

export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return getUserStorage<string>(STORAGE_KEYS.CURRENT_SESSION);
}

export function setCurrentSessionId(id: string | null): void {
  if (id) {
    setUserStorage(STORAGE_KEYS.CURRENT_SESSION, id);
  } else {
    removeUserStorage(STORAGE_KEYS.CURRENT_SESSION);
  }
}

export function createSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Force immediate sync of all sessions
 */
export async function forceSyncAll(): Promise<void> {
  if (typeof window === "undefined") return;

  const sessions = getSessions();
  if (sessions.length === 0) return;

  try {
    await fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatSessions: sessions }),
    });
  } catch {
    // Silent fail
  }
}
