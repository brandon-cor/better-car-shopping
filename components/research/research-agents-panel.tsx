"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DisplayListing } from "@/lib/types";
import { ComparisonResult, StreamStep } from "@/lib/research-types";
import { EmptyStateCards, CardEvent } from "@/components/ui/empty-state-cards";
import { 
  ScanSearch, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Lightbulb,
  ChevronDown,
  Car,
  Gauge,
  Calendar,
  MapPin,
  DollarSign,
  Fuel,
  Award,
  XCircle,
  Trash2,
  ArrowLeft,
  Zap,
  Wind,
  Droplets,
  Activity,
  Palette,
  Youtube,
  MessageSquare,
  ShieldCheck,
  Globe,
  Quote
} from "lucide-react";

const RESEARCH_EMPTY_CARDS: CardEvent[] = [
  {
    id: 1,
    title: "Toyota Camry vs Honda Accord",
    subtitle: "Reliability & Resale Value",
    location: "Comparison",
    image: "/aesthetic/Classic Car European Cityscape.png",
    badge: "Popular",
    badgeIcon: "star" as const,
  },
  {
    id: 2,
    title: "BMW X5 vs Mercedes GLE",
    subtitle: "Luxury SUV Showdown",
    location: "Deep Analysis",
    image: "/aesthetic/Classic Porsche Scene Photo.png",
    badge: "In Depth",
    badgeIcon: "crown" as const,
  },
  {
    id: 3,
    title: "Rivian R1S vs Tesla Model X",
    subtitle: "EV Range & Tech",
    location: "EV Battle",
    image: "/aesthetic/Vintage Car Urban Silhouette.png",
    badge: "Trending",
    badgeIcon: "trending" as const,
  },
];

// History icon matching navbar design
function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
      <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
      <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
      <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
      <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
      <path d="M12 8v4l3 3" />
    </svg>
  );
}

// Chat message type
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  meta?: {
    thought?: string;
    sources?: Array<{ title: string; url: string; excerpt?: string }>;
    inProgress?: boolean;
  };
}

// Research session for history - stores full vehicle info for showroom
interface ResearchSessionVehicle {
  id: string;
  title: string;
  image: string | null;
  price: string;
  location?: string;
  dealer?: string;
  phone?: string;
  miles?: number;
  distance?: number;
  bodyType?: string;
  fuelType?: string;
  vdpUrl?: string;
}

interface ResearchSession {
  id: string;
  createdAt: string;
  summary: string;
  vehicles: ResearchSessionVehicle[];
  result: ComparisonResult;
  chatMessages: ChatMessage[];
}

const STORAGE_KEY = "vehique-research-history";
const IDB_STORE = "research-sessions";

// Import IndexedDB utilities
import * as idb from "@/lib/storage/indexed-db";

// Track migration status
let migrationAttempted = false;

// Load history from IndexedDB (with localStorage fallback for migration)
const loadHistory = async (): Promise<ResearchSession[]> => {
  if (typeof window === "undefined") return [];
  
  try {
    // Attempt migration from localStorage on first load
    if (!migrationAttempted) {
      migrationAttempted = true;
      await idb.migrateFromLocalStorage<ResearchSession>(
        IDB_STORE as any,
        STORAGE_KEY
      );
    }
    
    // Load from IndexedDB
    const sessions = await idb.getAll<ResearchSession>(IDB_STORE as any);
    return sessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    // Fallback to localStorage if IndexedDB fails
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
};

// Save a single session to IndexedDB
const saveSession = async (session: ResearchSession): Promise<void> => {
  if (typeof window === "undefined") return;
  
  try {
    await idb.put(IDB_STORE as any, session);
  } catch {
    // Fallback to localStorage if IndexedDB fails
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      const sessions: ResearchSession[] = existing ? JSON.parse(existing) : [];
      const updated = [session, ...sessions.filter(s => s.id !== session.id)].slice(0, 20);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
  }
};

// Delete a session from IndexedDB
const deleteSessionFromStorage = async (id: string): Promise<void> => {
  if (typeof window === "undefined") return;
  
  try {
    await idb.remove(IDB_STORE as any, id);
  } catch {
    // Fallback to localStorage
    try {
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        const sessions: ResearchSession[] = JSON.parse(existing);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.filter(s => s.id !== id)));
      }
    } catch {
      // Ignore errors
    }
  }
};

// Legacy save function for backward compatibility (saves all sessions)
const saveHistory = async (sessions: ResearchSession[]) => {
  if (typeof window === "undefined") return;
  
  // Save each session individually
  for (const session of sessions.slice(0, 20)) {
    await saveSession(session);
  }
};

// Generate auto-summary from comparison result
const generateSummary = (result: ComparisonResult): string => {
  if (result.recommendation?.bestPick) {
    return `Best pick: ${result.recommendation.bestPick}`;
  }
  const vehicleNames = result.vehicles.map(v => `${v.make} ${v.model}`).join(" vs ");
  return vehicleNames || "Vehicle Comparison";
};

interface ResearchAgentsPanelProps {
  selectedListings: DisplayListing[];
  compareTriggerToken: number;
  chatInput?: string;
  onChatSent?: () => void;
  showHistoryTrigger?: number; // Increment to trigger showing history
  onAddToShowroom?: (vehicles: ResearchSessionVehicle[]) => void;
  onBrowseListings?: () => void;
}

