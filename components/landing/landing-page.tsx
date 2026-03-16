"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Search, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  Globe, 
  CheckCircle2, 
  MessageSquare,
  Terminal,
  Layers,
  Timer,
  Users,
  Phone,
  Car,
  Mountain,
  Fuel,
  MousePointer2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/layout/footer";
import { PublicHeader } from "@/components/layout/public-header";
import { ImageDissolveLite } from "./image-dissolve";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { useTypingPlaceholder } from "@/hooks/use-typing-placeholder";
import { SignInButton, SignUpButton, SignOutButton, useUser } from "@clerk/nextjs";
import { Settings, LogOut, MessageCircle, Compass } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePricing } from "@/components/pricing";
import { useSettings } from "@/components/settings";
import { useToast } from "@/hooks/use-toast";

interface LandingPageProps {
  search: string;
  setSearch: (val: string) => void;
  parseAndSearch: (query: string, skipHistoryUpdate?: boolean, isFromHomePage?: boolean) => Promise<boolean>;
  t: any;
  language: string;
  setLanguage: (lang: string) => void;
  isLangOpen: boolean;
  setIsLangOpen: (open: boolean) => void;
  languages: { code: string; name: string }[];
  onTabNavigate?: (tab: string) => void;
}

const PLACEHOLDER_PHRASES = [
  "Find reliable SUVs under $30,000...",
  "Compare 2024 Honda Civic vs Toyota Corolla...",
  "Search VIN: 1HGBH41JXMN109186...",
  "BMW X5 with low mileage near me...",
  "Electric cars with 300+ mile range...",
  "Best pickup trucks for towing...",
  "Certified pre-owned luxury sedans...",
  "Toyota RAV4 2020-2024 under 50k miles...",
  "Convertibles with heated seats and CarPlay...",
  "Hybrid family vans with high safety ratings..."
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1] as const // Custom ease for "buttery" feel
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleUp = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 1,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const STARTER_CATEGORIES = [
  {
    id: "commute",
    label: "Daily Commute",
    icon: <Car className="w-3 h-3" />,
    suggestions: [
      "Reliable hybrid sedan under $25k with heated seats",
      "2022+ Honda Civic or Mazda3 with low miles",
      "Fuel efficient hatchback for city driving near me",
      "Toyota Camry with Apple CarPlay and blind spot monitor"
    ]
  },
  {
    id: "family",
    label: "Family",
    icon: <Users className="w-3 h-3" />,
    suggestions: [
      "Safe SUV with 3rd row seating and captain's chairs",
      "Toyota Highlander with advanced safety package",
      "Minivan with rear entertainment and backup camera",
      "AWD crossover with spacious cargo for strollers"
    ]
  },
  {
    id: "electric",
    label: "Electric",
    icon: <Zap className="w-3 h-3" />,
    suggestions: [
      "Tesla Model Y Long Range with white interior",
      "EV with 300+ mile range and fast charging support",
      "Used Hyundai Ioniq 5 AWD under $40k",
      "Affordable electric car eligible for tax credits"
    ]
  },
  {
    id: "performance",
    label: "Performance",
    icon: <Sparkles className="w-3 h-3" />,
    suggestions: [
      "BMW M3 Competition or C63 AMG with service records",
      "Manual transmission sports car under $60k",
      "Porsche 911 coupe with clean title and no accidents",
      "V8 American muscle car with low mileage"
    ]
  },
  {
    id: "adventure",
    label: "Adventure",
    icon: <Mountain className="w-3 h-3" />,
    suggestions: [
      "Toyota Tacoma TRD Off-Road 4x4 with tow package",
      "Jeep Wrangler Rubicon Unlimited ready for trails",
      "Subaru Outback Wilderness with high ground clearance",
      "Reliable pickup truck with bed liner for work"
    ]
  }
];

const MOCKUP_TABS = [
  { id: 0, label: "Research Agent", icon: Search },
  { id: 1, label: "Market Scan", icon: Zap },
  { id: 2, label: "Direct Connect", icon: Phone },
  { id: 3, label: "Fleet Watch", icon: Globe },
];

function DynamicMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [callStatus, setCallStatus] = useState("Connecting...");
  const [cursorPos, setCursorPos] = useState({ x: "50%", y: "80%" });
  const [isClicking, setIsClicking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const typeSpeed = 50;
    const query = "Analyze price trends for 2023 911 GT3...";

    const clickAt = async (x: string, y: string, delay = 0) => {
      if (!mounted) return;
      setCursorPos({ x, y });
      await new Promise(r => setTimeout(r, 800 + delay)); // Move time
      setIsClicking(true);
      await new Promise(r => setTimeout(r, 150));
      setIsClicking(false);
      await new Promise(r => setTimeout(r, 150));
    };

    const runSequence = async () => {
      while (mounted) {
        // 1. Start with Results (Immediate Action)
        setActiveTab(0);
        setShowResults(true);
        setInputValue("Analyze price trends for 2023 911 GT3...");
        setCursorPos({ x: "50%", y: "80%" }); // Cursor at bottom
        await new Promise(r => setTimeout(r, 2500));

        // 2. Move to Market Scan
        await clickAt("28%", "6%");
        setActiveTab(1);
        await new Promise(r => setTimeout(r, 3000));

        // 3. Move to Direct Connect
        await clickAt("45%", "6%");
        setActiveTab(2);
        setCallStatus("Connecting...");
        await new Promise(r => setTimeout(r, 1000));
        setCallStatus("Negotiating...");
        await new Promise(r => setTimeout(r, 2000));

        // 4. Move to Home (Reset) to start search flow
        await clickAt("12%", "6%"); 
        setActiveTab(0);
        setShowResults(false); // Show Home View
        setInputValue("");
        await new Promise(r => setTimeout(r, 1000));

        // 5. Type query
        await clickAt("50%", "90%"); // Focus input
        for (let i = 0; i <= query.length; i++) {
          if (!mounted) return;
          setInputValue(query.slice(0, i));
          await new Promise(r => setTimeout(r, typeSpeed));
        }
        await new Promise(r => setTimeout(r, 400));

        // 6. Search
        await clickAt("92%", "90%"); // Click search
        // Loop back to 1 (Results)
      }
    };

    runSequence();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="relative bg-background/40 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] flex flex-col">
      {/* Browser Header */}
      <div className="h-10 sm:h-12 bg-black/5 border-b border-white/10 flex items-center px-4 sm:px-6 gap-4">
        <div className="flex gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-hidden flex-1 no-scrollbar">
          {MOCKUP_TABS.map((tab) => (
            <div 
              key={tab.id}
              className={`px-3 sm:px-4 py-1.5 rounded-t-lg text-[10px] font-medium flex items-center gap-2 transition-all duration-300 ${
                activeTab === tab.id 
                  ? "bg-background/60 border-t border-x border-white/10 text-foreground/90 shadow-sm min-w-[120px]" 
                  : "text-foreground/50 hover:bg-white/5"
              }`}
            >
              <tab.icon className={`w-3 h-3 ${activeTab === tab.id ? "text-primary" : ""}`} />
              <span className="truncate">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="w-3 h-3 rounded-full hover:bg-black/5 flex items-center justify-center ml-auto">×</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Browser Body */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex gap-4 sm:gap-6 lg:gap-10 relative overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-48 lg:w-64 border-r border-white/10 pr-4 lg:pr-8 space-y-6">
          <div className="space-y-3">
            <div className="h-2.5 w-16 bg-foreground/10 rounded animate-pulse" />
            <div className="h-8 w-full bg-foreground/5 rounded-lg border border-white/5" />
          </div>
          <div className="space-y-3">
            <div className="h-2.5 w-12 bg-foreground/10 rounded" />
            <div className="h-32 w-full bg-foreground/5 rounded-lg border border-white/5" />
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="flex-1 overflow-hidden relative">
            <motion.div
              key={`${activeTab}-${showResults}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {activeTab === 0 ? (
                showResults ? (
                  // Research View (Grid Results)
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 opacity-80 h-full overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="aspect-video bg-foreground/5 border border-white/10 rounded-xl p-3 space-y-3 relative overflow-hidden"
                      >
                        {/* Skeleton Card Content */}
                        <div className="w-full h-2/3 bg-foreground/5 rounded-lg" />
                        <div className="h-2 w-1/2 bg-foreground/10 rounded" />
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // Research View (Home State - Mimic Landing)
                  <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-80">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight text-foreground/90">Search for cars,<br/><span className="text-foreground/50 italic">effortlessly.</span></h3>
                    </div>
                    <div className="w-full max-w-[240px] h-8 rounded-full bg-foreground/5 border border-white/10 flex items-center px-3 gap-2">
                      <Search className="w-3 h-3 text-foreground/30" />
                      <div className="h-1.5 w-24 bg-foreground/10 rounded-full" />
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-1.5 w-12 bg-foreground/5 rounded-full" />
                      ))}
                    </div>
                  </div>
                )
              ) : activeTab === 1 ? (
                // Market Scan View (Live Matrix)
                <div className="h-full overflow-hidden p-1">
                  <div className="grid grid-cols-3 gap-3 h-full">
                    {/* Main Chart Area */}
                    <div className="col-span-2 bg-foreground/5 rounded-xl border border-white/5 p-4 flex flex-col gap-3 relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-24 bg-foreground/20 rounded" />
                        <div className="h-3 w-12 bg-green-500/20 rounded text-[9px] text-green-500 flex items-center justify-center font-bold">LIVE</div>
                      </div>
                      <div className="flex-1 flex items-end gap-1">
                        {[30, 50, 45, 70, 60, 85, 95, 65, 55, 80].map((h, i) => (
                          <motion.div 
                            key={i}
                            initial={{ height: "0%" }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                            className="flex-1 bg-foreground/10 rounded-t-sm hover:bg-primary/40 transition-colors"
                          />
                        ))}
                      </div>
                      {/* Scanning Line */}
                      <div className="absolute top-0 bottom-0 w-[1px] bg-primary/50 shadow-[0_0_10px_2px_rgba(255,255,255,0.3)] animate-[scan_2s_linear_infinite]" />
                    </div>
                    
                    {/* Side Feeds */}
                    <div className="flex flex-col gap-3">
                      {[1, 2, 3].map((i) => (
                        <motion.div 
                          key={i}
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex-1 bg-foreground/5 rounded-xl border border-white/5 p-3 flex flex-col justify-center gap-2"
                        >
                          <div className="flex justify-between">
                            <div className="h-2 w-8 bg-foreground/20 rounded" />
                            <div className="h-2 w-4 bg-foreground/10 rounded" />
                          </div>
                          <div className="h-1.5 w-full bg-foreground/10 rounded" />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeTab === 2 ? (
                // Direct Connect View (Dealer Call - Minimalist)
                <div className="h-full flex flex-col items-center justify-center p-6">
                  <div className="w-full max-w-md relative flex items-center justify-between px-8 sm:px-16">
                    {/* Agent Node */}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg relative">
                        <Sparkles className="w-5 h-5" />
                        <div className="absolute inset-0 rounded-full border border-foreground/30 animate-ping opacity-20" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">Vehique Agent</span>
                    </div>

                    {/* Connection Line */}
                    <div className="absolute left-0 right-0 top-6 h-px bg-foreground/10">
                      <motion.div 
                        animate={{ 
                          x: ["0%", "100%", "0%"],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-0.5 bg-foreground/50 rounded-full absolute top-0 left-1/4 blur-[1px]"
                      />
                    </div>

                    {/* Dealer Node */}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-foreground/5 border border-white/10 flex items-center justify-center text-foreground/60">
                        <div className="w-5 h-5 rounded-sm border-2 border-current opacity-50" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/60">Dealer Network</span>
                    </div>
                  </div>

                  <div className="mt-8 space-y-2 text-center">
                    <motion.div 
                      key={callStatus}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-white/5"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground"></span>
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground/80">{callStatus}</span>
                    </motion.div>
                  </div>
                </div>
              ) : (
                // Placeholder
                <div className="flex items-center justify-center h-full text-foreground/20 font-bold uppercase tracking-widest text-sm">
                  {MOCKUP_TABS[activeTab].label} View
                </div>
              )}
            </motion.div>
          </div>

          {/* Center Bottom Search Input */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] sm:w-[80%] max-w-lg pb-4 sm:pb-8">
            <div className="w-full h-10 sm:h-12 rounded-full bg-background/90 backdrop-blur-2xl border border-white/20 shadow-xl flex items-center px-4 gap-3 transition-transform duration-300 ring-1 ring-black/5 overflow-hidden">
               {/* Left Icon - Switches based on active tab */}
               <motion.div
                 key={activeTab}
                 initial={{ scale: 0.5, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ duration: 0.3 }}
               >
                 {activeTab === 0 ? <Search className="w-4 h-4 text-primary" /> :
                  activeTab === 1 ? <Zap className="w-4 h-4 text-primary" /> :
                  activeTab === 2 ? <Phone className="w-4 h-4 text-primary" /> :
                  <Globe className="w-4 h-4 text-primary" />}
               </motion.div>
               
               {/* Animated Input Text */}
               <div className="flex-1 text-xs sm:text-sm text-foreground/90 font-light truncate relative h-full flex items-center">
                 {inputValue}
                 {/* Blinking Cursor */}
                 <motion.div 
                   animate={{ opacity: [1, 0] }}
                   transition={{ duration: 0.8, repeat: Infinity }}
                   className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
                 />
                 {inputValue.length === 0 && (
                   <span className="absolute left-0 text-muted-foreground/50">Ask a follow-up question...</span>
                 )}
               </div>

               <div className="ml-auto flex items-center gap-2">
                  <motion.div 
                    animate={{ scale: inputValue.length > 0 ? 1.1 : 1 }}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
                      inputValue.length > 0 ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground"
                    }`}
                  >
                     <ArrowRight className="w-3 h-3" />
                  </motion.div>
               </div>
            </div>
          </div>

          {/* Simulated Cursor */}
          <motion.div 
            className="absolute z-50 pointer-events-none drop-shadow-xl"
            animate={{ 
              left: cursorPos.x, 
              top: cursorPos.y,
              scale: isClicking ? 0.9 : 1
            }}
            transition={{ 
              duration: isClicking ? 0.1 : 0.8, 
              ease: "easeInOut" 
            }}
          >
            <MousePointer2 className="w-5 h-5 text-foreground fill-foreground" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage({ 
  search, 
  setSearch, 
  parseAndSearch, 
  t, 
  language, 
  setLanguage, 
  isLangOpen, 
  setIsLangOpen, 
  languages,
  onTabNavigate 
}: LandingPageProps) {
  const { isSignedIn, user } = useUser();
  const { openPricing } = usePricing();
  const { openSettings } = useSettings();
  const { toast } = useToast();
  const [showBottomSearch, setShowBottomSearch] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const heroSearchRef = useRef<HTMLDivElement>(null);
  const heroTextareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomTextareaRef = useRef<HTMLTextAreaElement>(null);
  const typingPlaceholder = useTypingPlaceholder(PLACEHOLDER_PHRASES);
  
  const adjustHeight = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 20 * 24; // approx 20 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  const handleTextareaScroll = (e: React.KeyboardEvent<HTMLTextAreaElement> | React.UIEvent<HTMLTextAreaElement>) => {
    // We only care about scroll/wheel events, but React's onScroll is generic UIEvent.
    // However, native 'wheel' event is what triggers page scroll.
    // React's onScroll fires AFTER scroll. We need onWheel to prevent default.
    // So we'll attach onWheel directly or use a ref. 
    // Actually, simply adding onWheel prop to textarea works in React.
  };

  // Prevent page scroll when scrolling inside textarea, even if not overflowing
  const handleWheel = (e: React.WheelEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    // We want to stop the event from bubbling to the window
    e.stopPropagation();
    
    // However, stopPropagation alone doesn't prevent browser's default scroll chaining behavior in all cases.
    // If the element is at the scroll boundary, browsers often scroll the parent.
    // We can prevent default to stop parent scrolling, but we must allow scrolling the element itself if possible.
    
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isScrollable = scrollHeight > clientHeight;
    
    if (!isScrollable) {
      // If not scrollable (e.g. short text), strict isolation means we prevent page scroll
      e.preventDefault();
      return;
    }

    const isAtTop = scrollTop <= 0;
    // Allow 1px buffer for rounding errors
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 1;

    if (isAtTop && e.deltaY < 0) {
      // Trying to scroll up while at top
      e.preventDefault();
    } else if (isAtBottom && e.deltaY > 0) {
      // Trying to scroll down while at bottom
      e.preventDefault();
    }
    // Otherwise, let the native scroll happen (it will scroll the textarea)
  };

  useEffect(() => {
    adjustHeight(heroTextareaRef.current);
    adjustHeight(bottomTextareaRef.current);
  }, [search]);
  
  // Parallax hooks
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 300]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  
  // Interface Mockup Animation
  const mockupRef = useRef(null);
  const isMockupInView = useInView(mockupRef, { margin: "-20% 0px -20% 0px", once: true });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowBottomSearch(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    if (heroSearchRef.current) {
      observer.observe(heroSearchRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.category-dropdown-trigger')) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-google-sans-flex selection:bg-foreground selection:text-background overflow-x-hidden">
      {/* Modern Header */}
      <PublicHeader onTabNavigate={onTabNavigate} />

      <main>
        {/* ===== HERO SECTION - Full Bleed with Organic Dissolve ===== */}
        <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 sm:pt-48 overflow-hidden">
          {/* Hero Background Image with Advanced Dissolve */}
          <motion.div 
            className="absolute inset-0 z-0"
            style={{ y: heroY, opacity: heroOpacity }}
          >
            <ImageDissolveLite
              src="/Pure Coastal Scene.png"
              alt="Pure coastal scene"
              className="absolute inset-0 w-full h-full"
              dissolveHeight={50}
              variant="cool"
              objectPosition="center 65%"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />
          </motion.div>

          {/* Hero Content */}
          <div className="relative z-20 w-full max-w-[1600px] mx-auto text-center px-4 sm:px-6 pb-20 sm:pb-32">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="space-y-8 sm:space-y-12 lg:space-y-16"
            >
              <motion.div variants={fadeInUp} className="space-y-6 max-w-4xl mx-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.1] drop-shadow-lg">
                  {t.heroTitle} <br/> 
                  <span className="text-foreground/60 italic">{t.heroEffortless}</span>
                </h1>
              </motion.div>

              {/* Hero Search Box */}
              <motion.div ref={heroSearchRef} variants={fadeInUp} className="max-w-3xl mx-auto w-full">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-background/60 backdrop-blur-xl rounded-[28px]" />
                  <div className="relative flex items-center bg-background/90 backdrop-blur-sm border border-border/60 rounded-[24px] shadow-[0_12px_45px_-25px_rgba(0,0,0,0.2)] focus-within:ring-1 focus-within:ring-foreground/5 transition-all">
                    <Search className="absolute left-4 sm:left-6 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground/40 group-focus-within:text-foreground transition-colors z-10" />
                    <textarea
                      ref={heroTextareaRef}
                      placeholder={typingPlaceholder}
                      className="w-full pl-11 sm:pl-16 pr-4 sm:pr-6 min-h-[2.75rem] lg:min-h-[3.25rem] py-2.5 sm:py-3 bg-transparent text-sm sm:text-base placeholder:text-muted-foreground/50 resize-none overflow-y-auto overscroll-y-contain focus:outline-none"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        adjustHeight(e.target);
                      }}
                      onWheel={handleWheel}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const success = await parseAndSearch(search, false, true);
                          if (!success) {
                            // Keep search input if rate limit is hit
                            return;
                          }
                          setSearch("");
                        }
                      }}
                      autoFocus
                      rows={1}
                    />
                  </div>
                </div>

                {/* Starter Categories */}
                <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3 relative z-20">
                  {STARTER_CATEGORIES.map((cat, i) => (
                    <div key={cat.id} className="relative category-dropdown-trigger">
                      <motion.button
                        variants={fadeInUp}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(activeCategory === cat.id ? null : cat.id);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                          activeCategory === cat.id 
                            ? "bg-foreground text-background border-foreground scale-105 shadow-lg" 
                            : "bg-background/40 backdrop-blur-sm border-foreground/10 text-foreground/70 hover:bg-background/60 hover:text-foreground hover:border-foreground/30"
                        }`}
                      >
                        {cat.icon}
                        {cat.label}
                      </motion.button>
                      
                      {activeCategory === cat.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                          exit={{ opacity: 0, y: 10, scale: 0.95, x: "-50%" }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full mt-3 left-1/2 w-80 sm:w-96 bg-background/80 backdrop-blur-xl border-2 border-foreground/25 rounded-2xl shadow-2xl overflow-hidden p-2 z-50 ring-2 ring-foreground/10 origin-top"
                        >
                          <div className="flex flex-col gap-1">
                            {cat.suggestions.map((s, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSearch(s);
                                  setActiveCategory(null);
                                }}
                                className="w-full text-left px-4 py-3 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-xl transition-all duration-200 truncate flex items-center gap-3 group"
                              >
                                <Search className="w-3.5 h-3.5 text-foreground/30 group-hover:text-foreground/50 transition-colors shrink-0" />
                                <span className="truncate">{s}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-background z-20" />
        </section>

        {/* ===== TRANSITION SECTION: CLARITY STRIP (About target) ===== */}
        <section id="about" className="relative py-24 sm:py-32 bg-background flex flex-col items-center justify-center overflow-hidden">
            {/* Subtle background texture */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} 
            />
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Market Intelligence
              </motion.div>
              
              <motion.h3 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-foreground/90 leading-tight">
                Data from <span className="font-serif italic text-primary">everywhere</span>.<br />
                Clarity in <span className="font-serif italic text-primary">one place</span>.
              </motion.h3>
              
              <motion.p variants={fadeInUp} className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
                We bridge the gap between global dealer networks and your personal search experience, filtering millions of data points into a single, cohesive view.
              </motion.p>
            </motion.div>
        </section>

        {/* Interface Mockup Section */}
        <section ref={mockupRef} className="relative py-20 sm:py-32 lg:py-40 px-4 sm:px-6 overflow-hidden flex items-center justify-center min-h-[90vh]">
          {/* Background Image */}
          <motion.div 
            className="absolute inset-0 z-0"
            style={{ 
              opacity: useTransform(useScroll({ target: mockupRef, offset: ["start end", "end start"] }).scrollYProgress, [0, 0.5, 1], [0.3, 1, 0.3]),
              y: useTransform(useScroll({ target: mockupRef, offset: ["start end", "end start"] }).scrollYProgress, [0, 1], [-50, 50])
            }}
          >
            <ImageDissolveLite
              src="/aesthetic/Figures in a Wild Meadow.png"
              alt="Interface Background"
              className="w-full h-full"
              variant="earth"
              dissolveHeight={30}
              objectPosition="center 40%"
            />
            {/* Top Gradient Fade to blend with previous section */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-10" />
            {/* Bottom Gradient Fade for smooth exit */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
          </motion.div>
          
          <div className="relative z-10 w-full max-w-[1200px] mx-auto space-y-10 sm:space-y-16">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center space-y-4 sm:space-y-6"
            >
              <motion.h2 variants={fadeInUp} className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground drop-shadow-sm">{t.modernInterface}</motion.h2>
              <motion.p variants={fadeInUp} className="text-foreground/80 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-medium drop-shadow-sm">{t.modernDesc}</motion.p>
            </motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              whileInView={{ scale: 1, y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] as const }}
              className="relative group"
            >
              <div className="absolute -inset-4 bg-gradient-to-b from-primary/20 to-transparent rounded-[40px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
              <DynamicMockup />
            </motion.div>
          </div>
        </section>

        {/* ===== TRUST & SCALE SECTION ===== */}
        <section className="relative py-24 sm:py-32 bg-background border-b border-border/5">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Context / Headline */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-8 text-center lg:text-left"
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live System Status
                </motion.div>
                <motion.h3 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  Operating at <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">industrial scale.</span>
                </motion.h3>
                <motion.p variants={fadeInUp} className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Our infrastructure processes millions of data points daily, ensuring you never miss a listing, price drop, or market anomaly.
                </motion.p>
              </motion.div>

              {/* Stats Grid */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="grid grid-cols-2 gap-x-8 gap-y-12 sm:gap-x-12 sm:gap-y-16"
              >
                {[
                  { label: t.statsListings, value: "2M+", suffix: "Active", icon: <Layers className="w-4 h-4 text-primary" /> },
                  { label: t.statsDealers, value: "80,000+", suffix: "Partners", icon: <ShieldCheck className="w-4 h-4 text-primary" /> },
                  { label: t.statsScans, value: "24.5M", suffix: "Daily", icon: <Zap className="w-4 h-4 text-primary" /> },
                ].map((stat, i) => (
                  <motion.div key={i} variants={fadeInUp} className="space-y-2 group">
                    <div className="flex items-center gap-2 mb-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      {stat.icon}
                      <span className="text-[10px] font-bold uppercase tracking-widest">{stat.suffix}</span>
                    </div>
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tighter tabular-nums group-hover:scale-105 transition-transform origin-left duration-300">
                      {stat.value}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground/60">{stat.label}</p>
                  </motion.div>
                ))}
              </motion.div>

            </div>
          </div>
        </section>

        {/* ===== FEATURE SECTIONS: BENTO GRID ===== */}
        <section id="features" className="py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-foreground/[0.02] border-b border-border/5">
          <div className="max-w-[1100px] mx-auto space-y-16 sm:space-y-20">
            
            {/* Header */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto text-center space-y-6"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background border border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                Features
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                {t.agentFlowTitle}
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground text-lg leading-relaxed font-medium max-w-2xl mx-auto">
                {t.agentFlowDesc}
              </motion.p>
            </motion.div>
            
            {/* Bento Grid */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6"
            >
              
              {/* Card 1: Scanning (Large - 6 cols) */}
              <motion.div variants={fadeInUp} className="md:col-span-6 group relative overflow-hidden rounded-[24px] bg-background border border-border/10 p-6 sm:p-8 flex flex-col justify-between h-[360px] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-2">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">{t.scanningTitle}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed max-w-sm text-sm">{t.scanningDesc}</p>
                </div>
                
                {/* Visual: Source List */}
                <div className="mt-8 space-y-2.5 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="h-9 w-full bg-foreground/[0.03] rounded-lg flex items-center px-3 gap-3 border border-border/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <div className="h-1.5 w-24 bg-foreground/10 rounded-full" />
                    <div className="ml-auto text-[9px] font-mono text-muted-foreground">Just now</div>
                  </div>
                  <div className="h-9 w-full bg-foreground/[0.03] rounded-lg flex items-center px-3 gap-3 border border-border/5 ml-4 sm:ml-6">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-150" />
                    <div className="h-1.5 w-32 bg-foreground/10 rounded-full" />
                    <div className="ml-auto text-[9px] font-mono text-muted-foreground">2s ago</div>
                  </div>
                  <div className="h-9 w-full bg-foreground/[0.03] rounded-lg flex items-center px-3 gap-3 border border-border/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse delay-300" />
                    <div className="h-1.5 w-20 bg-foreground/10 rounded-full" />
                    <div className="ml-auto text-[9px] font-mono text-muted-foreground">5s ago</div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Verification (Large - 6 cols) */}
              <motion.div variants={fadeInUp} className="md:col-span-6 group relative overflow-hidden rounded-[24px] bg-background border border-border/10 p-6 sm:p-8 flex flex-col justify-between h-[360px] hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                <div className="relative z-10 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold">{t.vinTitle}</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed max-w-sm text-sm">{t.vinDesc}</p>
                </div>
                
                {/* Visual: Verification Badges */}
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {["Clean Title", "No Accidents", "Single Owner", "Service Records"].map((badge, i) => (
                     <div key={i} className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-500 ${
                        i < 2 ? "bg-primary/5 border-primary/20 text-primary group-hover:bg-primary/10" : "bg-foreground/[0.02] border-border/10 text-muted-foreground"
                     }`}>
                        <CheckCircle2 className="w-3 h-3" /> {badge}
                     </div>
                  ))}
                </div>
              </motion.div>

              {/* Card 3: Deal (Medium - 4 cols) */}
              <motion.div variants={fadeInUp} className="md:col-span-6 lg:col-span-4 group relative overflow-hidden rounded-[24px] bg-background border border-border/10 p-6 flex flex-col justify-between h-[280px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                 <div className="relative z-10 space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold">{t.dealTitle}</h3>
                    <p className="text-muted-foreground text-xs font-medium leading-relaxed">{t.dealDesc}</p>
                 </div>
                 <div className="mt-4 p-3 bg-foreground/[0.02] rounded-xl border border-border/5 group-hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground">Market Avg</span>
                      <span className="text-[10px] font-bold text-muted-foreground line-through">$45,000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] uppercase font-bold text-primary">Negotiated</span>
                      <span className="text-sm font-bold text-foreground">$41,500</span>
                    </div>
                 </div>
              </motion.div>

              {/* Card 4: 24/7 (Medium - 4 cols) */}
              <motion.div variants={fadeInUp} className="md:col-span-6 lg:col-span-4 group relative overflow-hidden rounded-[24px] bg-background border border-border/10 p-6 flex flex-col justify-between h-[280px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                 <div className="relative z-10 space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <Zap className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold">Always On</h3>
                    <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                      Our agents monitor the market 24/7, catching price drops and new inventory the moment they happen.
                    </p>
                 </div>
                 <div className="mt-4 flex gap-1 items-end h-12 opacity-60 group-hover:opacity-100 transition-opacity">
                    {[40, 70, 45, 90, 60, 80, 50, 95, 60, 70].map((h, i) => (
                       <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-primary/20 rounded-t-[1px]" />
                    ))}
                 </div>
              </motion.div>

              {/* Card 5: Connect (Medium - 4 cols) */}
              <motion.div variants={fadeInUp} className="md:col-span-6 lg:col-span-4 group relative overflow-hidden rounded-[24px] bg-background border border-border/10 p-6 flex flex-col justify-between h-[280px] hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
                 <div className="relative z-10 space-y-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                      <Phone className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold">Direct Connect</h3>
                    <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                      Seamlessly transition from AI chat to a live call with the dealer when you're ready to buy.
                    </p>
                 </div>
                 <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
                       <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 h-px bg-border/20 relative">
                       <div className="absolute inset-0 bg-primary/50 w-1/2 animate-[shimmer_2s_infinite]" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                       <Phone className="w-4 h-4 text-primary" />
                    </div>
                 </div>
              </motion.div>

            </motion.div>
          </div>
        </section>

        {/* ===== CLASSIC PORSCHE SCENE - Live Status ===== */}
        <section className="relative min-h-screen flex items-center overflow-hidden py-40 lg:py-48">
          {/* Background Image with Advanced Dissolve */}
          <motion.div 
            className="absolute inset-0 z-0"
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <ImageDissolveLite
              src="/aesthetic/Sleek Race Car in Fog.png"
              alt="Sleek race car in fog"
              className="w-full h-full"
              variant="moody"
              dissolveHeight={40}
            />
            {/* Top Gradient Fade */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-background via-background/80 to-transparent" />
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />
          </motion.div>

          {/* Content */}
          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Text Side */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-8 sm:space-y-10 order-2 md:order-1"
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 backdrop-blur-md border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-sm">
                  Live Status
                </motion.div>
                <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground drop-shadow-sm">
                  {t.liveStatusTitle}
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-foreground/80 text-lg sm:text-xl leading-relaxed font-medium max-w-lg drop-shadow-sm">
                  {t.liveStatusDesc}
                </motion.p>
                <motion.button variants={fadeInUp} className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 group text-foreground/70 hover:text-foreground transition-colors bg-background/30 backdrop-blur-sm px-4 py-3 rounded-full w-fit border border-transparent hover:border-border/20">
                  {t.exploreNetwork} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>

              {/* Card Side - Glassmorphism Browser Style */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={fadeInUp}
                className="relative order-1 md:order-2 group"
              >
                <div className="absolute -inset-1 bg-gradient-to-b from-foreground/5 to-transparent rounded-[34px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                
                <div className="relative bg-background/60 backdrop-blur-xl border border-white/20 rounded-[32px] overflow-hidden shadow-2xl flex flex-col aspect-[4/5] sm:aspect-[4/4.5] max-w-md mx-auto md:ml-auto">
                   {/* Browser Header */}
                   <div className="h-12 bg-black/5 border-b border-white/10 flex items-center px-6 gap-4">
                     <div className="flex gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                       <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                       <div className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
                     </div>
                     <div className="flex-1 text-center">
                        <div className="inline-block px-3 py-1 rounded-md bg-white/10 text-[9px] font-mono text-muted-foreground tracking-wide">
                          feed.live
                        </div>
                     </div>
                     <div className="w-8" /> {/* Spacer for centering */}
                   </div>

                   {/* Browser Content - Feed */}
                   <div className="flex-1 p-6 space-y-4 overflow-hidden relative">
                     {/* Floating "Live" Badge */}
                     <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground text-background text-[9px] font-bold uppercase tracking-wider shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                     </div>

                     {/* List Items */}
                     <div className="space-y-3">
                        {[
                          { title: "2023 Porsche 911 GT3", loc: "Beverly Hills, CA", time: "Just now" },
                          { title: "2022 Mercedes-AMG GT", loc: "Miami, FL", time: "2m ago" },
                          { title: "2024 BMW M4 CSL", loc: "Austin, TX", time: "5m ago" },
                          { title: "2021 Audi R8 V10", loc: "Seattle, WA", time: "12m ago" }
                        ].map((item, i) => (
                          <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15 + 0.5, duration: 0.5 }}
                            className={`p-4 rounded-2xl border border-white/10 transition-all duration-500 ${
                            i === 0 
                              ? "bg-foreground/[0.04] shadow-sm scale-100 opacity-100" 
                              : "bg-transparent scale-[0.98] opacity-60"
                          }`}>
                             <div className="flex justify-between items-start mb-2">
                               <div className="h-2.5 w-32 bg-foreground/20 rounded-full" />
                               <span className="text-[9px] font-mono text-muted-foreground">{item.time}</span>
                             </div>
                             <div className="h-2 w-20 bg-foreground/10 rounded-full mb-3" />
                             <div className="flex items-center gap-2">
                                <div className="px-2 py-0.5 rounded-full bg-foreground/5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Verified</div>
                                <div className="px-2 py-0.5 rounded-full bg-foreground/5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Dealer</div>
                             </div>
                          </motion.div>
                        ))}
                     </div>
                     
                     {/* Fade at bottom of list */}
                     <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                   </div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>


        {/* ===== GLOBAL REACH SECTION ===== */}
        <section className="relative py-24 sm:py-32 bg-background border-b border-border/5">
           <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
             <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
               
               {/* Left: Interactive Globe/Map Visual Placeholder */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.8 }}
                 className="relative aspect-square sm:aspect-[4/3] bg-foreground/[0.02] rounded-[32px] border border-border/10 overflow-hidden group"
               >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
                  
                  {/* Grid Map Effect */}
                  <div className="absolute inset-0 opacity-[0.1]" 
                       style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                  />
                  
                  {/* Floating Location Dots */}
                  {[
                    { top: '30%', left: '20%', delay: '0s' },
                    { top: '45%', left: '50%', delay: '1s' },
                    { top: '60%', left: '75%', delay: '2s' },
                    { top: '35%', left: '80%', delay: '1.5s' },
                    { top: '65%', left: '30%', delay: '0.5s' }
                  ].map((dot, i) => (
                    <div key={i} className="absolute w-3 h-3" style={{ top: dot.top, left: dot.left }}>
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" style={{ animationDelay: dot.delay, animationDuration: '3s' }} />
                      <div className="relative w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    </div>
                  ))}
               </motion.div>

               {/* Right: Content */}
               <motion.div 
                 initial="hidden"
                 whileInView="visible"
                 viewport={{ once: true }}
                 variants={staggerContainer}
                 className="space-y-8 sm:space-y-10"
               >
                 <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                   Global Reach
                 </motion.div>
                 <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                   Every market.<br />Every listing.<br /><span className="text-muted-foreground italic">One search.</span>
                 </motion.h2>
                 <motion.p variants={fadeInUp} className="text-muted-foreground text-lg sm:text-xl leading-relaxed font-medium max-w-xl">
                   From Stuttgart to San Francisco, our agents scan dealer networks across continents. Find that rare spec wherever it exists.
                 </motion.p>
                 <motion.div variants={fadeInUp} className="flex flex-wrap gap-3 pt-2">
                   {["North America", "Europe", "Asia Pacific"].map((region) => (
                     <span key={region} className="px-4 py-2 bg-foreground/[0.03] border border-border/10 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-default">
                       {region}
                     </span>
                   ))}
                 </motion.div>
               </motion.div>

             </div>
           </div>
        </section>

        {/* ===== AUTONOMOUS & INTELLIGENCE SECTION ===== */}
        <section className="py-24 sm:py-32 bg-background">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
            
            {/* 1. Delegate / Autonomous Section */}
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Visual: Agent Execution Log */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative group md:order-first"
              >
                {/* Decorative glow */}
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/10 to-transparent rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative bg-background border border-border/10 rounded-[24px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-500 aspect-[4/3] flex flex-col">
                  {/* Card Header */}
                  <div className="h-12 border-b border-border/10 flex items-center px-6 justify-between bg-foreground/[0.02]">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-primary/40" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agent Log</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                    </div>
                  </div>
                  
                  {/* Log Content */}
                  <div className="flex-1 p-6 sm:p-8 font-mono text-[11px] sm:text-xs space-y-6 overflow-hidden">
                    {/* Command */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground/60 text-[10px] uppercase tracking-wider">
                        <Terminal className="w-3 h-3" /> Input
                      </div>
                      <div className="p-3 bg-foreground/[0.03] rounded-lg border border-border/5 text-foreground/80">
                        "Verify availability for 2021 Lucid Air & negotiate."
                      </div>
                    </div>
                    
                    {/* Execution Steps */}
                    <div className="space-y-3 pl-3 border-l border-border/10">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                         <span className="text-muted-foreground">Dialing dealer... <span className="text-muted-foreground/40">(312) 555-0192</span></span>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                         <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                         <span className="text-muted-foreground">Connected to Sales Dept.</span>
                      </div>
                      <div className="flex items-center gap-3 opacity-60">
                         <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                         <span className="text-muted-foreground">Negotiating price...</span>
                      </div>
                    </div>

                    {/* Result */}
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex gap-3 items-start">
                       <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                       <div className="space-y-1">
                          <div className="font-bold text-primary">Success</div>
                          <div className="text-muted-foreground leading-relaxed">Dealer confirmed availability. Price reduced to $78,500.</div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-8 sm:space-y-10"
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Autonomous
                </motion.div>
                <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                  {t.delegateTitle}
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground text-lg sm:text-xl leading-relaxed font-medium">
                  {t.delegateDesc}
                </motion.p>
                <motion.div variants={fadeInUp} className="pl-4 border-l-2 border-primary/20 italic text-muted-foreground text-sm sm:text-base">
                  "Verify if the silver Porsche is still on the lot and ask about the service history."
                </motion.div>
              </motion.div>
            </div>

            {/* 2. Market Alpha Section */}
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
              
              {/* Content */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
                className="space-y-8 sm:space-y-10"
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Market Alpha
                </motion.div>
                <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-foreground">
                  {t.alphaTitle}
                </motion.h2>
                <motion.p variants={fadeInUp} className="text-muted-foreground text-lg sm:text-xl leading-relaxed font-medium">
                  {t.alphaDesc}
                </motion.p>
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                  <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-full text-xs font-bold text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Currently limited by API limits to once a day
                  </div>
                </motion.div>
              </motion.div>

              {/* Visual: Price Prediction Chart */}
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-br from-primary/5 to-transparent rounded-[32px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative bg-background border border-border/10 rounded-[24px] overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-500 aspect-[4/3] flex flex-col p-6 sm:p-10 justify-between">
                  {/* Chart Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Est. Value</div>
                      <div className="text-3xl sm:text-4xl font-bold tracking-tighter text-foreground">$42,500</div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="px-2 py-1 bg-primary/5 rounded-md text-[10px] font-bold text-primary uppercase inline-block">Falling</div>
                    </div>
                  </div>

                  {/* Chart Visual - Minimal Line/Bar Hybrid */}
                  <div className="h-40 w-full flex items-end gap-2 relative">
                    {/* Trend Line (simulated with CSS clip-path or simple SVG) */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                       <path 
                         d="M0,80 C30,70 60,90 90,60 C120,30 150,50 180,40 C210,30 240,80 270,90 C300,100 330,120 360,130" 
                         fill="none" 
                         stroke="currentColor" 
                         strokeWidth="2" 
                         className="text-primary/20"
                         vectorEffect="non-scaling-stroke"
                       />
                       <path 
                         d="M270,90 C300,100 330,120 360,130" 
                         fill="none" 
                         stroke="currentColor" 
                         strokeWidth="2" 
                         strokeDasharray="4 4"
                         className="text-primary"
                         vectorEffect="non-scaling-stroke"
                       />
                       <circle cx="270" cy="90" r="4" className="fill-background stroke-primary stroke-2" />
                    </svg>
                    
                    {/* Bars overlay */}
                    {[45, 65, 50, 80, 70, 45, 35].map((h, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`flex-1 rounded-t-sm transition-all duration-500 ${
                        i === 6 ? "bg-primary/20" : "bg-foreground/[0.03] group-hover:bg-foreground/[0.05]"
                      }`} />
                    ))}
                  </div>

                  {/* Insight Footer */}
                  <div className="pt-4 border-t border-border/5">
                    <div className="flex gap-2 items-start">
                       <div className="mt-1 w-3 h-3 rounded-full bg-foreground/[0.05] flex items-center justify-center flex-shrink-0">
                          <div className="w-1 h-1 rounded-full bg-foreground/40" />
                       </div>
                       <p className="text-xs text-muted-foreground leading-relaxed italic">
                         "Prediction: 85% probability of a $1,500 drop within 72h."
                       </p>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </section>

        {/* ===== COMMUNITY SECTION: SURREAL SUNSET ===== */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden py-32 sm:py-48">
          {/* Background Image with Advanced Dissolve */}
          <motion.div 
            className="absolute inset-0 z-0"
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            viewport={{ once: true }}
          >
            <ImageDissolveLite
              src="/aesthetic/Surreal Cityscape Sunset Photo.png"
              alt="Surreal cityscape sunset"
              className="w-full h-full"
              variant="warm"
              dissolveHeight={40}
            />
            {/* Top Gradient Fade */}
            <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-background via-background/80 to-transparent" />
            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />
            {/* Overlay for text readability */}
            <div className="absolute inset-0 bg-background/10 backdrop-blur-[1px]" />
          </motion.div>

          {/* Content - Right aligned */}
          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-8 w-full">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-xl ml-auto text-right space-y-8 sm:space-y-12"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-emerald-200/30 text-[10px] font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 ml-auto">
                Community
              </motion.div>
              <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                <span className="text-foreground/50 italic">Not just a search.</span><br />A journey shared.
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-foreground/70 text-base sm:text-lg leading-relaxed font-medium">
                We're just getting started. Join our community as we grow—share insights, celebrate finds, and help each other navigate the market.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ===== VELOCITY / CHANGELOG SECTION ===== */}
        <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
          <div className="max-w-[1000px] mx-auto relative">
            {/* Ambient Glow for Glass Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 rounded-[60px] blur-3xl opacity-60" />
            
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative bg-background/20 backdrop-blur-xl border border-white/10 rounded-[48px] overflow-hidden shadow-2xl shadow-black/5"
            >
              <div className="relative z-10 px-6 sm:px-10 py-12 sm:py-16 flex flex-col items-center text-center space-y-8">
                
                {/* Header */}
                <div className="space-y-3 max-w-xl mx-auto">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.1] drop-shadow-sm">
                    High-velocity development.
                  </h2>
                  <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed font-medium max-w-sm mx-auto">
                    Our agents get smarter every week. Follow our changelog.
                  </p>
                </div>

                {/* Updates Cards - Minimal Glass Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                  {[
                    { date: "Dec 18", title: "Fleet Integration", tag: "Enterprise" },
                    { date: "Dec 10", title: "Research Mode", tag: "Intelligence" },
                    { date: "Nov 21", title: "Real-time Scan", tag: "Speed" }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/5 border border-white/10 text-foreground rounded-3xl p-6 text-left shadow-sm hover:shadow-md hover:bg-white/10 transition-all duration-300 group cursor-default"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{item.date}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <h3 className="text-base font-bold mb-1">{item.title}</h3>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary/80">{item.tag}</span>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="pt-2">
                  <button className="h-11 px-8 rounded-full bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 shadow-xl">
                    View Full History <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Floating Bottom Search */}
      {showBottomSearch && (
        <div className="fixed bottom-4 sm:bottom-6 lg:bottom-10 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative group pointer-events-auto w-full sm:w-auto min-w-[min(100%,22rem)] sm:min-w-[26rem] max-w-[40rem]">
            <Search className="absolute left-4 top-3.5 w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground/80 group-focus-within:text-primary transition-colors" />
            <textarea
              ref={bottomTextareaRef}
              placeholder={t.placeholder}
              className="w-full pl-11 sm:pl-12 pr-4 sm:pr-6 min-h-[3rem] py-3 bg-background border-2 border-border rounded-[24px] shadow-[0_12px_45px_-25px_rgba(0,0,0,0.08)] ring-2 ring-foreground/5 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 text-sm sm:text-base resize-none overflow-y-auto overscroll-y-contain placeholder:whitespace-nowrap"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                adjustHeight(e.target);
              }}
              onWheel={handleWheel}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const success = await parseAndSearch(search, false, true);
                  if (success) {
                    setSearch("");
                  }
                }
              }}
              rows={1}
            />
          </div>
        </div>
      )}

      <Footer 
        language={language} 
        setLanguage={setLanguage} 
        isLangOpen={isLangOpen} 
        setIsLangOpen={setIsLangOpen} 
        languages={languages} 
        t={t}
      />
    </div>
  );
}
