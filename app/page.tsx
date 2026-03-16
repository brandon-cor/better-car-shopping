"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { SearchParams } from "@/lib/schema";
import { createDebouncedStorage } from "@/lib/storage/debounced-storage";
import { getUserStorage, setUserStorage, STORAGE_KEYS } from "@/lib/storage/user-storage";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser, SignUpButton, SignInButton } from "@clerk/nextjs";
import {
  History,
  Phone,
  PhoneCall,
  PhoneMissed,
  PhoneOff,
  Voicemail,
  Search,
  Sparkles,
  Zap,
  ArrowRight,
  MessageSquare,
  Car,
  Clock,
  ChevronRight,
  Download,
  Terminal,
  Layers,
  Globe,
  Command,
  CheckCircle2,
  Plus,
  BarChart3,
  Users,
  Timer,
  Sun,
  Moon,
  Monitor,
  ScanSearch,
  MessageCircle,
  Eraser
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";

import { Call, DisplayListing, mapCarListing } from "@/lib/types";
import { TopHeader } from "@/components/layout/header";
import { ChatSidebar, ChatMessage } from "@/components/chat/chat-sidebar";
import { ChatSession, getSessions, saveSession, deleteSession, generateSessionTitle, createSessionId, getCurrentSessionId, setCurrentSessionId } from "@/lib/chat-history";
import { ListingGrid } from "@/components/vehicle/listing-grid";
import { SortDropdown, SORT_OPTIONS } from "@/components/vehicle/sort-dropdown";
import { FilterDropdown, FilterValues } from "@/components/vehicle/filter-dropdown";
import { LandingPage } from "@/components/landing/landing-page";
import { Footer } from "@/components/layout/footer";
import { ResearchAgentsPanel } from "@/components/research/research-agents-panel";
import { ListingDetailView } from "@/components/vehicle/listing-detail";
import SiriOrb from "@/components/ui/siri-orb";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";
import { EmptyStateCards, CardEvent } from "@/components/ui/empty-state-cards";
import { AutopilotDashboard } from "@/components/autopilot";
import { VehicleMatch } from "@/lib/autopilot";
import { UpgradeLimitModal, LimitFeature } from "@/components/pricing";
import { syncFavoritesOnly } from "@/hooks/use-sync-local-data";


// Session storage keys
const SESSION_KEYS = {
  SEARCH: "vehique_search",
  SIDEBAR: "vehique_sidebar",
  MESSAGES: "vehique_messages",
  HAS_SEARCHED: "vehique_has_searched",
  LOCATION: "vehique_user_location",
};

const SHOWROOM_EMPTY_CARDS: CardEvent[] = [
  {
    id: 1,
    title: "1967 Ford Mustang",
    subtitle: "Shelby GT500 Fastback",
    location: "Los Angeles, CA",
    image: "/aesthetic/Classic Car European Cityscape.png",
    badge: "Saved",
    badgeIcon: "star" as const,
  },
  {
    id: 2,
    title: "2024 Porsche 911",
    subtitle: "GT3 RS Weissach Package",
    location: "Miami, FL",
    image: "/aesthetic/Classic Porsche Scene Photo.png",
    badge: "Price Drop",
    badgeIcon: "trending" as const,
  },
  {
    id: 3,
    title: "Ferrari F40",
    subtitle: "Rosso Corsa / 5k miles",
    location: "New York, NY",
    image: "/aesthetic/Sleek Race Car in Fog.png",
    badge: "Rare Find",
    badgeIcon: "zap" as const,
  },
];

const AUTOPILOT_EMPTY_CARDS: CardEvent[] = [
  {
    id: 1,
    title: "Price Negotiator",
    subtitle: "Negotiating 2024 BMW X5",
    location: "Active Agent",
    image: "/aesthetic/Surreal Cityscape Sunset Photo.png",
    badge: "Processing",
    badgeIcon: "clock" as const,
  },
  {
    id: 2,
    title: "Market Scanner",
    subtitle: "Monitoring Porsche 911 Prices",
    location: "24/7 Watch",
    image: "/aesthetic/Sleek Race Car in Fog.png",
    badge: "Alert Set",
    badgeIcon: "zap" as const,
  },
  {
    id: 3,
    title: "Dealer Contact",
    subtitle: "Scheduling Test Drive",
    location: "Santa Monica BMW",
    image: "/aesthetic/Classic Porsche Scene Photo.png",
    badge: "Scheduled",
    badgeIcon: "clock" as const,
  },
];

const DEALERS_EMPTY_CARDS: CardEvent[] = [
  {
    id: 1,
    title: "Direct Dealer Call",
    subtitle: "AI negotiates on your behalf",
    location: "Instant Connection",
    image: "/aesthetic/Surreal Cityscape Sunset Photo.png",
    badge: "Ready",
    badgeIcon: "zap" as const,
  },
  {
    id: 2,
    title: "Price Verification",
    subtitle: "Real-time dealer quotes",
    location: "Live Pricing",
    image: "/aesthetic/Sleek Race Car in Fog.png",
    badge: "Verified",
    badgeIcon: "star" as const,
  },
  {
    id: 3,
    title: "Test Drive Booking",
    subtitle: "Schedule appointments instantly",
    location: "Nationwide",
    image: "/aesthetic/Classic Car European Cityscape.png",
    badge: "Available",
    badgeIcon: "clock" as const,
  },
];

export default function Page() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Results");
  const [hasSearched, setHasSearched] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [limitReason, setLimitReason] = useState<"search" | "time" | "click" | "call" | "autopilot">("search");
  // Upgrade modal state for logged-in user limits
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<LimitFeature>("SEARCH");
  const [upgradeLimit, setUpgradeLimit] = useState<number | undefined>();
  const [upgradeResetTime, setUpgradeResetTime] = useState<number | undefined>();
  const [totalFound, setTotalFound] = useState(0);
  const [favorites, setFavorites] = useState<DisplayListing[]>([]);
  const [currentSort, setCurrentSort] = useState(SORT_OPTIONS[0]);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionIdState] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedListings, setSelectedListings] = useState<DisplayListing[]>([]);
  const [compareTriggerToken, setCompareTriggerToken] = useState(0);
  const [researchChatInput, setResearchChatInput] = useState("");
  const [researchHistoryTrigger, setResearchHistoryTrigger] = useState(0);
  const [userLocation, setUserLocation] = useState<{ zip: string; radius: number } | null>(null);
  const currentSortRef = useRef(SORT_OPTIONS[0]);
  const isInitializedRef = useRef(false);
  const locationInitializedRef = useRef(false);
  const lastFetchedParamsRef = useRef<string | null>(null);
  const searchParamsRef = useRef<Partial<SearchParams>>({});

  const [openedListingsCount, setOpenedListingsCount] = useState(0);
  const interactionTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Time-based limit trigger (30 seconds) for anonymous users
  useEffect(() => {
    if (!mounted || isSignedIn || !hasSearched) return;

    // Clear any existing timer
    if (interactionTimeRef.current) {
      clearTimeout(interactionTimeRef.current);
    }

    interactionTimeRef.current = setTimeout(() => {
      // Only show if not already open and user hasn't signed in
      if (!isSignedIn) {
        setLimitReason("time");
        setIsLimitDialogOpen(true);
      }
    }, 30000); // 30 seconds

    return () => {
      if (interactionTimeRef.current) {
        clearTimeout(interactionTimeRef.current);
      }
    };
  }, [mounted, isSignedIn, hasSearched]);

  // Debounced storage for chat messages
  const chatMessagesStorage = useMemo(
    () => createDebouncedStorage<ChatMessage[]>(SESSION_KEYS.MESSAGES, 1000),
    []
  );

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Initialize from URL and sessionStorage on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Read from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("q") || "";

    // Read from localStorage
    const storedSidebar = localStorage.getItem(SESSION_KEYS.SIDEBAR);
    const storedMessages = localStorage.getItem(SESSION_KEYS.MESSAGES);

    // Only restore sidebar visibility on desktop (>= 1024px), never on mobile
    if (storedSidebar !== null && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarVisible(storedSidebar === "true");
    }
    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          const normalized: ChatMessage[] = parsed
            .filter((m: any) => m && typeof m.content === "string")
            .map((m: any) => {
              const role = m.role === "bot" ? "assistant" : m.role;
              if (role === "user" || role === "assistant") {
                // Default old user messages to search queries for clean display
                const isSearchQuery = role === "user" ? (m.isSearchQuery !== false) : undefined;
                return { role, content: m.content, meta: m.meta, isSearchQuery };
              }
              return null;
            })
            .filter(Boolean) as ChatMessage[];
          setChatMessages(normalized);
        }
      } catch { }
    }

    // Set hasSearched and optional tab when URL has q (search) or tab (dashboard view)
    const urlTab = urlParams.get("tab");
    if (urlSearch) {
      setHasSearched(true);
      setSearch(urlSearch);
    }
    if (urlTab) {
      const validTabs = ["Results", "Showroom", "Research Agents", "Dealer Connect", "Autopilot"];
      if (validTabs.includes(urlTab)) {
        setHasSearched(true);
        setActiveTab(urlTab);
      }
    }

    // Load sessions
    setSessions(getSessions());
    const storedSessionId = getCurrentSessionId();
    if (storedSessionId) {
      setCurrentSessionIdState(storedSessionId);
    } else {
      // Create new session if none exists
      const newId = createSessionId();
      setCurrentSessionIdState(newId);
      setCurrentSessionId(newId);
    }

    setMounted(true);
  }, []);

  // Detect and initialize user location on mount
  useEffect(() => {
    // If user is signed in, clear the anonymous search limit so they have a fresh start if they sign out
    if (isSignedIn && isLoaded) {
      // Clear client-side limit
      localStorage.removeItem("vehique_anonymous_search_count");
      setIsLimitDialogOpen(false); // Close dialog if open

      // Clear server-side IP limit
      // We fire and forget this request
      fetch("/api/auth/reset-limit", { method: "POST" }).catch(() => { });
    }

    if (locationInitializedRef.current || !mounted) return;
    locationInitializedRef.current = true;

    const initLocation = async () => {
      // Try loading from localStorage first
      try {
        const stored = localStorage.getItem(SESSION_KEYS.LOCATION);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if less than 24 hours old
          if (Date.now() - parsed.detectedAt < 24 * 60 * 60 * 1000 && parsed.zip) {
            const loc = { zip: parsed.zip, radius: 25 };
            setUserLocation(loc);
            setActiveFilters(prev => ({ ...prev, zip: loc.zip, radius: loc.radius }));
            return;
          }
        }
      } catch { }

      // Auto-detect using browser geolocation
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000,
            });
          });

          const { latitude, longitude } = position.coords;

          // Reverse geocode to get zip
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { 'User-Agent': 'Vehique-App' } }
          );

          if (response.ok) {
            const data = await response.json();
            const zip = data.address?.postcode?.split('-')[0];
            if (zip) {
              const loc = { zip, radius: 25 };
              setUserLocation(loc);
              setActiveFilters(prev => ({ ...prev, zip: loc.zip, radius: loc.radius }));

              // Store in localStorage
              localStorage.setItem(SESSION_KEYS.LOCATION, JSON.stringify({
                zip,
                city: data.address?.city || data.address?.town,
                state: data.address?.state,
                detectedAt: Date.now(),
              }));
            }
          }
        } catch (err) {
          console.log("Location detection skipped:", err);
        }
      }
    };

    initLocation();
  }, [mounted]);

  useEffect(() => {
    currentSortRef.current = currentSort;
  }, [currentSort]);

  // Persist sidebar visibility to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(SESSION_KEYS.SIDEBAR, String(isSidebarVisible));
    }
  }, [isSidebarVisible, mounted]);

  // Track last window width to detect resize direction
  const lastWidthRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Auto-hide sidebar only when screen SHRINKS below lg (1024px)
  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const wasAboveLg = lastWidthRef.current >= 1024;
      const isNowBelowLg = currentWidth < 1024;

      // Only close if we're resizing DOWN past the threshold
      if (wasAboveLg && isNowBelowLg && isSidebarVisible) {
        setIsSidebarVisible(false);
      }

      lastWidthRef.current = currentWidth;
    };

    window.addEventListener('resize', handleResize);
    lastWidthRef.current = window.innerWidth;

    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarVisible]);

  // Persist chat messages using debounced storage and save session
  useEffect(() => {
    if (mounted && chatMessages.length > 0 && currentSessionId) {
      // Use debounced storage to prevent excessive writes
      chatMessagesStorage.write(chatMessages);

      // Save current session (also debounced internally by session manager)
      const existingSessions = getSessions();
      const existing = existingSessions.find(s => s.id === currentSessionId);
      const session: ChatSession = {
        id: currentSessionId,
        title: generateSessionTitle(chatMessages),
        messages: chatMessages,
        createdAt: existing?.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
      saveSession(session);
      setSessions(getSessions());
    }
  }, [chatMessages, mounted, currentSessionId, chatMessagesStorage]);

  // Flush debounced storage on unmount
  useEffect(() => {
    return () => {
      chatMessagesStorage.flush();
    };
  }, [chatMessagesStorage]);

  // Add message to chat
  const addChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  // History toggle
  const handleHistoryToggle = useCallback(() => {
    setShowHistory(prev => !prev);
    // Only open sidebar on desktop, never auto-open on mobile
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarVisible(true);
    }
  }, []);

  // New chat
  const handleNewChat = useCallback(() => {
    const newId = createSessionId();
    setCurrentSessionIdState(newId);
    setCurrentSessionId(newId);
    setChatMessages([]);
    localStorage.removeItem(SESSION_KEYS.MESSAGES);
    setShowHistory(false);
  }, []);

  // Select session from history
  const handleSelectSession = useCallback((session: ChatSession) => {
    setCurrentSessionIdState(session.id);
    setCurrentSessionId(session.id);
    setChatMessages(session.messages);
    localStorage.setItem(SESSION_KEYS.MESSAGES, JSON.stringify(session.messages));
    setShowHistory(false);
  }, []);

  // Delete session
  const handleDeleteSession = useCallback((id: string) => {
    deleteSession(id);
    setSessions(getSessions());
    if (id === currentSessionId) {
      handleNewChat();
    }
  }, [currentSessionId, handleNewChat]);

  const [loading, setLoading] = useState<string | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [listings, setListings] = useState<DisplayListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams, setSearchParams] = useState<Partial<SearchParams>>({});

  // Keep searchParamsRef in sync for stable access in observer callback
  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isScrolledEnough, setIsScrolledEnough] = useState(false);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [callDialog, setCallDialog] = useState<DisplayListing | null>(null);
  const [deleteCallId, setDeleteCallId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputWidth = Math.min(640, Math.max(360, 360 + search.length * 8));

  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 20 * 24; // approx 20 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleWheel = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    e.stopPropagation();

    const { scrollTop, scrollHeight, clientHeight } = el;
    const isScrollable = scrollHeight > clientHeight;

    if (!isScrollable) {
      e.preventDefault();
      return;
    }

    const isAtTop = scrollTop <= 0;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;

    if (isAtTop && e.deltaY < 0) {
      e.preventDefault();
    } else if (isAtBottom && e.deltaY > 0) {
      e.preventDefault();
    }
  };

  const scrollPositionRef = useRef(0);

  // Handle scroll position when opening/closing details
  useEffect(() => {
    if (selectedListingId) {
      // Opening details: scroll to top
      mainScrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
    } else if (hasSearched && !selectedListingId) {
      // Closing details: restore position
      // Small timeout to allow render
      setTimeout(() => {
        mainScrollRef.current?.scrollTo({ top: scrollPositionRef.current, behavior: "instant" });
      }, 0);
    }
  }, [selectedListingId, hasSearched]);

  useEffect(() => {
    adjustHeight(textareaRef.current);
  }, [search]);

  const fetchCallDetails = useCallback(async (callId: string, listingTitle?: string): Promise<Call | null> => {
    try {
      const res = await fetch(`/api/calls/${callId}`);

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.call) {
        const listing = data.call.metadata?.listing;

        // Calculate duration from startedAt and endedAt
        let durationSeconds: number | undefined;
        if (data.call.startedAt && data.call.endedAt) {
          const start = new Date(data.call.startedAt).getTime();
          const end = new Date(data.call.endedAt).getTime();
          durationSeconds = Math.round((end - start) / 1000);
        }

        return {
          ...data.call,
          listingTitle: listingTitle || listing?.title || data.call.listingTitle,
          dealerName: listing?.dealer || "Dealer",
          listingImage: listing?.image,
          listingId: listing?.id,
          listingPrice: listing?.price,
          listingLocation: listing?.location,
          // Call metrics
          startedAt: data.call.startedAt,
          endedAt: data.call.endedAt,
          durationSeconds,
          endedReason: data.call.endedReason,
          cost: data.call.cost,
        };
      }
      return null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  const listingsRef = useRef<DisplayListing[]>([]);
  useEffect(() => {
    listingsRef.current = listings;
  }, [listings]);

  const fetchListings = useCallback(async (params: Partial<SearchParams>, isLoadMore = false): Promise<boolean> => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setListingsLoading(true);
      setHasMore(true);
    }

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });

      const rows = 20;
      const currentListings = isLoadMore ? listingsRef.current : [];
      const start = currentListings.length;

      queryParams.set("rows", rows.toString());
      queryParams.set("start", start.toString());

      const sort = currentSortRef.current;
      if (sort.sort_by) {
        queryParams.set("sort_by", sort.sort_by);
        queryParams.set("sort_order", sort.sort_order || "desc");
      }

      const res = await fetch(`/api/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newListings = (data.listings || []).map(mapCarListing);
        const numFound = data.num_found || 0;

        if (isLoadMore) {
          // Calculate new total before setting state
          const currentCount = listingsRef.current.length;
          const newTotal = currentCount + newListings.length;
          setListings(prev => [...prev, ...newListings]);
          // Use num_found to determine if there are more results
          setHasMore(newTotal < numFound && newListings.length > 0);
        } else {
          setListings(newListings);
          // Use num_found to determine if there are more results
          setHasMore(newListings.length < numFound && newListings.length > 0);
        }

        setTotalFound(numFound);
        return true;
      } else {
        if (res.status === 429) {
          const errorData = await res.json().catch(() => ({ error: "Rate limit" }));

          // Check if this is a user limit (logged-in user) or anonymous limit
          if (errorData.code === "USER_LIMIT_REACHED") {
            // Show upgrade modal for logged-in users
            setUpgradeFeature(errorData.feature || "SEARCH");
            setUpgradeLimit(errorData.limit);
            setUpgradeResetTime(errorData.reset);
            setIsUpgradeModalOpen(true);
          } else {
            // Show sign-up dialog for anonymous users
            setLimitReason("search");
            setIsLimitDialogOpen(true);
          }
          setListingsLoading(false);
          return false;
        }
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("Search API error:", res.status, errorData);
        return true;
      }
    } catch (err) {
      console.error("Search fetch error:", err);
      return true;
    } finally {
      setListingsLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const parseAndSearch = useCallback(async (query: string, skipHistoryUpdate = false, isFromHomePage = false): Promise<boolean> => {
    // We don't want to persist the search text in the input box as the sidebar shows context

    if (!query.trim()) {
      setSearch("");
      setSearchParams({});
      fetchListings({});
      return true;
    }

    // Check limit for non-signed up users
    if (isLoaded && !isSignedIn) {
      const count = parseInt(localStorage.getItem("vehique_anonymous_search_count") || "0");
      if (count >= 3) {
        setLimitReason("search");
        setIsLimitDialogOpen(true);
        return false; // Abort search, keep input text
      }
      // Increment count
      localStorage.setItem("vehique_anonymous_search_count", (count + 1).toString());
    }

    setSearch("");

    // If searching from home page, start fresh - clear previous state immediately
    if (isFromHomePage || !hasSearched) {
      // Clear all previous state and set loading FIRST before switching to results view
      setListings([]);
      setTotalFound(0);
      setSearchParams({});
      setListingsLoading(true);

      // Create a new chat session for fresh start
      const newId = createSessionId();
      setCurrentSessionIdState(newId);
      setCurrentSessionId(newId);
      setChatMessages([]);
      localStorage.removeItem(SESSION_KEYS.MESSAGES);

      // Reset params ref to prevent stale fetch from effect
      lastFetchedParamsRef.current = null;
    } else {
      // Subsequent searches within results page - just show loading
      setListings([]);
      setTotalFound(0);
      setListingsLoading(true);
    }

    // Update URL for browser history
    if (!skipHistoryUpdate) {
      const url = new URL(window.location.href);
      url.searchParams.set("q", query);
      window.history.pushState({ search: query }, "", url.toString());

      // Add search query to chat (after potentially clearing messages above)
      setChatMessages(prev => [...prev, { role: "user", content: query, isSearchQuery: true }]);
    }

    setHasSearched(true);
    // Only open sidebar on desktop, never auto-open on mobile
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarVisible(true);
    }

    try {
      const res = await fetch("/api/parse-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      let params: Record<string, any> = {};
      if (res.ok) {
        const data = await res.json();
        params = data.parsed_params || {};

        // Merge user location if NL didn't specify location
        if (!params.zip && !params.city && userLocation) {
          params.zip = userLocation.zip;
          params.radius = params.radius || userLocation.radius;
        }

        setSearchParams(params);
        // Sync filters from NL parsed params
        setActiveFilters(params as FilterValues);
        const success = await fetchListings(params);
        if (!success) {
          setSearch(query);
          return false;
        }
        return true;
      } else {
        // Use location even for failed parse
        const fallbackParams = userLocation ? { zip: userLocation.zip, radius: userLocation.radius } : {};
        const success = await fetchListings(fallbackParams);
        if (!success) {
          setSearch(query);
          return false;
        }
        return true;
      }

    } catch (err) {
      console.error("Search error:", err);
      const fallbackParams = userLocation ? { zip: userLocation.zip, radius: userLocation.radius } : {};
      const success = await fetchListings(fallbackParams);
      if (!success) {
        setSearch(query);
        return false;
      }
      return true;
    } finally {
      setListingsLoading(false);
    }
  }, [fetchListings, userLocation, hasSearched]);

  const handleChat = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setSearch("");
    const userMessage: ChatMessage = { role: "user", content: query, isSearchQuery: false };
    addChatMessage(userMessage);

    setHasSearched(true);
    // Only open sidebar on desktop, never auto-open on mobile
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsSidebarVisible(true);
    }
    setChatLoading(true);

    const updateInProgressAssistant = (fn: (m: ChatMessage) => ChatMessage) => {
      setChatMessages((prev) => {
        const reverseIdx = [...prev].reverse().findIndex((m) => m.role === "assistant" && m.meta?.inProgress);
        if (reverseIdx === -1) return prev;
        const idx = prev.length - 1 - reverseIdx;
        const next = [...prev];
        next[idx] = fn(next[idx]);
        return next;
      });
    };

    const getHostname = (url?: string | null) => {
      if (!url) return null;
      try {
        return new URL(url).hostname;
      } catch {
        return null;
      }
    };

    try {
      const currentMessages = [...chatMessages, userMessage];
      const modelMessages = currentMessages.map((m) => ({ role: m.role, content: m.content }));

      // Placeholder assistant message that we update from SSE events.
      addChatMessage({
        role: "assistant",
        content: "",
        meta: {
          inProgress: true,
          status: "Thinking",
          thought: "",
          usedTools: false,
          sources: [],
          thoughtStartedAt: Date.now(),
        },
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: modelMessages, stream: true }),
      });

      if (!res.ok) {
        toast({
          title: "Chat Error",
          description: "Failed to get a response from the AI. Please try again.",
          variant: "destructive",
        });
        updateInProgressAssistant((m) => ({ ...m, content: "Failed to get a response from the AI.", meta: { ...(m.meta || {}), inProgress: false } }));
        return;
      }

      if (!res.body) {
        const data = await res.json();
        if (data.message) {
          updateInProgressAssistant((m) => ({
            ...m,
            role: data.message.role,
            content: data.message.content,
            meta: { ...(data.meta || {}), inProgress: false },
          }));
        }
        return;
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
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!dataLine) continue;

          const payload = dataLine.replace(/^data:\s*/, "");
          let evt: any;
          try {
            evt = JSON.parse(payload);
          } catch {
            continue;
          }

          if (evt.type === "step" && evt.data) {
            updateInProgressAssistant((m) => {
              const prevSteps = ((m.meta as any)?.steps || []) as any[];
              const existingIdx = prevSteps.findIndex((s) => s.id === evt.data.id);
              const nextSteps = [...prevSteps];
              if (existingIdx >= 0) nextSteps[existingIdx] = evt.data;
              else nextSteps.push(evt.data);

              return {
                ...m,
                meta: {
                  ...(m.meta || {}),
                  steps: nextSteps,
                  status: evt.data.label,
                  usedTools: (m.meta as any)?.usedTools || evt.data.label.includes("Parallel"),
                },
              };
            });
          }

          if (evt.type === "status" && evt.data?.status) {
            updateInProgressAssistant((m) => ({
              ...m,
              meta: {
                ...(m.meta || {}),
                status: evt.data.status,
              },
            }));
          }

          if (evt.type === "thought" && evt.data?.delta) {
            updateInProgressAssistant((m) => ({
              ...m,
              meta: {
                ...(m.meta || {}),
                thought: ((m.meta as any)?.thought || "") + evt.data.delta,
              },
            }));
          }

          if (evt.type === "content" && evt.data?.delta) {
            updateInProgressAssistant((m) => ({
              ...m,
              content: (m.content || "") + evt.data.delta,
            }));
          }

          if (evt.type === "sources" && evt.data?.sources) {
            const sources = (evt.data.sources as any[])
              .map((s) => ({
                title: s.title,
                url: s.url,
                excerpt: s.excerpt || null,
              }))
              .filter((s) => s.url);
            updateInProgressAssistant((m) => ({
              ...m,
              meta: {
                ...(m.meta || {}),
                usedTools: true,
                sources,
              },
            }));
          }

          if (evt.type === "done") {
            updateInProgressAssistant((m) => ({
              ...m,
              meta: { ...(m.meta || {}), ...(evt.data?.meta || {}), inProgress: false },
            }));
          }

          if (evt.type === "error") {
            updateInProgressAssistant((m) => ({
              ...m,
              content: evt.data?.message || "Error",
              meta: { ...(m.meta || {}), inProgress: false },
            }));
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      toast({
        title: "Chat Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  }, [chatMessages, addChatMessage, toast]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSearch = urlParams.get("q") || "";

      if (urlSearch) {
        // Trigger search but skip URL update since we're navigating history
        parseAndSearch(urlSearch, true);
      } else {
        // No search in URL, go back to landing
        setSearch("");
        setHasSearched(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [parseAndSearch]);

  // Trigger search on mount if URL has search param
  const initialSearchDoneRef = useRef(false);
  useEffect(() => {
    if (!mounted || initialSearchDoneRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get("q");
    if (urlSearch) {
      initialSearchDoneRef.current = true;
      // Skip URL update since we're loading from URL, skip adding to chat since messages are restored
      parseAndSearch(urlSearch, true);
    }
  }, [mounted, parseAndSearch]);

  useEffect(() => {
    const mainElement = mainScrollRef.current;
    if (!mainElement) return;

    const handleScroll = () => {
      // If we're in detail view, only show after scrolling ~100px
      if (selectedListingId) {
        setIsScrolledEnough(mainElement.scrollTop > 100);
      } else {
        setIsScrolledEnough(true);
      }
    };

    mainElement.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, [selectedListingId]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      // Use ref to always get latest searchParams, avoiding stale closure issues
      const currentParams = searchParamsRef.current;
      const hasValidParams = Object.keys(currentParams).length > 0;

      if (entries[0].isIntersecting && hasMore && !listingsLoading && !loadingMore && activeTab === "Results" && hasValidParams) {
        fetchListings(currentParams, true);
      }
    }, { threshold: 0.1 });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, listingsLoading, loadingMore, fetchListings, activeTab]);

  // Load favorites when user signs in
  useEffect(() => {
    fetchCalls();

    // Load favorites from user-isolated storage
    const loadFavorites = () => {
      const saved = getUserStorage<DisplayListing[]>(STORAGE_KEYS.FAVORITES);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        setFavorites(saved);
      }
    };

    loadFavorites();

    // Listen for favorites updates from DataSyncProvider
    const handleFavoritesUpdated = (e: CustomEvent) => {
      if (e.detail && Array.isArray(e.detail)) {
        setFavorites(e.detail);
      }
    };

    window.addEventListener("favorites-updated", handleFavoritesUpdated as EventListener);
    return () => {
      window.removeEventListener("favorites-updated", handleFavoritesUpdated as EventListener);
    };
  }, []);

  // Reload favorites when user changes (sign in/out)
  useEffect(() => {
    if (isSignedIn && user?.id) {
      // Small delay to let DataSyncProvider fetch from Supabase first
      const timeoutId = setTimeout(() => {
        const saved = getUserStorage<DisplayListing[]>(STORAGE_KEYS.FAVORITES);
        if (saved && Array.isArray(saved)) {
          setFavorites(saved);
        }
      }, 1500);
      return () => clearTimeout(timeoutId);
    }
  }, [isSignedIn, user?.id]);

  // Save favorites to user-isolated storage and sync to Supabase
  const favoritesInitializedRef = useRef(false);
  const lastSyncedCountRef = useRef(0);

  useEffect(() => {
    // Always save to user storage
    setUserStorage(STORAGE_KEYS.FAVORITES, favorites);

    // Skip first render (initial load from storage/Supabase)
    if (!favoritesInitializedRef.current) {
      favoritesInitializedRef.current = true;
      lastSyncedCountRef.current = favorites.length;
      return;
    }

    // Only sync to Supabase if user is signed in AND favorites actually changed
    // Skip if count matches last synced (prevents double-sync after Supabase load)
    if (isSignedIn && favorites.length !== lastSyncedCountRef.current) {
      lastSyncedCountRef.current = favorites.length;

      // Immediate sync for reliability (no debounce for important data)
      syncFavoritesOnly(favorites);
    }
  }, [favorites, isSignedIn]);

  // Fetch listings when sort changes - only for sort changes, not initial load
  // Initial load is handled by parseAndSearch via URL params
  const prevSortRef = useRef(currentSort);
  useEffect(() => {
    // Only trigger re-fetch when sort actually changes (not on mount or tab switch)
    if (prevSortRef.current !== currentSort && hasSearched && activeTab === "Results") {
      // Sort changed, re-fetch with current params
      const hasParams = Object.keys(searchParams).length > 0;
      if (hasParams && !listingsLoading) {
        fetchListings(searchParams);
      }
    }
    prevSortRef.current = currentSort;
  }, [currentSort, searchParams, hasSearched, activeTab, fetchListings, listingsLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isSortOpen && !(event.target as HTMLElement).closest('.sort-dropdown')) {
        setIsSortOpen(false);
      }
      if (isFilterOpen && !(event.target as HTMLElement).closest('.filter-dropdown')) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen, isFilterOpen]);

  // Convert filters to a readable search string
  const filtersToSearchString = useCallback((filters: FilterValues): string => {
    const parts: string[] = [];

    // Year
    if (filters.year_min && filters.year_max && filters.year_min === filters.year_max) {
      parts.push(`${filters.year_min}`);
    } else if (filters.year_min || filters.year_max) {
      if (filters.year_min && filters.year_max) {
        parts.push(`${filters.year_min}-${filters.year_max}`);
      } else if (filters.year_min) {
        parts.push(`${filters.year_min}+`);
      } else if (filters.year_max) {
        parts.push(`up to ${filters.year_max}`);
      }
    }

    // Make
    if (filters.make) {
      parts.push(filters.make.split(',').join(' or '));
    }

    // Body type
    if (filters.body_type) {
      parts.push(filters.body_type.split(',').join('/'));
    }

    // Color
    if (filters.exterior_color) {
      parts.push(filters.exterior_color.split(',').join('/'));
    }

    // Fuel type
    if (filters.fuel_type) {
      parts.push(filters.fuel_type.split(',').join('/'));
    }

    // Price
    if (filters.price_min || filters.price_max) {
      if (filters.price_max && !filters.price_min) {
        parts.push(`under $${(filters.price_max / 1000).toFixed(0)}k`);
      } else if (filters.price_min && !filters.price_max) {
        parts.push(`$${(filters.price_min / 1000).toFixed(0)}k+`);
      } else if (filters.price_min && filters.price_max) {
        parts.push(`$${(filters.price_min / 1000).toFixed(0)}k-$${(filters.price_max / 1000).toFixed(0)}k`);
      }
    }

    // Mileage
    if (filters.miles_max) {
      parts.push(`under ${(filters.miles_max / 1000).toFixed(0)}k miles`);
    }

    // Location
    if (filters.zip && filters.radius) {
      parts.push(`within ${filters.radius} mi of ${filters.zip}`);
    } else if (filters.zip) {
      parts.push(`near ${filters.zip}`);
    }

    return parts.join(' ').trim();
  }, []);

  // Handle filter apply - update search params and refetch
  const handleFiltersApply = useCallback((newFilters: FilterValues) => {
    setActiveFilters(newFilters);
    setSearchParams(newFilters);
    fetchListings(newFilters);

    // Update search input to reflect filters
    const searchString = filtersToSearchString(newFilters);
    if (searchString) {
      setSearch(searchString);
    }
  }, [fetchListings, filtersToSearchString]);

  const toggleFavorite = (listing: DisplayListing) => {
    setFavorites(prev => {
      const isFav = prev.find(f => f.id === listing.id);
      if (isFav) return prev.filter(f => f.id !== listing.id);
      return [...prev, listing];
    });
  };

  const toggleSelectListing = (listing: DisplayListing) => {
    setSelectedListings(prev => {
      const isSelected = prev.find(s => s.id === listing.id);
      if (isSelected) return prev.filter(s => s.id !== listing.id);
      if (prev.length >= 4) return prev;
      return [...prev, listing];
    });
  };

  useEffect(() => {
    async function loadRecentCalls() {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const filtered = calls
        .filter(call => new Date(call.createdAt) >= twentyFourHoursAgo)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const details = await Promise.all(
        filtered.map(call => fetchCallDetails(call.id, call.listingTitle))
      );
      setRecentCalls(details.filter(Boolean) as Call[]);
    }

    if (calls.length > 0) {
      loadRecentCalls();
    } else {
      setRecentCalls([]);
    }
  }, [calls, fetchCallDetails]);

  // Track if we hit rate limit to stop polling
  const rateLimitedRef = useRef(false);

  useEffect(() => {
    const hasPendingSummaries = recentCalls.some(call => !call.summary || call.summary.trim() === "");

    // Don't poll if rate limited
    if (hasPendingSummaries && !pollingIntervalRef.current && !rateLimitedRef.current) {
      pollingIntervalRef.current = setInterval(async () => {
        await fetchCalls();
      }, 10000); // Increased to 10 seconds to reduce API load
    } else if ((!hasPendingSummaries || rateLimitedRef.current) && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [recentCalls]);

  async function fetchCalls() {
    // Skip if we recently hit rate limit
    if (rateLimitedRef.current) {
      return;
    }

    try {
      const res = await fetch("/api/calls");

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If not JSON, likely an error page - skip silently
        return;
      }

      // Handle rate limiting - stop polling for a while
      if (res.status === 429) {
        rateLimitedRef.current = true;
        // Clear polling interval
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        // Reset rate limit flag after 60 seconds
        setTimeout(() => {
          rateLimitedRef.current = false;
        }, 60000);
        return;
      }

      if (!res.ok) {
        // If response is not ok, skip silently - API might not be configured
        return;
      }

      const data = await res.json();
      const callsList = data.calls || [];
      // Map dealer name and listing details if available
      const filteredCalls = callsList
        .filter((call: any) => call.type === "outboundPhoneCall")
        .map((call: any) => ({
          ...call,
          listingTitle: call.metadata?.listing?.title || call.listingTitle,
          dealerName: call.metadata?.listing?.dealer || "Dealer",
          listingImage: call.metadata?.listing?.image,
          listingId: call.metadata?.listing?.id,
          listingPrice: call.metadata?.listing?.price,
          listingLocation: call.metadata?.listing?.location,
        }));
      setCalls(filteredCalls);
    } catch (err) {
      // Silently handle errors - API might not be configured
      if (err instanceof SyntaxError) {
        // JSON parse error - likely got HTML instead of JSON
        return;
      }
    }
  }

  const openCallDialog = useCallback((listing: DisplayListing) => {
    // Check if user is signed in before allowing call
    // isLoaded ensures Clerk has finished loading, isSignedIn checks auth status
    if (!isLoaded || !isSignedIn) {
      setLimitReason("call");
      setIsLimitDialogOpen(true);
      return;
    }
    setCallDialog(listing);
  }, [isLoaded, isSignedIn]);

  async function executeCall(listing: DisplayListing, testMode: boolean) {
    setCallDialog(null);
    setLoading(listing.id);

    // Switch to Dealer Connect tab immediately
    setActiveTab("Dealer Connect");

    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing: { ...listing, title: listing.title },
          dealerPhone: listing.phone,
          testMode
        }),
      });

      if (!res.ok) {
        // Handle rate limit or auth errors
        if (res.status === 429) {
          const errorData = await res.json().catch(() => ({ error: "Rate limit" }));
          if (errorData.code === "USER_LIMIT_REACHED") {
            setUpgradeFeature("CALL");
            setUpgradeLimit(errorData.limit);
            setUpgradeResetTime(errorData.reset);
            setIsUpgradeModalOpen(true);
          }
          setLoading(null);
          return;
        }
        if (res.status === 401) {
          // Not authenticated - show sign up dialog
          setLimitReason("click");
          setIsLimitDialogOpen(true);
          setLoading(null);
          return;
        }
        throw new Error("Call failed");
      }

      toast({ title: testMode ? "Test call initiated..." : "Connecting you with the dealer..." });

      // Keep loading state for 5 seconds to show the connecting UI
      await new Promise(resolve => setTimeout(resolve, 5000));
      await fetchCalls();
    } catch (err) {
      toast({ title: "Error", description: "Could not initiate call", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  async function deleteCall(id: string) {
    try {
      // In a real app, you would call an API endpoint to delete
      // await fetch(`/api/calls/${id}`, { method: 'DELETE' });

      // For now, just update local state
      setCalls(prev => prev.filter(c => c.id !== id));
      setRecentCalls(prev => prev.filter(c => c.id !== id));
      toast({ title: "Call history deleted" });
    } catch (err) {
      toast({ title: "Error deleting call", variant: "destructive" });
    }
  }

  // Personalized content for limit dialog based on reason
  const getLimitDialogContent = () => {
    switch (limitReason) {
      case "call":
        return {
          title: "Talk to dealers with AI assistance",
          description: "Sign up to let our AI call dealers on your behalf—get availability, negotiate pricing, and schedule test drives hands-free.",
          features: [
            { icon: <Phone className="w-4 h-4 text-primary" />, text: "AI-powered dealer calls" },
            { icon: <MessageSquare className="w-4 h-4 text-primary" />, text: "Smart negotiation assistance" },
            { icon: <Clock className="w-4 h-4 text-primary" />, text: "Schedule test drives automatically" },
          ],
        };
      case "autopilot":
        return {
          title: "Deploy your autonomous scout",
          description: "Create a free account to deploy AI scouts that monitor the market 24/7 and notify you when your dream car appears.",
          features: [
            { icon: <Zap className="w-4 h-4 text-primary" />, text: "24/7 market monitoring" },
            { icon: <Sparkles className="w-4 h-4 text-primary" />, text: "Instant match notifications" },
            { icon: <Search className="w-4 h-4 text-primary" />, text: "AI-powered recommendations" },
          ],
        };
      case "search":
        return {
          title: "Unlock the full experience",
          description: "You've used all your free searches. Create a free account to continue researching with Vehique AI.",
          features: [
            { icon: <Globe className="w-4 h-4 text-primary" />, text: "Unlimited AI Market Scans" },
            { icon: <Zap className="w-4 h-4 text-primary" />, text: "Deploy Autonomous Agents" },
            { icon: <Search className="w-4 h-4 text-primary" />, text: "Deep Research & Dealer Calls" },
          ],
        };
      case "time":
        return {
          title: "Unlock the full experience",
          description: "You've been browsing for a while. Create a free account to unlock unlimited research time.",
          features: [
            { icon: <Globe className="w-4 h-4 text-primary" />, text: "Unlimited AI Market Scans" },
            { icon: <Zap className="w-4 h-4 text-primary" />, text: "Deploy Autonomous Agents" },
            { icon: <Search className="w-4 h-4 text-primary" />, text: "Deep Research & Dealer Calls" },
          ],
        };
      default: // "click"
        return {
          title: "Unlock the full experience",
          description: "You've viewed multiple vehicles. Create a free account to access full vehicle history and dealer details.",
          features: [
            { icon: <Globe className="w-4 h-4 text-primary" />, text: "Unlimited AI Market Scans" },
            { icon: <Zap className="w-4 h-4 text-primary" />, text: "Deploy Autonomous Agents" },
            { icon: <Search className="w-4 h-4 text-primary" />, text: "Deep Research & Dealer Calls" },
          ],
        };
    }
  };

  const limitDialogContent = getLimitDialogContent();

  const LimitDialog = (
    <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
      <DialogContent className="sm:max-w-md font-google-sans-flex border-border/60 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-[900] tracking-tighter text-foreground">
            {limitDialogContent.title}
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
            {limitDialogContent.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-6">
          <div className="space-y-4">
            {limitDialogContent.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3.5 group">
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {feature.icon}
                </div>
                <span className="text-sm font-bold text-foreground/90 tracking-wide">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter className="sm:justify-start flex-col sm:flex-row gap-3 sm:gap-2">
          <SignUpButton mode="modal">
            <Button className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
              Sign Up Free
            </Button>
          </SignUpButton>
          <SignInButton mode="modal">
            <Button variant="outline" className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest border-border/40 hover:bg-foreground/5 hover:text-foreground hover:border-foreground/20 text-muted-foreground transition-all">
              Sign In
            </Button>
          </SignInButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!hasSearched) {
    return (
      <>
        <LandingPage
          search={search}
          setSearch={setSearch}
          parseAndSearch={parseAndSearch}
          t={t}
          language={language}
          setLanguage={setLanguage}
          isLangOpen={isLangOpen}
          setIsLangOpen={setIsLangOpen}
          languages={US_POPULAR_LANGUAGES}
          onTabNavigate={(tab) => {
            setHasSearched(true);
            setActiveTab(tab);
          }}
        />
        {LimitDialog}
        <UpgradeLimitModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          feature={upgradeFeature}
          limit={upgradeLimit}
          resetTime={upgradeResetTime}
        />
      </>
    );
  }

  return (
    <div className="h-screen bg-background font-sans text-foreground flex flex-col overflow-hidden">
      <TopHeader
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={() => setIsSidebarVisible(!isSidebarVisible)}
        onLogoClick={() => {
          setHasSearched(false);
          setSearch("");
          setShowHistory(false);
          // Update URL to remove search param
          const url = new URL(window.location.href);
          url.searchParams.delete("q");
          window.history.pushState({}, "", url.toString());
        }}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "Research Agents" && activeTab === "Research Agents") {
            // Only trigger history if already on the tab (user clicking tab again)
            setResearchHistoryTrigger(prev => prev + 1);
          } else {
            setActiveTab(tab);
          }
        }}
        filterSortSlot={
          (activeTab === "Results" || activeTab === "Showroom") ? (
            <div className="flex items-center gap-1.5">
              <FilterDropdown
                filters={activeFilters}
                onFiltersChange={handleFiltersApply}
                isOpen={isFilterOpen}
                setIsOpen={setIsFilterOpen}
              />
              <SortDropdown
                currentSort={currentSort}
                setCurrentSort={setCurrentSort}
                isSortOpen={isSortOpen}
                setIsSortOpen={setIsSortOpen}
              />
            </div>
          ) : undefined
        }
        onHistoryClick={handleHistoryToggle}
        onNewChat={handleNewChat}
        isHistoryOpen={showHistory}
      />

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <ChatSidebar
          onSearch={parseAndSearch}
          onChat={handleChat}
          isSearching={listingsLoading}
          isChatting={chatLoading}
          isVisible={isSidebarVisible}
          onToggle={() => setIsSidebarVisible(false)}
          messages={chatMessages}
          showHistory={showHistory}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onDeleteSession={handleDeleteSession}
          isMobileSheet={true}
          onHistoryClick={handleHistoryToggle}
          onNewChat={handleNewChat}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
          <main
            ref={mainScrollRef}
            data-lenis-prevent
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 md:px-6 lg:px-8 pt-6 pb-20 transition-all duration-300"
          >
            <div className={`mx-auto space-y-2 transition-all duration-300 ${isSidebarVisible ? "xl:max-w-[calc(100vw-450px)] 2xl:max-w-7xl" : "max-w-7xl mx-auto"
              }`}>

              {/* Content Area */}
              <div className="space-y-2">
                {activeTab === "Results" ? (
                  selectedListingId ? (
                    <ListingDetailView
                      listingId={selectedListingId}
                      initialListing={listings.find(l => l.id === selectedListingId)}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      openCallDialog={openCallDialog}
                      loading={loading}
                      onBack={() => {
                        setSelectedListingId(null);
                      }}
                      onListingClick={(id) => {
                        scrollPositionRef.current = mainScrollRef.current?.scrollTop || 0;
                        setSelectedListingId(id);
                      }}
                    />
                  ) : (
                    <div className="space-y-6">
                      {!listingsLoading && totalFound > 0 && (
                        <p className="text-[13px] text-muted-foreground font-medium">
                          {totalFound.toLocaleString()} verified listings
                        </p>
                      )}
                      <ListingGrid
                        listings={listings}
                        listingsLoading={listingsLoading}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        openCallDialog={openCallDialog}
                        loading={loading}
                        loadMoreRef={loadMoreRef}
                        loadingMore={loadingMore}
                        hasMore={hasMore}
                        isSidebarVisible={isSidebarVisible}
                        selectedListings={selectedListings}
                        onSelectListing={toggleSelectListing}
                        onCardClick={(listing) => {
                          scrollPositionRef.current = mainScrollRef.current?.scrollTop || 0;
                          setSelectedListingId(listing.id);
                          if (!isSignedIn) {
                            setOpenedListingsCount(prev => {
                              const newCount = prev + 1;
                              if (newCount >= 3) {
                                setLimitReason("click");
                                setIsLimitDialogOpen(true);
                              }
                              return newCount;
                            });
                          }
                        }}
                      />
                    </div>
                  )
                ) : activeTab === "Showroom" ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {selectedListingId ? (
                      <ListingDetailView
                        listingId={selectedListingId}
                        initialListing={favorites.find(l => l.id === selectedListingId)}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        openCallDialog={openCallDialog}
                        loading={loading}
                        onBack={() => setSelectedListingId(null)}
                        onListingClick={setSelectedListingId}
                      />
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-xl font-bold tracking-tight text-foreground/90">
                            {favorites.length} vehicles in your showroom
                          </p>
                        </div>

                        {favorites.length === 0 ? (
                          <EmptyStateCards
                            cards={SHOWROOM_EMPTY_CARDS}
                            title="Your Showroom is Empty"
                            description="Save vehicles you love to track prices and compare them side-by-side."
                            action={{
                              label: "Find Vehicles",
                              onClick: () => setActiveTab("Results")
                            }}
                          />
                        ) : (
                          <ListingGrid
                            listings={favorites}
                            listingsLoading={false}
                            favorites={favorites}
                            toggleFavorite={toggleFavorite}
                            openCallDialog={openCallDialog}
                            loading={loading}
                            loadMoreRef={{ current: null }}
                            loadingMore={false}
                            hasMore={false}
                            isSidebarVisible={isSidebarVisible}
                            selectedListings={selectedListings}
                            onSelectListing={toggleSelectListing}
                            onCardClick={(listing) => {
                              scrollPositionRef.current = mainScrollRef.current?.scrollTop || 0;
                              setSelectedListingId(listing.id);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : activeTab === "Research Agents" ? (
                  <ResearchAgentsPanel
                    selectedListings={selectedListings}
                    compareTriggerToken={compareTriggerToken}
                    chatInput={researchChatInput}
                    onChatSent={() => setResearchChatInput("")}
                    showHistoryTrigger={researchHistoryTrigger}
                    onBrowseListings={() => setActiveTab("Results")}
                    onAddToShowroom={(vehicles: Array<{ id: string; title: string; image: string | null; price: string; location?: string; dealer?: string; phone?: string; miles?: number; distance?: number; bodyType?: string; fuelType?: string; vdpUrl?: string }>) => {
                      setFavorites(prev => {
                        const newFavs = [...prev];
                        vehicles.forEach((v: { id: string; title: string; image: string | null; price: string; location?: string; dealer?: string; phone?: string; miles?: number; distance?: number; bodyType?: string; fuelType?: string; vdpUrl?: string }) => {
                          if (!newFavs.find(f => f.id === v.id)) {
                            // Create a DisplayListing-compatible object with all available fields
                            newFavs.push({
                              id: v.id,
                              title: v.title,
                              image: v.image || undefined,
                              price: v.price,
                              location: v.location || "",
                              dealer: v.dealer || "",
                              phone: v.phone,
                              miles: v.miles,
                              distance: v.distance,
                              bodyType: v.bodyType,
                              fuelType: v.fuelType,
                              vdpUrl: v.vdpUrl,
                            } as DisplayListing);
                          }
                        });
                        return newFavs;
                      });
                    }}
                  />
                ) : activeTab === "Dealer Connect" ? (
                  <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {loading ? (
                      <div className="flex flex-col space-y-8 pt-8">
                        <div className="flex items-center gap-4">
                          <SiriOrb
                            size="80px"
                            animationDuration={15}
                            colors={{
                              bg: "oklch(95% 0.02 264.695)",
                              c1: "oklch(65% 0.2 320)",
                              c2: "oklch(70% 0.15 260)",
                              c3: "oklch(85% 0.1 240)"
                            }}
                          />
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black tracking-tighter">Connecting to Dealer...</h3>
                            <p className="text-muted-foreground font-medium">AI is negotiating on your behalf</p>
                          </div>
                        </div>
                      </div>
                    ) : recentCalls.length === 0 ? (
                      <EmptyStateCards
                        cards={DEALERS_EMPTY_CARDS}
                        title="Ready to Connect"
                        description="Our AI agents are ready to call dealers, verify availability, and negotiate prices for you. Select a vehicle to start."
                        action={{
                          label: "Browse Vehicles",
                          onClick: () => setActiveTab("Results")
                        }}
                      />
                    ) : (
                      <div className="space-y-5 pt-6 max-w-2xl">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                                <SiriOrb size="36px" />
                              </div>
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                            </div>
                            <div>
                              <h2 className="text-base font-bold tracking-tight text-foreground">Agent Activity</h2>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{recentCalls.length} completed call{recentCalls.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>

                        {/* Activity List - Enhanced Row Layout */}
                        <div className="space-y-3">
                          {recentCalls.map((call, index) => {
                            // Parse summary for quick insights
                            const summaryLower = call.summary?.toLowerCase() || "";
                            const wasVoicemail = summaryLower.includes("voicemail") || summaryLower.includes("no answer") || summaryLower.includes("call ended");

                            // Parse summary to extract useful information only
                            const parseSummary = (raw: string | undefined): { insights: string[]; hasUsefulInfo: boolean } => {
                              if (!raw) return { insights: [], hasUsefulInfo: false };

                              const insights: string[] = [];
                              const lower = raw.toLowerCase();

                              // Extract availability info if not unknown
                              if (lower.includes("available") && !lower.includes("unknown")) {
                                const availMatch = raw.match(/availability[:\s]*([^•\n]+)/i);
                                if (availMatch && !availMatch[1].toLowerCase().includes("unknown")) {
                                  insights.push(`✓ ${availMatch[1].trim()}`);
                                }
                              }

                              // Extract price/OTD info if not unknown
                              const priceMatch = raw.match(/(?:out the door|otd|price)[:\s]*\$?([\d,]+)/i);
                              if (priceMatch) {
                                insights.push(`💰 OTD: $${priceMatch[1]}`);
                              }

                              // Extract fees info if mentioned
                              if (lower.includes("fees") && !lower.includes("none mentioned") && !lower.includes("not mentioned") && !lower.includes("unknown")) {
                                const feesMatch = raw.match(/fees[^•\n]*?:?\s*([^•\n]+)/i);
                                if (feesMatch && !feesMatch[1].toLowerCase().includes("unknown") && !feesMatch[1].toLowerCase().includes("none")) {
                                  insights.push(`📋 Fees: ${feesMatch[1].trim()}`);
                                }
                              }

                              // Extract deposit/hold info
                              if (lower.includes("deposit") || lower.includes("hold")) {
                                if (lower.includes("can hold") || lower.includes("will hold") || lower.includes("deposit accepted")) {
                                  insights.push("🔒 Can hold with deposit");
                                }
                              }

                              // Extract appointment info
                              if (lower.includes("appointment") && !lower.includes("unknown")) {
                                if (lower.includes("today") || lower.includes("tomorrow") || lower.includes("available")) {
                                  insights.push("📅 Appointments available");
                                }
                              }

                              // Extract contact/callback info (exclude voicemail/unknown)
                              const contactMatch = raw.match(/(?:callback|contact|spoke with)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
                              if (contactMatch) {
                                const contactName = contactMatch[1];
                                const invalidNames = ['voicemail', 'unknown', 'none', 'na', 'n/a'];
                                if (!invalidNames.includes(contactName.toLowerCase())) {
                                  insights.push(`👤 Spoke with: ${contactName}`);
                                }
                              }

                              return {
                                insights,
                                hasUsefulInfo: insights.length > 0
                              };
                            };

                            const { insights, hasUsefulInfo } = parseSummary(call.summary);

                            // Format duration for display
                            const formatDuration = (seconds?: number): string => {
                              if (!seconds || seconds < 0) return "";
                              if (seconds < 60) return `${seconds}s`;
                              const mins = Math.floor(seconds / 60);
                              const secs = seconds % 60;
                              return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
                            };

                            const duration = formatDuration(call.durationSeconds);
                            const isShortCall = call.durationSeconds !== undefined && call.durationSeconds < 30;
                            const isLongCall = call.durationSeconds !== undefined && call.durationSeconds > 120;

                            return (
                              <div
                                key={call.id}
                                className="group relative bg-card/60 hover:bg-card border border-border/30 hover:border-primary/20 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                              >
                                {/* Accent line */}
                                <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="p-4 pl-5">
                                  <div className="flex gap-4">
                                    {/* Vehicle Image - Clickable */}
                                    <button
                                      onClick={() => {
                                        if (call.listingId) {
                                          setSelectedListingId(call.listingId);
                                          setActiveTab("Results");
                                        }
                                      }}
                                      className={`shrink-0 group/img ${call.listingId ? 'cursor-pointer' : 'cursor-default'}`}
                                    >
                                      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-muted/80 to-muted/40 ring-1 ring-border/20 group-hover/img:ring-primary/30 transition-all shadow-sm">
                                        {call.listingImage ? (
                                          <img
                                            src={call.listingImage}
                                            alt={call.listingTitle || "Vehicle"}
                                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                            <Car className="w-8 h-8 text-muted-foreground/30" />
                                          </div>
                                        )}
                                        {/* Status badge overlay with duration */}
                                        <div className="absolute bottom-1 right-1">
                                          <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wide backdrop-blur-sm ${wasVoicemail
                                              ? 'bg-amber-500/90 text-white'
                                              : 'bg-emerald-500/90 text-white'
                                            }`}>
                                            {wasVoicemail ? (
                                              <>
                                                <Voicemail className="w-2.5 h-2.5" />
                                                <span>VM</span>
                                              </>
                                            ) : (
                                              <>
                                                <PhoneCall className="w-2.5 h-2.5" />
                                                {duration && <span>{duration}</span>}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 space-y-2.5">
                                      {/* Title Row */}
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                          <button
                                            onClick={() => {
                                              if (call.listingId) {
                                                setSelectedListingId(call.listingId);
                                                setActiveTab("Results");
                                              }
                                            }}
                                            className={`text-left block ${call.listingId ? '' : 'pointer-events-none'}`}
                                          >
                                            <h3 className={`text-sm font-semibold text-foreground truncate transition-colors ${call.listingId ? 'hover:text-primary cursor-pointer' : ''}`}>
                                              {call.listingTitle || "Vehicle"}
                                            </h3>
                                          </button>
                                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="text-xs text-muted-foreground font-medium">{call.dealerName}</span>
                                            {call.listingPrice && (
                                              <>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="text-xs font-semibold text-primary/80">{call.listingPrice}</span>
                                              </>
                                            )}
                                            {call.listingLocation && (
                                              <>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="text-xs text-muted-foreground">{call.listingLocation}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Time & Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-[10px] text-muted-foreground tabular-nums">
                                            {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                          {/* Delete Button */}
                                          <AlertDialog open={deleteCallId === call.id} onOpenChange={(open: boolean) => !open && setDeleteCallId(null)}>
                                            <AlertDialogTrigger asChild>
                                              <button
                                                onClick={(e: React.MouseEvent) => {
                                                  e.stopPropagation();
                                                  setDeleteCallId(call.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 transition-all text-muted-foreground/50 hover:text-destructive"
                                              >
                                                <Eraser className="w-3 h-3" />
                                              </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Call Record</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to delete this call record? This action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    deleteCall(call.id);
                                                    setDeleteCallId(null);
                                                  }}
                                                  className="bg-destructive hover:bg-destructive/90"
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        </div>
                                      </div>

                                      {/* Status & Insights */}
                                      <div className="space-y-2">
                                        {/* Status Badges Row */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {/* Call Status Badge */}
                                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${wasVoicemail
                                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {wasVoicemail ? (
                                              <>
                                                <Voicemail className="w-2.5 h-2.5" />
                                                <span>Left Voicemail</span>
                                              </>
                                            ) : (
                                              <>
                                                <PhoneCall className="w-2.5 h-2.5" />
                                                <span>Connected</span>
                                              </>
                                            )}
                                          </div>

                                          {/* Duration Badge - Only for connected calls */}
                                          {!wasVoicemail && duration && (
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${isShortCall
                                                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                : isLongCall
                                                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
                                                  : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                              }`}>
                                              <Timer className="w-2.5 h-2.5" />
                                              {duration}
                                            </div>
                                          )}

                                          {/* Info Gathered Badge */}
                                          {hasUsefulInfo && (
                                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                                              <CheckCircle2 className="w-2.5 h-2.5" />
                                              Info Gathered
                                            </div>
                                          )}
                                        </div>

                                        {/* Parsed Insights or Helpful Message */}
                                        <div className="bg-muted/30 rounded-lg px-3 py-2 border border-border/10">
                                          {hasUsefulInfo ? (
                                            <div className="space-y-1">
                                              {insights.map((insight, i) => (
                                                <p key={i} className="text-[11px] text-foreground/80 leading-relaxed">
                                                  {insight}
                                                </p>
                                              ))}
                                            </div>
                                          ) : wasVoicemail ? (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                              📞 Voicemail left — dealer hasn't called back yet. Consider calling during business hours or try another listing.
                                            </p>
                                          ) : isShortCall ? (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                              ⚡ Quick call — dealer may have been busy. Consider calling back for more details.
                                            </p>
                                          ) : (
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                              ✓ Call completed. No specific pricing or availability information was confirmed. You may want to follow up directly.
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab === "Autopilot" ? (
                  <AutopilotDashboard
                    onDeepResearch={(vehicle: VehicleMatch) => {
                      // Convert VehicleMatch to DisplayListing format and trigger research
                      // Create a minimal raw object for compatibility
                      const rawListing = {
                        id: vehicle.id,
                        heading: vehicle.title,
                        price: vehicle.priceNumeric,
                        miles: vehicle.miles,
                        vdp_url: vehicle.url,
                        body_type: vehicle.bodyType,
                        fuel_type: vehicle.fuelType,
                        dealer: {
                          name: vehicle.dealer,
                          city: vehicle.location?.split(",")[0]?.trim(),
                          state: vehicle.location?.split(",")[1]?.trim(),
                          phone: vehicle.phone,
                        },
                        media: {
                          photo_links: vehicle.image ? [vehicle.image] : [],
                        },
                      } as any;
                      const displayListing: DisplayListing = {
                        id: vehicle.id,
                        title: vehicle.title,
                        price: vehicle.price,
                        image: vehicle.image,
                        location: vehicle.location || "",
                        dealer: vehicle.dealer || "",
                        phone: vehicle.phone,
                        miles: vehicle.miles,
                        bodyType: vehicle.bodyType,
                        fuelType: vehicle.fuelType,
                        vdpUrl: vehicle.url,
                        raw: rawListing,
                      };
                      // Add to selected listings and switch to Research Agents
                      setSelectedListings([displayListing]);
                      setActiveTab("Research Agents");
                      setCompareTriggerToken(prev => prev + 1);
                    }}
                    onAddToShowroom={(vehicle: VehicleMatch) => {
                      // Add to favorites
                      // Create a minimal raw object for compatibility
                      const rawListing = {
                        id: vehicle.id,
                        heading: vehicle.title,
                        price: vehicle.priceNumeric,
                        miles: vehicle.miles,
                        vdp_url: vehicle.url,
                        body_type: vehicle.bodyType,
                        fuel_type: vehicle.fuelType,
                        dealer: {
                          name: vehicle.dealer,
                          city: vehicle.location?.split(",")[0]?.trim(),
                          state: vehicle.location?.split(",")[1]?.trim(),
                          phone: vehicle.phone,
                        },
                        media: {
                          photo_links: vehicle.image ? [vehicle.image] : [],
                        },
                      } as any;
                      const displayListing: DisplayListing = {
                        id: vehicle.id,
                        title: vehicle.title,
                        price: vehicle.price,
                        image: vehicle.image,
                        location: vehicle.location || "",
                        dealer: vehicle.dealer || "",
                        phone: vehicle.phone,
                        miles: vehicle.miles,
                        bodyType: vehicle.bodyType,
                        fuelType: vehicle.fuelType,
                        vdpUrl: vehicle.url,
                        raw: rawListing,
                      };
                      setFavorites(prev => {
                        if (prev.find(f => f.id === vehicle.id)) return prev;
                        return [...prev, displayListing];
                      });
                      toast({
                        title: "Added to Showroom",
                        description: `${vehicle.title} has been saved.`,
                      });
                    }}
                  />
                ) : null}
              </div>
            </div>
          </main>

          {/* Bottom-middle chat: only on Results tab and when sidebar is not expanded. Chat input only (no search icon or circle button). */}
          {hasSearched && activeTab === "Results" && !isSidebarVisible && (
            <div
              className={`fixed bottom-4 sm:bottom-6 lg:bottom-8 left-0 right-0 pointer-events-none z-50 transition-all duration-500 ease-in-out px-4 sm:px-6 lg:px-8 ${selectedListingId && !isScrolledEnough ? "opacity-0 translate-y-10" : "opacity-100 translate-y-0"
                }`}
            >
              <div className="max-w-7xl mx-auto flex justify-center">
                <div
                  className="relative group pointer-events-auto transition-all duration-300 ease-in-out"
                  style={{
                    width: isSearchFocused ? '640px' : '280px',
                    maxWidth: "90vw"
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    placeholder="Ask about cars..."
                    className={`w-full px-4 py-3 transition-all duration-300 bg-background/95 backdrop-blur-md border border-border/60 rounded-[24px] shadow-[0_12px_45px_-20px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none overflow-y-auto overscroll-y-contain ${isSearchFocused ? "min-h-[3rem] text-base" : "min-h-[2.5rem] text-sm"
                      }`}
                    value={search}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      adjustHeight(e.target);
                    }}
                    onWheel={handleWheel}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        const query = search.trim();
                        if (!query || chatLoading) return;
                        setSearch("");
                        setIsSearchFocused(false);
                        await handleChat(query);
                      }
                    }}
                    disabled={chatLoading}
                    rows={1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Floating Compare CTA - appears when 2+ cars selected */}
          {hasSearched && selectedListings.length >= 2 && activeTab !== "Research Agents" && (
            <button
              onClick={() => {
                // Add selected listings to showroom/favorites if not already there
                setFavorites(prev => {
                  const newFavs = [...prev];
                  selectedListings.forEach(listing => {
                    if (!newFavs.find(f => f.id === listing.id)) {
                      newFavs.push(listing);
                    }
                  });
                  return newFavs;
                });
                setActiveTab("Research Agents");
                setCompareTriggerToken(prev => prev + 1);
              }}
              className="fixed top-16 sm:top-20 right-4 sm:right-6 lg:right-8 z-50 flex items-center gap-2 sm:gap-2.5 px-3 sm:px-5 py-2 sm:py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-105 transition-all duration-300 animate-in fade-in slide-in-from-right-4"
            >
              <ScanSearch className="w-4 h-4" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                Compare {selectedListings.length}
              </span>
            </button>
          )}

          {/* Floating Chat FAB - Mobile/Tablet only */}
          {!isSidebarVisible && hasSearched && (
            <button
              onClick={() => setIsSidebarVisible(true)}
              className="lg:hidden fixed bottom-24 right-6 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center animate-in fade-in zoom-in duration-300"
            >
              <MessageCircle className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <Dialog open={!!callDialog} onOpenChange={() => setCallDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Choose call mode</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={() => callDialog && executeCall(callDialog, true)} variant="outline">Test (my number)</Button>
            <Button onClick={() => callDialog && executeCall(callDialog, false)}>Call dealer ({callDialog?.phone})</Button>
          </div>
        </DialogContent>
      </Dialog>

      {LimitDialog}

      {/* Upgrade Modal for logged-in users who hit their limits */}
      <UpgradeLimitModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        feature={upgradeFeature}
        limit={upgradeLimit}
        resetTime={upgradeResetTime}
      />
    </div>
  );
}
