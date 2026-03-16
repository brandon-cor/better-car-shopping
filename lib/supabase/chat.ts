/**
 * Chat History Sync Service
 * Syncs chat sessions from localStorage to Supabase
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import { ensureUser } from "./users";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
  sources?: Array<{ title: string; url: string; excerpt?: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSessionRow {
  id: string;
  user_id: string;
  title: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

/**
 * Sync multiple chat sessions from client to Supabase
 */
export async function syncChatSessions(
  userId: string,
  sessions: ChatSession[]
): Promise<{ synced: number; errors: number }> {
  if (!isSupabaseConfigured()) {
    return { synced: 0, errors: sessions.length };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return { synced: 0, errors: sessions.length };
  }

  // Ensure user exists
  await ensureUser(userId);

  let synced = 0;
  let errors = 0;

  for (const session of sessions) {
    try {
      const { error } = await supabase.from("chat_sessions").upsert(
        {
          id: session.id,
          user_id: userId,
          title: session.title,
          messages: session.messages,
          created_at: new Date(session.createdAt).toISOString(),
          updated_at: new Date(session.updatedAt).toISOString(),
        },
        { onConflict: "id" }
      );

      if (error) {
        errors++;
      } else {
        synced++;
      }
    } catch {
      errors++;
    }
  }

  return { synced, errors };
}

/**
 * Get all chat sessions for a user from Supabase
 */
export async function getChatSessions(userId: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return (data as ChatSessionRow[]).map((row) => ({
    id: row.id,
    title: row.title || "New Chat",
    messages: row.messages,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

/**
 * Save a single chat session
 */
export async function saveChatSession(
  userId: string,
  session: ChatSession
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.from("chat_sessions").upsert(
    {
      id: session.id,
      user_id: userId,
      title: session.title,
      messages: session.messages,
      created_at: new Date(session.createdAt).toISOString(),
      updated_at: new Date(session.updatedAt).toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) return false;

  return true;
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", userId);

  if (error) return false;

  return true;
}

