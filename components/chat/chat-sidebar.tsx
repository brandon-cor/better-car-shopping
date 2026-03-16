"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, History, Lightbulb, MessageCircle, Plus, Trash2, X, AlertCircle } from "lucide-react";
import { ChatSession } from "@/lib/chat-history";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function RealtimeTimer({ start, isRunning, finalMs }: { start?: number; isRunning?: boolean; finalMs?: number }) {
  if (isRunning) return null;
  
  const ms = finalMs || (start ? Date.now() - start : 0);
  if (ms <= 0) return null;
  
  const s = ms / 1000;
  return <span>for {s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`}</span>;
}

// Format date for history items
function formatTimeAgo(timestamp: number | string): string {
  const d = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
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
}

export type ChatMeta = {
  thoughtMs?: number;
  usedTools?: boolean;
  inProgress?: boolean;
  status?: string;
  thought?: string;
  thoughtStartedAt?: number;
  toolTrace?: Array<{
    name: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    args: unknown;
    output: unknown;
  }>;
  sources?: Array<{
    title: string | null;
    url: string;
    excerpt: string | null;
  }>;
};

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  meta?: ChatMeta;
  isSearchQuery?: boolean;
}

const CHAT_ROLE_STYLES = {
  user: {
    wrapper: "justify-end",
    bubble: "bg-primary/5 text-foreground border border-primary/15 rounded-br-none",
  },
  assistant: {
    wrapper: "justify-start",
    bubble: "bg-card text-foreground border border-border/20",
  },
} as const;

interface ChatSidebarProps {
  onSearch: (query: string) => Promise<boolean>;
  onChat: (query: string) => void;
  isSearching: boolean;
  isChatting: boolean;
  isVisible: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  showHistory?: boolean;
  sessions?: ChatSession[];
  currentSessionId?: string | null;
  onSelectSession?: (session: ChatSession) => void;
  onDeleteSession?: (id: string) => void;
  isMobileSheet?: boolean; // When true, shows as bottom sheet on mobile
  onHistoryClick?: () => void;
  onNewChat?: () => void;
}

export function ChatSidebar({ 
  onSearch, 
  onChat, 
  isSearching, 
  isChatting, 
  isVisible, 
  onToggle, 
  messages,
  showHistory,
  sessions = [],
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  isMobileSheet = false,
  onHistoryClick,
  onNewChat,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"search" | "chat">("chat");
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const [showEarlierSearches, setShowEarlierSearches] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleThought = (idx: number) => {
    setExpandedThoughts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Auto-collapse thought when content starts arriving
  useEffect(() => {
    const lastMsgIdx = messages.length - 1;
    const lastMsg = messages[lastMsgIdx];
    if (lastMsg?.role === "assistant" && lastMsg.meta?.inProgress) {
      if (lastMsg.content && expandedThoughts[lastMsgIdx] === undefined) {
        setExpandedThoughts(prev => ({ ...prev, [lastMsgIdx]: false }));
      } else if (!lastMsg.content && expandedThoughts[lastMsgIdx] === undefined) {
        setExpandedThoughts(prev => ({ ...prev, [lastMsgIdx]: true }));
      }
    }
  }, [messages, expandedThoughts]);

  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(140, Math.max(44, el.scrollHeight));
    el.style.height = `${next}px`;
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    resizeTextarea();
  }, [input]);

  const handleSearch = async () => {
    if (!input.trim()) return;
    const query = input.trim();
    // On mobile sheet, close after search to show results
    if (isMobileSheet && typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Close first, then search with a small delay to ensure UI updates
      onToggle();
      setTimeout(async () => {
        const success = await onSearch(query);
        if (success) {
          setInput("");
        }
      }, 50);
    } else {
      const success = await onSearch(query);
      if (success) {
        setInput("");
      }
    }
  };

  const handleChat = () => {
    if (!input.trim()) return;
    const query = input.trim();
    setInput("");
    onChat(query);
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatSeconds = (ms?: number) => {
    if (!ms || ms <= 0) return "0s";
    const s = ms / 1000;
    return s < 10 ? `${s.toFixed(1)}s` : `${Math.round(s)}s`;
  };

  const getHostname = (url?: string | null) => {
    if (!url) return null;
    try {
      return new URL(url).hostname;
    } catch {
      return null;
    }
  };

  return (
    <>
      {/* Mobile Backdrop - below header */}
      <div 
        className={`fixed inset-0 top-[100px] bg-background/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      />

      {/* Desktop: left sidebar | Mobile: bottom sheet */}
      <aside 
        className={`
          bg-background flex flex-col shrink-0 transition-all duration-300 ease-out overflow-hidden
          ${isMobileSheet 
            ? `
               /* Mobile: bottom sheet */
               fixed z-[70] inset-x-0 bottom-0 top-auto rounded-t-3xl border-t border-border/20 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)]
               ${isVisible 
                 ? "h-[75vh] sm:h-[70vh] translate-y-0 opacity-100" 
                 : "h-0 translate-y-full opacity-0"
               }
               /* Desktop: override to left sidebar */
               lg:relative lg:z-auto lg:inset-auto lg:rounded-none lg:border-t-0 lg:shadow-none lg:border-r lg:border-border/10 lg:translate-y-0 lg:h-full
               ${isVisible 
                 ? "lg:w-[420px] lg:opacity-100" 
                 : "lg:w-0 lg:opacity-0 lg:border-r-0"
               }
              `
            : `
               /* Non-mobile-sheet mode: left drawer on all sizes */
               fixed inset-y-0 left-0 z-[70] shadow-2xl lg:relative lg:z-auto lg:shadow-none lg:border-r lg:border-border/10
               ${isVisible 
                 ? "w-[85vw] sm:w-[420px] lg:w-[420px] opacity-100 translate-x-0" 
                 : "w-0 opacity-0 -translate-x-full lg:translate-x-0 lg:border-r-0"
               }
              `
          }
        `}
      >
        {/* Mobile Sheet Header - matches desktop controls */}
        {isMobileSheet && (
          <div className="lg:hidden border-b border-border/10 bg-background">
            {/* Drag handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-border/40 rounded-full" />
            </div>
            
            {/* Header row with controls */}
            <div className="flex items-center justify-between px-4 py-2">
              {/* Left: Title */}
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Chat</span>
              </div>
              
              {/* Right: Controls - same as desktop header */}
              <div className="flex items-center gap-1">
                <button
                  onClick={onHistoryClick}
                  className={`p-2 rounded-md transition-colors ${
                    showHistory 
                      ? "text-foreground bg-foreground/5" 
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                  title="Chat History"
                >
                  <History className="w-4 h-4" />
                </button>
                
                <button
                  onClick={onNewChat}
                  className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  title="New Chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
                
                <div className="w-px h-4 bg-border/30 mx-1" />
                
                <button
                  onClick={onToggle}
                  className="p-2 rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Close Button (for left drawer mode) */}
        {!isMobileSheet && (
          <button
            onClick={onToggle}
            className="lg:hidden absolute right-4 top-4 p-2 rounded-full bg-foreground/5 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className={`flex flex-col h-full relative ${isMobileSheet ? "w-full" : "w-[85vw] sm:w-[420px]"} lg:w-[420px]`}>
        {showHistory ? (
          <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar" data-lenis-prevent>
            <h3 className="text-sm font-semibold text-foreground mb-4 px-3">Chat History</h3>
            <div className="space-y-1">
              {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/60">
                  <MessageCircle className="w-5 h-5 mb-2" />
                  <p className="text-xs">No chat history yet</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                      session.id === currentSessionId
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-foreground/5 text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSelectSession?.(session)}
                  >
                    <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] truncate block">{session.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0">
                      {formatTimeAgo(session.createdAt)}
                    </span>
                    <AlertDialog open={deleteId === session.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-destructive/70" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this chat session? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession?.(session.id);
                              setDeleteId(null);
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar" data-lenis-prevent>
          {(() => {
            // Collect all search queries with their indices
            const searchQueries = messages
              .map((m, idx) => ({ msg: m, idx }))
              .filter(item => item.msg.isSearchQuery);
            
            const latestSearch = searchQueries.length > 0 ? searchQueries[searchQueries.length - 1] : null;
            const earlierSearches = searchQueries.slice(0, -1);
            
            return (
              <>
                {/* Non-search messages first */}
                {messages.map((msg, i) => {
                  // Skip all search queries (they're rendered at the bottom)
                  if (msg.isSearchQuery) return null;
                  
                  return (
            <div key={i} className="space-y-3">
              {msg.role === "assistant" && (msg.meta?.inProgress || msg.meta?.thought || (msg.meta?.sources && msg.meta.sources.length > 0)) && (
                <div className="flex justify-start">
                  <div className="max-w-[96%] w-full">
                    <details 
                      className="group" 
                      open={!!msg.meta?.inProgress && !msg.content}
                    >
                      <summary className="list-none cursor-pointer select-none inline-flex items-center gap-2.5 mb-1.5 px-3 py-1.5 rounded-full bg-primary/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all">
                        {msg.meta?.inProgress ? (
                          <div className="flex items-center gap-2">
                            <div className="relative w-3.5 h-3.5">
                              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                              <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                            <span>{msg.meta?.status || "Thinking"}...</span>
                          </div>
                        ) : (
                          <>
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Thought </span>
                            <RealtimeTimer 
                              start={msg.meta?.thoughtStartedAt} 
                              isRunning={msg.meta?.inProgress} 
                              finalMs={msg.meta?.thoughtMs} 
                            />
                          </>
                        )}
                        {!msg.meta?.inProgress && <ChevronDown className="w-3 h-3 transition-transform duration-300 group-open:rotate-180" />}
                      </summary>
                      
                      <div className="bg-primary/[0.01] border border-border/5 rounded-2xl p-4 animate-in fade-in slide-in-from-top-1 duration-300 space-y-4">
                        {msg.meta?.thought && (
                          <div className="text-muted-foreground/70 italic text-[12px] leading-[1.6] whitespace-pre-wrap max-h-[120px] overflow-y-auto custom-scrollbar pr-1">
                            {msg.meta.thought}
                          </div>
                        )}

                        {msg.meta?.sources && msg.meta.sources.length > 0 && (
                          <div className="border-t border-border/5 pt-3">
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-2 flex items-center gap-1.5">
                              Checked {msg.meta.sources.length} sources
                            </div>
                            <ul className="grid grid-cols-1 gap-2">
                              {msg.meta.sources.slice(0, 6).map((s, idx) => (
                                <li key={idx} className="group/src flex items-center gap-2 overflow-hidden">
                                  {getHostname(s.url) ? (
                                    <img
                                      src={`https://www.google.com/s2/favicons?domain=${getHostname(s.url)}&sz=32`}
                                      alt=""
                                      className="w-3 h-3 rounded-sm opacity-40 grayscale group-hover/src:opacity-100 group-hover/src:grayscale-0 transition-all"
                                    />
                                  ) : null}
                                  <a
                                    href={s.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-muted-foreground/60 hover:text-primary truncate transition-colors"
                                  >
                                    {s.title || getHostname(s.url) || s.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              )}

              <div className={`flex ${CHAT_ROLE_STYLES[msg.role].wrapper}`}>
                  {(msg.role === "user" || msg.content || !msg.meta?.inProgress) && (
                    <div className={`max-w-[96%] p-3.5 rounded-2xl text-[13px] leading-relaxed transition-all ${CHAT_ROLE_STYLES[msg.role].bubble}`}>
                      {msg.role === "assistant" ? (
                        <div className="text-[13px] leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
                              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                              a: ({ children, href }) => {
                                const hostname = getHostname(href);
                                const source = msg.meta?.sources?.find(s => s.url === href);
                                const displayText = source?.title || children;
                                
                                return (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/[0.04] border border-primary/10 text-primary hover:bg-primary/[0.08] transition-all font-medium max-w-[290px] overflow-hidden align-middle my-0.5"
                                  >
                                    {hostname && (
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                        alt=""
                                        className="w-3 h-3 rounded-sm shrink-0"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                      />
                                    )}
                                    <span className="truncate text-[11.5px]">
                                      {displayText}
                                    </span>
                                  </a>
                                );
                              },
                              table: ({ children }) => (
                                <div className="my-2 w-full overflow-x-auto">
                                  <table className="w-full border-collapse text-[12px] leading-snug">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => <thead className="bg-muted/30">{children}</thead>,
                              th: ({ children }) => (
                                <th className="border border-border/30 px-2 py-1 text-left font-semibold whitespace-nowrap">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="border border-border/30 px-2 py-1 align-top">{children}</td>
                              ),
                              pre: ({ children }) => (
                                <pre className="my-2 w-full overflow-x-auto rounded-xl bg-muted/30 p-3 text-[12px] leading-snug">
                                  {children}
                                </pre>
                              ),
                              code: ({ children }) => (
                                <code className="rounded-md bg-muted/30 px-1 py-0.5 text-[12px]">
                                  {children}
                                </code>
                              ),
                            }}
                          >
                            {msg.content || ""}
                          </ReactMarkdown>

                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  )}
                </div>
            </div>
              );
                })}
                
                {/* Search queries at the bottom - newest content at bottom */}
                {latestSearch && (
                  <div className="space-y-1">
                    {/* Earlier searches - collapsible, above latest */}
                    {earlierSearches.length > 0 && (
                      <div className="text-center">
                        <button
                          onClick={() => setShowEarlierSearches(!showEarlierSearches)}
                          className="inline-flex items-center gap-1 text-[9px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                        >
                          <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${showEarlierSearches ? 'rotate-180' : ''}`} />
                          {earlierSearches.length} earlier {earlierSearches.length === 1 ? 'search' : 'searches'}
                        </button>
                        
                        {showEarlierSearches && (
                          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
                            {earlierSearches.map((item, idx) => (
                              <button
                                key={idx}
                                onClick={() => onSearch(item.msg.content)}
                                className="block w-full text-[9px] text-muted-foreground/40 hover:text-primary truncate px-4 py-0.5 hover:bg-primary/5 rounded transition-all"
                              >
                                {item.msg.content}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Latest search - at the very bottom */}
                    <div className="w-full text-center">
                      <p className="text-[11px] text-muted-foreground/70 truncate px-2">{latestSearch.msg.content}</p>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
          {isChatting && !messages.some((m) => m.role === "assistant" && m.meta?.inProgress) && (
            <div className={`flex ${CHAT_ROLE_STYLES.assistant.wrapper}`}>
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-primary/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-all">
                <div className="relative w-3.5 h-3.5">
                  <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        )}

        <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border/10">
          <div className="relative flex flex-col gap-2">
            <div className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/30 transition-all">
              <textarea
                ref={textareaRef}
                placeholder="Ask about cars..."
                value={input}
                rows={1}
                onChange={(e) => {
                  setInput(e.target.value);
                  resizeTextarea();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChat();
                  }
                }}
                className="w-full resize-none overflow-y-auto border-0 bg-transparent px-4 py-3 text-[13px] focus:outline-none placeholder:text-muted-foreground/30 leading-relaxed"
              />
              <div className="flex items-center justify-end px-3 pb-3">
                <button
                  onClick={() => {
                    if (input.trim()) handleChat();
                  }}
                  className="h-8 px-4 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] transition-all bg-foreground text-background hover:opacity-90 active:scale-95"
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