export function ResearchAgentsPanel({ selectedListings, compareTriggerToken, chatInput, onChatSent, showHistoryTrigger, onAddToShowroom, onBrowseListings }: ResearchAgentsPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [reasoning, setReasoning] = useState("");
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; url: string; type: string }>>([]);
  const [showReasoning, setShowReasoning] = useState(true);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  
  // History state
  const [history, setHistory] = useState<ResearchSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [restoredVehicles, setRestoredVehicles] = useState<ResearchSession["vehicles"] | null>(null);
  
  const lastTriggerRef = useRef(0);
  const lastChatInputRef = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const reasoningEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);

  const lastHistoryTriggerRef = useRef(0);

  // Load history on mount and show history view by default if there's history
  useEffect(() => {
    const initHistory = async () => {
      const loaded = await loadHistory();
      setHistory(loaded);
      // Only show history on mount if no vehicles selected (empty state)
      // If vehicles are selected, wait for user action (don't auto-show history)
      if (loaded.length > 0 && !result && !isRunning && !restoredVehicles && selectedListings.length === 0) {
        setShowHistory(true);
      }
      // Add all vehicles from history to showroom
      if (loaded.length > 0 && onAddToShowroom) {
        const allVehicles = loaded.flatMap(session => session.vehicles);
        onAddToShowroom(allVehicles);
      }
    };
    initHistory();
  }, []);

  // Handle external trigger to show history (when tab is clicked while already active)
  useEffect(() => {
    if (showHistoryTrigger && showHistoryTrigger !== lastHistoryTriggerRef.current) {
      lastHistoryTriggerRef.current = showHistoryTrigger;
      if (history.length > 0) {
        setShowHistory(true);
      }
    }
  }, [showHistoryTrigger, history.length]);

  // Scroll chat section to top when new messages are added
  useEffect(() => {
    if (chatMessages.length > 0 && chatSectionRef.current) {
      // Scroll the chat section to the top of the viewport
      setTimeout(() => {
        chatSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [chatMessages.length]);

  // Also scroll when user starts chatting
  useEffect(() => {
    if (isChatting && chatSectionRef.current) {
      chatSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isChatting]);

  // Save session when result is complete
  useEffect(() => {
    if (result && !isRunning && selectedListings.length >= 2 && !activeSessionId) {
      const session: ResearchSession = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        summary: generateSummary(result),
        vehicles: selectedListings.map(l => ({
          id: l.id,
          title: l.title,
          image: l.image || null,
          price: l.price,
          location: l.location,
          dealer: l.dealer,
          phone: l.phone,
          miles: l.miles,
          distance: l.distance,
          bodyType: l.bodyType,
          fuelType: l.fuelType,
          vdpUrl: l.vdpUrl,
        })),
        result,
        chatMessages,
      };
      const updated = [session, ...history];
      setHistory(updated);
      // Save to IndexedDB
      saveSession(session);
      setActiveSessionId(session.id);
    }
  }, [result, isRunning]);

  // Restore a session from history
  const restoreSession = (session: ResearchSession) => {
    // Update trigger ref to prevent re-running comparison
    lastTriggerRef.current = compareTriggerToken;
    setResult(session.result);
    setChatMessages(session.chatMessages);
    setRestoredVehicles(session.vehicles);
    setActiveSessionId(session.id);
    setShowHistory(false);
    setSteps([]);
    setReasoning("");
    setError(null);
    setIsRunning(false);
  };

  // Delete a session
  const deleteSession = async (id: string) => {
    const updated = history.filter(s => s.id !== id);
    setHistory(updated);
    await deleteSessionFromStorage(id);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setResult(null);
      setChatMessages([]);
      setRestoredVehicles(null);
    }
  };

  // Start new comparison (clear current)
  const startNew = () => {
    setResult(null);
    setChatMessages([]);
    setActiveSessionId(null);
    setRestoredVehicles(null);
    setSteps([]);
    setReasoning("");
    setError(null);
    setShowHistory(false);
  };

  // Update session chat messages when they change (for restored sessions)
  useEffect(() => {
    if (activeSessionId && chatMessages.length > 0) {
      const sessionIndex = history.findIndex(s => s.id === activeSessionId);
      if (sessionIndex >= 0) {
        const updatedSession = {
          ...history[sessionIndex],
          chatMessages,
        };
        const updated = [...history];
        updated[sessionIndex] = updatedSession;
        setHistory(updated);
        // Save updated session to IndexedDB
        saveSession(updatedSession);
      }
    }
  }, [chatMessages, activeSessionId]);

  // Format date
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  // Get display vehicles (either selected or restored)
  const displayVehicles = restoredVehicles || selectedListings.map(l => ({
    id: l.id,
    title: l.title,
    image: l.image || null,
    price: l.price,
  }));

  // Handle external chat input
  useEffect(() => {
    if (chatInput && chatInput !== lastChatInputRef.current && chatInput.trim()) {
      lastChatInputRef.current = chatInput;
      sendChatMessage(chatInput.trim());
      onChatSent?.();
    }
  }, [chatInput]);

  // Build context from selected vehicles for chat
  const buildVehicleContext = () => {
    if (selectedListings.length === 0) return "";
    return selectedListings.map((l, i) => 
      `Vehicle ${i + 1}: ${l.title}, Price: ${l.price}, Mileage: ${l.miles?.toLocaleString() || "N/A"} mi, Location: ${l.location || "N/A"}`
    ).join("\n");
  };

  // Send chat message
  const sendChatMessage = async (msg: string) => {
    if (!msg || isChatting) return;

    setIsChatting(true);

    // Add user message
    const userMsg: ChatMessage = { role: "user", content: msg };
    setChatMessages(prev => [...prev, userMsg]);

    // Add assistant placeholder
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "", meta: { inProgress: true } };
    setChatMessages(prev => [...prev, assistantPlaceholder]);

    try {
      // Build messages with vehicle context
      const vehicleContext = buildVehicleContext();
      const systemContext = vehicleContext 
        ? `The user is researching these vehicles:\n${vehicleContext}\n\nHelp them with questions about these specific vehicles.`
        : "";
      
      const apiMessages = [
        ...(systemContext ? [{ role: "system" as const, content: systemContext }] : []),
        ...chatMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: msg },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, stream: true }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";
      let thought = "";
      let msgSources: Array<{ title: string; url: string; excerpt?: string }> = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          const dataLine = chunk.split("\n").map(l => l.trim()).find(l => l.startsWith("data:"));
          if (!dataLine) continue;

          const payload = dataLine.replace(/^data:\s*/, "");
          try {
            const evt = JSON.parse(payload);

            if (evt.type === "thought") {
              thought += evt.data.delta;
              setChatMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  last.meta = { ...last.meta, thought, inProgress: true };
                }
                return next;
              });
            }

            if (evt.type === "content") {
              content += evt.data.delta;
              setChatMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  last.content = content;
                  last.meta = { ...last.meta, thought, inProgress: true };
                }
                return next;
              });
            }

            if (evt.type === "sources") {
              msgSources = evt.data.sources || [];
            }

            if (evt.type === "done") {
              setChatMessages(prev => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  last.meta = { thought, sources: msgSources, inProgress: false };
                }
                return next;
              });
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    } catch (err) {
      setChatMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          last.content = "Sorry, something went wrong. Please try again.";
          last.meta = { inProgress: false };
        }
        return next;
      });
    } finally {
      setIsChatting(false);
    }
  };

  // Auto-scroll reasoning
  useEffect(() => {
    if (reasoning && reasoningEndRef.current) {
      reasoningEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [reasoning]);

  // Trigger research when compareTriggerToken changes (only if no result already)
  useEffect(() => {
    if (compareTriggerToken > 0 && compareTriggerToken !== lastTriggerRef.current) {
      lastTriggerRef.current = compareTriggerToken;
      // Don't run if already have a result or viewing restored session
      if (!result && !restoredVehicles) {
        runComparison();
      }
    }
  }, [compareTriggerToken]);

  const runComparison = async () => {
    if (selectedListings.length < 2) return;
    // Don't run if viewing a restored session
    if (restoredVehicles) return;
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Reset state and hide history
    setShowHistory(false);
    setIsRunning(true);
    setSteps([]);
    setReasoning("");
    setResult(null);
    setError(null);
    setSources([]);
    setShowReasoning(true);
    setActiveSessionId(null);
    setRestoredVehicles(null);

    try {
      const listings = selectedListings.map(l => ({
        id: l.id,
        title: l.title,
        vdpUrl: l.vdpUrl,
      }));

      const res = await fetch("/api/research/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listings, stream: true }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to start comparison");
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const chunk = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf("\n\n");

          const dataLine = chunk
            .split("\n")
            .map(l => l.trim())
            .find(l => l.startsWith("data:"));
          if (!dataLine) continue;

          const payload = dataLine.replace(/^data:\s*/, "");
          let evt: any;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          // Handle different event types
          if (evt.type === "step") {
            setSteps(prev => {
              const existing = prev.findIndex(s => s.id === evt.data.id);
              if (existing >= 0) {
                const next = [...prev];
                next[existing] = evt.data;
                return next;
              }
              return [...prev, evt.data];
            });
          }

          if (evt.type === "thought") {
            setReasoning(prev => prev + evt.data.delta);
          }

          if (evt.type === "sources") {
            setSources(evt.data.sources || []);
          }

          if (evt.type === "result") {
            setResult(evt.data.comparison);
            setShowReasoning(false);
            setIsRunning(false);
          }

          if (evt.type === "error") {
            setError(evt.data.message);
          }

          if (evt.type === "done") {
            setIsRunning(false);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "An error occurred during comparison");
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Show history view - only when explicitly requested via showHistory state
  if (showHistory && !isRunning) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HistoryIcon className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold">Research History</h2>
            <span className="text-xs text-muted-foreground">({history.length})</span>
          </div>
          {selectedListings.length >= 2 && (
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-primary hover:underline"
            >
              Back to comparison
            </button>
          )}
        </div>

        {/* History List */}
        <div className="space-y-3">
          {history.map((session) => (
            <div
              key={session.id}
              className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-all cursor-pointer"
              onClick={() => restoreSession(session)}
            >
              {/* Vehicle Images Stack */}
              <div className="flex -space-x-3">
                {session.vehicles.slice(0, 3).map((v, i) => (
                  <div
                    key={v.id}
                    className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden shrink-0"
                    style={{ zIndex: 3 - i }}
                  >
                    {v.image ? (
                      <img
                        src={v.image}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                ))}
                {session.vehicles.length > 3 && (
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{session.vehicles.length - 3}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {session.vehicles.map(v => v.title.split(" ").slice(0, 2).join(" ")).join(" vs ")}
                </p>
              </div>

              {/* Time & Actions */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground/60">{formatDate(session.createdAt)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {history.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <HistoryIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No research history yet</p>
          </div>
        )}
      </div>
    );
  }

  // Empty state - no vehicles selected and no restored session
  if (selectedListings.length === 0 && !restoredVehicles) {
    return (
      <EmptyStateCards 
        cards={RESEARCH_EMPTY_CARDS}
        title="AI Research Agents"
        description="Select 2+ vehicles to compare them side-by-side with deep AI analysis, market data, and community insights."
        action={{
          label: "Select Vehicles",
          onClick: () => onBrowseListings?.()
        }}
      />
    );
  }

  // Not enough selected (and no restored session)
  if (selectedListings.length === 1 && !restoredVehicles) {
    return (
      <div className="flex flex-col items-start py-12 animate-in fade-in duration-500">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <ScanSearch className="w-7 h-7 text-primary/60" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Select one more vehicle</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          You need at least 2 vehicles to run a comparison. Currently selected: <strong>{selectedListings[0].title}</strong>
        </p>
      </div>
    );
  }

  const vehicleCount = displayVehicles.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        {history.length === 0 && <div />}
        <div className="flex-1">
          <h2 className="text-xl font-bold">Research Comparison</h2>
          <p className="text-sm text-muted-foreground">
            Comparing {vehicleCount} vehicles with deep AI analysis
          </p>
        </div>
        <div />
      </div>

      {/* Selected Vehicle Cards - Responsive Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {displayVehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className="flex items-center gap-3 bg-card border border-border/40 rounded-xl p-2.5 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group"
          >
            {/* Image */}
            <div className={`rounded-lg bg-muted/20 overflow-hidden shrink-0 ${
              vehicleCount === 3 ? "w-20 h-14" : "w-28 h-20"
            }`}>
              <img
                src={vehicle.image || "/placeholder-image.svg"}
                alt={vehicle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder-image.svg";
                }}
              />
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <h4 className={`font-semibold line-clamp-1 group-hover:text-primary transition-colors ${
                vehicleCount === 3 ? "text-xs" : "text-sm"
              }`}>
                {vehicle.title}
              </h4>
              <p className={`font-bold text-primary mt-0.5 ${
                vehicleCount === 3 ? "text-sm" : "text-base"
              }`}>{vehicle.price}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Run Button (if not running and no result, and not viewing restored session) */}
      {!isRunning && !result && !restoredVehicles && selectedListings.length >= 2 && (
        <div className="flex justify-start">
          <button
            onClick={runComparison}
            className="flex items-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <ScanSearch className="w-4 h-4" />
            Run Deep Research
          </button>
        </div>
      )}

      {/* Live Research Progress */}
      {(isRunning || (steps.length > 0 && !result)) && (
        <div className="space-y-4">
          {/* Steps */}
          <div className="space-y-1.5">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2">
                {step.status === "active" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
                )}
                {step.status === "complete" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                )}
                {step.status === "error" && (
                  <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                )}
                {step.status === "pending" && (
                  <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${step.status === "active" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {step.status === "active" && (
                      <span className="flex h-1 w-1 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                  {step.description && (step.status === "active" || step.status === "complete") && (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live Reasoning */}
          {reasoning && (
            <details open={showReasoning} className="group">
              <summary
                onClick={(e) => {
                  e.preventDefault();
                  setShowReasoning(!showReasoning);
                }}
                className="list-none cursor-pointer select-none inline-flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-all"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>AI Reasoning</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showReasoning ? "rotate-180" : ""}`} />
              </summary>
              <div className="mt-2 text-xs text-muted-foreground/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                {reasoning}
                <div ref={reasoningEndRef} />
              </div>
            </details>
          )}

          {/* Sources */}
          {sources.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Checked {sources.length} sources
              </div>
              <ul className="space-y-1">
                {sources.slice(0, 5).map((s, idx) => {
                  const hostname = (() => { try { return new URL(s.url).hostname; } catch { return null; } })();
                  return (
                    <li key={idx} className="group/src flex items-center gap-2 overflow-hidden">
                      {hostname && (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                          alt=""
                          className="w-3 h-3 rounded-sm opacity-40 grayscale group-hover/src:opacity-100 group-hover/src:grayscale-0 transition-all shrink-0"
                        />
                      )}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-muted-foreground/60 hover:text-primary truncate transition-colors"
                      >
                        {s.title || hostname || s.url}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Research failed</h4>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={runComparison}
              className="mt-3 text-xs font-bold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Comparison Result */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Recommendation Banner */}
          {result.recommendation && (
            <div className="bg-card border border-border/10 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden group">
              {/* Subtle background glow */}
              <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 ${
                result.recommendation.matchScore >= 80 ? "bg-green-500" : 
                result.recommendation.matchScore >= 60 ? "bg-primary" : 
                "bg-yellow-500"
              }`} />
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
                {/* Visual Match Gauge */}
                <div className="flex flex-col items-center gap-4 shrink-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90">
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(20, 184, 166)" />
                          <stop offset="50%" stopColor="rgb(6, 182, 212)" />
                          <stop offset="100%" stopColor="rgb(34, 197, 94)" />
                        </linearGradient>
                      </defs>
                      {/* Background circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted/10"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="url(#scoreGradient)"
                        strokeWidth="8"
                        fill="none"
                        className="transition-all duration-1000 ease-out"
                        strokeDasharray={`${(result.recommendation.matchScore / 100) * 364} 364`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="flex items-start">
                        <span className="text-4xl font-black tracking-tighter">{Math.round(result.recommendation.matchScore)}</span>
                        <span className="text-xl font-bold mt-1 opacity-60">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xs font-black uppercase tracking-[0.2em] mb-1 ${
                      result.recommendation.matchScore >= 80 ? "text-green-500" : 
                      result.recommendation.matchScore >= 60 ? "text-primary" : 
                      "text-yellow-600"
                    }`}>
                      {result.recommendation.matchScore >= 90 ? "Perfect Match" :
                       result.recommendation.matchScore >= 75 ? "Strong Match" :
                       result.recommendation.matchScore >= 55 ? "Good Match" :
                       result.recommendation.matchScore >= 35 ? "Fair Match" : "Weak Match"}
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-muted/50 border border-border/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {result.recommendation.confidence} Confidence
                    </div>
                  </div>
                </div>

                {/* Recommendation Details */}
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                        AI Top Recommendation
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                      {result.recommendation.bestPick}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed max-w-2xl font-medium">
                      {result.recommendation.rationale}
                    </p>
                  </div>

                  {/* Quick Feature Tags (Derived from match rationale) */}
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                    {result.recommendation.scoreBreakdown && (
                      <>
                        {result.recommendation.scoreBreakdown.reliability >= 85 && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] font-black uppercase text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Ultra Reliable
                          </div>
                        )}
                        {result.recommendation.scoreBreakdown.value >= 85 && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase text-primary">
                            <DollarSign className="w-3 h-3" />
                            Best Value
                          </div>
                        )}
                        {result.recommendation.scoreBreakdown.features >= 85 && (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase text-blue-600">
                            <Zap className="w-3 h-3" />
                            Feature Rich
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Enhanced Score Breakdown */}
              {result.recommendation.scoreBreakdown && (
                <div className="mt-10 pt-8 border-t border-border/5">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                    {[
                      { label: "Value", value: result.recommendation.scoreBreakdown.value, icon: <DollarSign className="w-3.5 h-3.5" /> },
                      { label: "Condition", value: result.recommendation.scoreBreakdown.condition, icon: <Car className="w-3.5 h-3.5" /> },
                      { label: "Reliability", value: result.recommendation.scoreBreakdown.reliability, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                      { label: "Features", value: result.recommendation.scoreBreakdown.features, icon: <Zap className="w-3.5 h-3.5" /> },
                      { label: "Data Quality", value: result.recommendation.scoreBreakdown.dataQuality, icon: <Activity className="w-3.5 h-3.5" /> },
                    ].map((factor) => {
                      const stripePattern = "linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)";
                      return (
                        <div key={factor.label} className="space-y-3 group/factor">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground group-hover/factor:text-primary transition-colors">{factor.icon}</span>
                              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                {factor.label}
                              </span>
                            </div>
                            <span className="text-xs font-black">{Math.round(factor.value)}</span>
                          </div>
                          <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden relative border border-border/5 shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                                factor.value >= 80 ? "bg-green-500" : 
                                factor.value >= 60 ? "bg-primary" : 
                                "bg-yellow-500"
                              }`}
                              style={{ 
                                width: `${factor.value}%`,
                                backgroundImage: stripePattern,
                                backgroundSize: "20px 20px"
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specs Comparison Grid */}
          <div className="bg-card border border-border/20 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-5 bg-muted/5 border-b border-border/10">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Specifications & AI Ratings</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Excellent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Good</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/10">
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground w-1/4">
                      Category
                    </th>
                    {result.vehicles.map((v) => (
                      <th
                        key={v.id}
                        className="px-6 py-4 text-left"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Vehicle</span>
                          <span className="text-sm font-black truncate">{v.make} {v.model}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/5">
                  <VisualSpecRow 
                    label="Road Test Score" 
                    icon={<Gauge className="w-3.5 h-3.5" />}
                    isScore
                    values={result.vehicles.map(v => ({ id: v.id, val: v.scores?.roadTest || 0 }))}
                  />
                  <VisualSpecRow 
                    label="Reliability" 
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    isScore
                    values={result.vehicles.map(v => ({ id: v.id, val: v.scores?.reliability || 0 }))}
                  />
                  <VisualSpecRow 
                    label="Owner Satisfaction" 
                    icon={<Award className="w-3.5 h-3.5" />}
                    isScore
                    values={result.vehicles.map(v => ({ id: v.id, val: v.scores?.satisfaction || 0 }))}
                  />
                  <VisualSpecRow 
                    label="Price" 
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    unit=""
                    showLeader={false}
                    values={result.vehicles.map(v => ({ 
                      id: v.id, 
                      val: v.price ? `$${v.price.toLocaleString()}` : null,
                      numericVal: v.price || 0,
                      max: Math.max(...result.vehicles.map(vh => vh.price || 0)) * 1.1
                    }))}
                  />
                  <VisualSpecRow 
                    label="Mileage" 
                    icon={<Gauge className="w-3.5 h-3.5" />}
                    unit=" mi"
                    showLeader={false}
                    values={result.vehicles.map(v => ({ 
                      id: v.id, 
                      val: v.miles,
                      max: Math.max(...result.vehicles.map(vh => vh.miles || 0)) * 1.1
                    }))}
                  />

                  {/* Technical Performance Specs */}
                  <VisualSpecRow 
                    label="Horsepower" 
                    icon={<Zap className="w-3.5 h-3.5" />}
                    unit=" hp"
                    values={result.vehicles.map(v => ({ 
                      id: v.id, 
                      val: v.horsepower || null,
                      max: Math.max(...result.vehicles.map(vh => vh.horsepower || 0)) * 1.1
                    }))}
                  />
                  <VisualSpecRow 
                    label="Torque" 
                    icon={<Activity className="w-3.5 h-3.5" />}
                    unit=" lb-ft"
                    values={result.vehicles.map(v => ({ 
                      id: v.id, 
                      val: v.torque || null,
                      max: Math.max(...result.vehicles.map(vh => vh.torque || 0)) * 1.1
                    }))}
                  />
                  <VisualSpecRow 
                    label="MPG Highway" 
                    icon={<Wind className="w-3.5 h-3.5" />}
                    unit=" mpg"
                    values={result.vehicles.map(v => ({ 
                      id: v.id, 
                      val: v.mpgHighway || null,
                      max: 50 // Standard max for MPG visual
                    }))}
                  />
                  
                  <SpecRow label="Year" icon={<Calendar className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium">{v.year || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Engine" icon={<Activity className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium">{v.engine || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Ext Color" icon={<Palette className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-border/20 shadow-sm" style={{ backgroundColor: v.exteriorColor || "transparent" }} />
                          <span className="text-sm font-medium capitalize">{v.exteriorColor || "—"}</span>
                        </div>
                      </td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Int Color" icon={<Palette className="w-3.5 h-3.5 opacity-60" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border border-border/20 shadow-sm" style={{ backgroundColor: v.interiorColor || "transparent" }} />
                          <span className="text-sm font-medium capitalize">{v.interiorColor || "—"}</span>
                        </div>
                      </td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Body Type" icon={<Car className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium capitalize">{v.bodyType || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Fuel Type" icon={<Fuel className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium capitalize">{v.fuelType || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Transmission">
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium capitalize">{v.transmission || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Drivetrain">
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-sm font-medium uppercase">{v.drivetrain || "—"}</td>
                    ))}
                  </SpecRow>
                  <SpecRow label="Location" icon={<MapPin className="w-3.5 h-3.5" />}>
                    {result.vehicles.map((v) => (
                      <td key={v.id} className="px-6 py-4 text-xs font-medium text-muted-foreground">{v.location || "—"}</td>
                    ))}
                  </SpecRow>
                </tbody>
              </table>
            </div>
          </div>

          {/* Expert & Community Insights (Snippets) */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-black text-[11px] uppercase tracking-[0.2em]">Community & Expert Intelligence</h3>
              </div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                Real-time Web Research
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {result.vehicles.map((v) => (
                <div key={v.id} className="space-y-4">
                  <div className="flex items-center gap-2 px-4">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    <span className="text-xs font-black uppercase tracking-wider">{v.make} {v.model}</span>
                  </div>
                  
                  <div className="space-y-3">
                    {v.researchSnippets && v.researchSnippets.length > 0 ? (
                      v.researchSnippets.map((snippet, idx) => (
                        <a
                          key={idx}
                          href={snippet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-5 bg-card border border-border/10 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-primary/20 transition-all group relative overflow-hidden"
                        >
                          {/* Source Branding Icon */}
                          <div className="absolute top-4 right-4 opacity-100 transition-all duration-300">
                            {(() => {
                              try {
                                const hostname = new URL(snippet.url).hostname;
                                return (
                                  <div className="relative">
                                    <div className="absolute inset-0 bg-primary/10 blur-md rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                                      alt=""
                                      className="w-6 h-6 rounded-md relative z-10 shadow-sm"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                );
                              } catch {
                                return <Globe className="w-5 h-5 text-muted-foreground" />;
                              }
                            })()}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                snippet.source === "reddit" ? "bg-[#FF4500]" :
                                snippet.source === "youtube" ? "bg-[#FF0000]" :
                                snippet.source === "jdpower" ? "bg-primary" :
                                "bg-muted-foreground"
                              }`} />
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-1.5">
                                {snippet.source === "jdpower" ? "J.D. Power" : 
                                 snippet.source === "kbb" ? "Kelley Blue Book" :
                                 snippet.source}
                                <span className="w-1 h-1 rounded-full bg-border" />
                                {(() => {
                                  try {
                                    return new URL(snippet.url).hostname.replace('www.', '');
                                  } catch {
                                    return 'Source';
                                  }
                                })()}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-black group-hover:text-primary transition-colors leading-tight">
                              {snippet.title}
                            </h4>
                            
                            <div className="relative">
                              <Quote className="w-8 h-8 text-primary/5 absolute -top-2 -left-2" />
                              <p className="text-xs font-medium text-muted-foreground/80 leading-relaxed italic relative z-10 pl-4">
                                <HighlightedSnippet 
                                  text={snippet.snippet} 
                                  highlights={snippet.importantParts} 
                                />
                              </p>
                            </div>

                            <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest pt-2">
                              <span>Read Full Source</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="p-10 text-center border border-dashed border-border/20 rounded-[1.5rem] bg-muted/5">
                        <Globe className="w-5 h-5 mx-auto mb-2 text-muted-foreground/20" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                          Community data analyzed, no specific highlights extracted.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pros & Cons Section */}
          <div className="grid md:grid-cols-2 gap-8">
            {result.vehicles.map((v) => (
              <div key={v.id} className="bg-card border border-border/10 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                <div className="px-5 py-4 bg-muted/5 border-b border-border/5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-[12px] uppercase tracking-wider">{v.make} {v.model}</h4>
                    {v.scores?.roadTest && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Overall</span>
                        <span className="text-sm font-black text-primary">{v.scores.roadTest}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-6 flex-1">
                  {v.keyStrengths.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600">Highs</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {v.keyStrengths.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/5 border border-green-500/10 hover:bg-green-500/10 transition-colors">
                            <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" />
                            <span className="text-xs font-bold text-green-700/80 leading-tight">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {v.keyWeaknesses.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Lows</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {v.keyWeaknesses.map((w, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-colors">
                            <XCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700/80 leading-tight">{w}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Key Differences & Analysis */}
          <div className="space-y-8">
            {result.comparison.keyDifferences.length > 0 && (
              <div className="bg-card border border-border/10 rounded-2xl p-6 shadow-sm">
                <h4 className="font-black text-[11px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Key Differentiators
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {result.comparison.keyDifferences.map((diff, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/5 border border-border/5 hover:bg-muted/10 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-sm font-medium leading-relaxed">{diff}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8">
              {result.comparison.valueAnalysis && (
                <div className="bg-muted/10 border border-border/5 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <DollarSign className="w-12 h-12" />
                  </div>
                  <h4 className="font-black text-[11px] uppercase tracking-[0.2em] mb-3 text-primary">Value Assessment</h4>
                  <p className="text-sm font-medium leading-relaxed text-foreground/70">
                    {result.comparison.valueAnalysis}
                  </p>
                </div>
              )}
              {result.comparison.reliabilityNotes && (
                <div className="bg-muted/10 border border-border/5 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h4 className="font-black text-[11px] uppercase tracking-[0.2em] mb-3 text-primary">Reliability Notes</h4>
                  <p className="text-sm font-medium leading-relaxed text-foreground/70">
                    {result.comparison.reliabilityNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Verification Notes */}
          {result.verificationNotes.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-2">
              <h4 className="font-bold text-sm text-amber-700">Verification Notes</h4>
              <ul className="space-y-1">
                {result.verificationNotes.map((note, i) => (
                  <li key={i} className="text-xs text-muted-foreground">• {note}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sources */}
          {result.sources.length > 0 && (
            <div className="border-t border-border/10 pt-6">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-3">
                Sources ({result.sources.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {result.sources.map((s, idx) => (
                  <a
                    key={idx}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {s.title}
                    <span className="px-1 py-0.5 rounded bg-muted text-[8px] uppercase">{s.type}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Section - Available when 2+ vehicles selected or viewing restored session */}
      {(selectedListings.length >= 2 || restoredVehicles) && (
        <div ref={chatSectionRef} className="mt-8 space-y-6">
          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <div className="space-y-6">
              {chatMessages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  {/* Thought indicator for assistant */}
                  {msg.role === "assistant" && msg.meta?.thought && (
                    <details className="group">
                      <summary className="list-none cursor-pointer select-none inline-flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-all">
                        {msg.meta?.inProgress ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-3.5 h-3.5">
                              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            <span>Thinking...</span>
                          </div>
                        ) : (
                          <>
                            <Lightbulb className="w-3 h-3" />
                            <span>Thought</span>
                            <ChevronDown className="w-2.5 h-2.5 transition-transform group-open:rotate-180" />
                          </>
                        )}
                      </summary>
                      <div className="mt-2 text-xs text-muted-foreground/70 italic leading-relaxed max-h-24 overflow-y-auto">
                        {msg.meta.thought}
                      </div>
                    </details>
                  )}

                  {/* User message - right aligned with bubble */}
                  {msg.role === "user" && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] p-3 rounded-2xl rounded-br-none bg-primary/5 border border-primary/15 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )}

                  {/* Assistant message - left aligned with bubble */}
                  {msg.role === "assistant" && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] p-3 rounded-2xl bg-card border border-border/20 text-sm leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            ul: ({ children }) => <ul className="my-2 pl-4 list-disc space-y-1">{children}</ul>,
                            ol: ({ children }) => <ol className="my-2 pl-4 list-decimal space-y-1">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            a: ({ children, href }) => (
                              <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {msg.content || (msg.meta?.inProgress ? "" : "...")}
                        </ReactMarkdown>
                        {msg.meta?.inProgress && !msg.content && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="relative w-3.5 h-3.5">
                              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            <span className="text-xs">Thinking...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sources */}
                  {msg.role === "assistant" && msg.meta?.sources && msg.meta.sources.length > 0 && !msg.meta.inProgress && (
                    <div className="space-y-1 mt-2">
                      {msg.meta.sources.slice(0, 4).map((s, idx) => {
                        const hostname = (() => { try { return new URL(s.url).hostname; } catch { return null; } })();
                        return (
                          <div key={idx} className="group/src flex items-center gap-2 overflow-hidden">
                            {hostname && (
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                alt=""
                                className="w-3 h-3 rounded-sm opacity-40 grayscale group-hover/src:opacity-100 group-hover/src:grayscale-0 transition-all shrink-0"
                              />
                            )}
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-muted-foreground/60 hover:text-primary truncate transition-colors"
                            >
                              {s.title || hostname || s.url}
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper to highlight important parts in a snippet
function HighlightedSnippet({ text, highlights }: { text: string; highlights: string[] }) {
  if (!highlights || highlights.length === 0) return <span>{text}</span>;
  
  let parts: Array<{ text: string; highlight: boolean }> = [{ text, highlight: false }];
  
  highlights.forEach(h => {
    let nextParts: typeof parts = [];
    parts.forEach(p => {
      if (p.highlight) {
        nextParts.push(p);
      } else {
        const regex = new RegExp(`(${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
        const split = p.text.split(regex);
        split.forEach(s => {
          if (s.toLowerCase() === h.toLowerCase()) {
            nextParts.push({ text: s, highlight: true });
          } else if (s !== "") {
            nextParts.push({ text: s, highlight: false });
          }
        });
      }
    });
    parts = nextParts;
  });

  return (
    <span>
      {parts.map((p, i) => (
        p.highlight ? (
          <mark key={i} className="bg-primary/10 text-foreground font-black border-b-2 border-primary/40 not-italic px-0.5 rounded-t-sm">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      ))}
    </span>
  );
}

// Helper component for spec table rows with visual bars
function VisualSpecRow({ label, icon, values, unit = "", isScore = false, showLeader = true }: { 
  label: string; 
  icon?: React.ReactNode; 
  values: { id: string; val: number | string | null; max?: number }[];
  unit?: string;
  isScore?: boolean;
  showLeader?: boolean;
}) {
  const stripePattern = "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.05) 75%, transparent 75%, transparent)";
  
  // Find max value for leader highlighting
  const numericValues = values.map(v => typeof v.val === "number" ? v.val : 0);
  const maxValInRow = Math.max(...numericValues);
  
  return (
    <tr className="hover:bg-muted/5 transition-colors border-b border-border/5">
      <td className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-1/4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary/60">{icon}</span>}
          {label}
        </div>
      </td>
      {values.map((v, i) => {
        const numericVal = typeof v.val === "number" ? v.val : 0;
        const maxVal = v.max || 100;
        const percentage = Math.min(100, (numericVal / maxVal) * 100);
        const isLeader = showLeader && numericVal > 0 && numericVal === maxValInRow;
        
        return (
          <td key={`${v.id}-${i}`} className="px-6 py-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-black ${isLeader ? "text-primary" : ""}`}>
                    {v.val !== null ? (typeof v.val === "number" ? (isScore ? v.val : `${v.val.toLocaleString()}${unit}`) : v.val) : "—"}
                  </span>
                  {isLeader && !isScore && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Leader</span>
                  )}
                </div>
                {isScore && v.val !== null && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    numericVal >= 80 ? "bg-green-500/10 text-green-600" : 
                    numericVal >= 60 ? "bg-primary/10 text-primary" : 
                    "bg-yellow-500/10 text-yellow-600"
                  }`}>
                    {numericVal >= 80 ? "EXCELLENT" : numericVal >= 60 ? "GOOD" : "FAIR"}
                  </span>
                )}
              </div>
              {v.val !== null && typeof v.val === "number" && (
                <div className="w-full h-3 bg-muted/30 rounded-sm overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      isScore ? (
                        numericVal >= 80 ? "bg-green-500" : 
                        numericVal >= 60 ? "bg-primary" : 
                        "bg-yellow-500"
                      ) : (isLeader ? "bg-primary" : "bg-muted-foreground/30")
                    }`}
                    style={{ 
                      width: `${percentage}%`,
                      backgroundImage: (isScore || isLeader) ? stripePattern : "none",
                      backgroundSize: "20px 20px"
                    }}
                  />
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

// Helper component for spec table rows
function SpecRow({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-6 py-3 font-medium text-muted-foreground">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary/60">{icon}</span>}
          {label}
        </div>
      </td>
      {children}
    </tr>
  );
}
