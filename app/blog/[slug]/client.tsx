"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Calendar, ArrowLeft, Link2, Check, ChevronRight, ArrowUp, Play, Pause } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";
import { BlogPost } from "@/lib/blog/posts";

// Auto-scroll speed levels (pixels per frame at 60fps)
// Lower pixelsPerFrame = slower scroll for dense reading
const SPEED_LEVELS = [
  { level: 1,   label: "1×",   pixelsPerFrame: 0.12 },   // ~7 px/sec - very slow, deep reading
  { level: 1.5, label: "1.5×", pixelsPerFrame: 0.18 },   // ~11 px/sec
  { level: 2,   label: "2×",   pixelsPerFrame: 0.25 },   // ~15 px/sec - slow, careful reading
  { level: 2.5, label: "2.5×", pixelsPerFrame: 0.32 },   // ~19 px/sec
  { level: 3,   label: "3×",   pixelsPerFrame: 0.4 },    // ~24 px/sec - comfortable pace
  { level: 3.5, label: "3.5×", pixelsPerFrame: 0.55 },   // ~33 px/sec
  { level: 4,   label: "4×",   pixelsPerFrame: 0.7 },    // ~42 px/sec - quick scanning
  { level: 4.5, label: "4.5×", pixelsPerFrame: 0.95 },   // ~57 px/sec
  { level: 5,   label: "5×",   pixelsPerFrame: 1.2 },    // ~72 px/sec - speed reading
] as const;

const DEFAULT_SPEED_INDEX = 3; // Start at 2.5× (index 3)

interface BlogPostClientProps {
  post: BlogPost;
}

// Helper to create URL-friendly slugs from section titles
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Parse content into structured sections
interface Section {
  id: string;
  title: string;
  content: string[];
}

function parseContent(content: string): { intro: string[]; sections: Section[] } {
  const lines = content.split("\n");
  const intro: string[] = [];
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let isInIntro = true;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      isInIntro = false;
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = line.replace("## ", "").trim();
      currentSection = {
        id: createSlug(title),
        title,
        content: [],
      };
    } else if (isInIntro) {
      if (line.trim()) {
        intro.push(line);
      }
    } else if (currentSection) {
      if (line.trim()) {
        currentSection.content.push(line);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { intro, sections };
}

// Get all section titles for TOC (excluding "What This Post Covers")
function getTocSections(sections: Section[]): Section[] {
  return sections.filter((s) => s.title !== "What This Post Covers");
}

export function BlogPostClient({ post }: BlogPostClientProps) {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // Auto-scroll state
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [showAutoScrollBar, setShowAutoScrollBar] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const [isBarVisible, setIsBarVisible] = useState(true); // Controls floating bar visibility based on activity
  const [hideInlineControl, setHideInlineControl] = useState(false); // Hide inline control after auto-scroll starts
  const autoScrollRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inlineHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { intro, sections } = parseContent(post.content);
  const tocSections = getTocSections(sections);
  
  // Track user activity to show/hide floating bar after 5 seconds of inactivity
  useEffect(() => {
    // Only track when auto-scrolling is active
    if (!isAutoScrolling) {
      setIsBarVisible(true);
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      return;
    }
    
    const startHideTimer = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        setIsBarVisible(false);
      }, 5000);
    };
    
    const handleActivity = () => {
      setIsBarVisible(true);
      startHideTimer();
    };
    
    // Listen for various user activities
    window.addEventListener("mousemove", handleActivity, { passive: true });
    window.addEventListener("mousedown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    window.addEventListener("touchstart", handleActivity, { passive: true });
    
    // Start the initial timeout when auto-scroll starts
    startHideTimer();
    
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [isAutoScrolling]);
  
  // Hide inline control 3 seconds after auto-scroll starts
  // Once hidden, stays hidden until page refresh (user can resume from anywhere)
  useEffect(() => {
    if (isAutoScrolling && !hideInlineControl) {
      inlineHideTimeoutRef.current = setTimeout(() => {
        setHideInlineControl(true);
      }, 3000);
    }
    
    // Clear timeout if auto-scroll stops before 3 seconds
    if (!isAutoScrolling && inlineHideTimeoutRef.current) {
      clearTimeout(inlineHideTimeoutRef.current);
    }
    
    return () => {
      if (inlineHideTimeoutRef.current) {
        clearTimeout(inlineHideTimeoutRef.current);
      }
    };
  }, [isAutoScrolling, hideInlineControl]);
  
  // Auto-scroll logic
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) return;
    
    const scroll = (timestamp: number) => {
      if (!lastScrollTime.current) lastScrollTime.current = timestamp;
      
      const delta = timestamp - lastScrollTime.current;
      lastScrollTime.current = timestamp;
      
      // Calculate scroll amount based on speed and time delta
      const pixelsPerMs = SPEED_LEVELS[speedIndex].pixelsPerFrame / 16.67;
      const scrollAmount = pixelsPerMs * delta;
      
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.pageYOffset;
      
      if (currentScroll < maxScroll) {
        window.scrollBy(0, scrollAmount);
        autoScrollRef.current = requestAnimationFrame(scroll);
      } else {
        // Reached the end
        setIsAutoScrolling(false);
        autoScrollRef.current = null;
      }
    };
    
    autoScrollRef.current = requestAnimationFrame(scroll);
  }, [speedIndex]);
  
  const stopAutoScroll = useCallback(() => {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
      lastScrollTime.current = 0;
    }
  }, []);
  
  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
      setIsAutoScrolling(false);
    } else {
      setIsAutoScrolling(true);
      setShowAutoScrollBar(true); // Show bottom bar immediately when starting
      startAutoScroll();
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll]);
  
  // Restart auto-scroll when speed changes (if currently scrolling)
  useEffect(() => {
    if (isAutoScrolling) {
      stopAutoScroll();
      startAutoScroll();
    }
  }, [speedIndex, isAutoScrolling, startAutoScroll, stopAutoScroll]);
  
  // Keyboard shortcut (spacebar to toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.code === "Space" && showAutoScrollBar) {
        e.preventDefault();
        toggleAutoScroll();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAutoScrollBar, toggleAutoScroll]);
  
  // Stop auto-scroll on manual user scroll
  useEffect(() => {
    const handleWheel = () => {
      if (isAutoScrolling) {
        stopAutoScroll();
        setIsAutoScrolling(false);
      }
    };
    
    const handleTouchStart = () => {
      if (isAutoScrolling) {
        stopAutoScroll();
        setIsAutoScrolling(false);
      }
    };
    
    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
    };
  }, [isAutoScrolling, stopAutoScroll]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
      }
    };
  }, []);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash without jumping
      history.pushState(null, "", `#${sectionId}`);
      setActiveSection(sectionId);
    }
  }, []);

  // Handle initial hash navigation
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check for hash in URL on mount
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        scrollToSection(hash);
      }, 500);
    }
  }, [scrollToSection]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = tocSections.map((s) => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (const { id, element } of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150 && rect.bottom >= 150) {
            setActiveSection(id);
            break;
          }
        }
      }

      // Calculate scroll progress
      const scrollHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const clientHeight = document.documentElement.clientHeight;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
      
      setReadProgress(Math.min(100, Math.max(0, progress)));
      
      // Show auto-scroll bar after scrolling past 10% and before 95%
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      setShowAutoScrollBar(scrollTop > 200 && progress < 95);
      setShowScrollToTop(scrollPercentage > 0.7);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Call once on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tocSections]);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/blog");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleShareTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.title);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${post.title} - ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Image data for actual images with captions
  const imageData: Record<string, { src: string; caption: string; alt: string; source?: string }> = {
    "hero": {
      src: "/aesthetic/vehique-home.png",
      caption: "Vehique's conversational car search interface, where natural language meets automotive intelligence.",
      alt: "Screenshot of Vehique's AI-powered car search platform homepage",
      source: "https://www.vehique.ai/"
    },
    "traditional-vs-conversational": {
      src: "/aesthetic/traditional-vs-conversational.png",
      caption: "Competitor analysis from our pitch deck. A snapshot of how traditional platforms approach car search versus Vehique's conversational model.",
      alt: "Competitor analysis from Vehique pitch deck comparing traditional car shopping platforms"
    },
    "query-flow-diagram": {
      src: "/aesthetic/Core Search Architecture Image 1.webp",
      caption: "The core search architecture: Natural language queries flow through intent parsing, inventory normalization, and intelligent ranking to deliver personalized results.",
      alt: "Diagram showing the flow of natural language queries through Vehique's search architecture",
      source: "https://cdn.prod.website-files.com/64b7ba4dc9375b7b74b2135e/69415654119097496a3b06e0_Img%201.webp"
    },
    "agents-panel": {
      src: "/aesthetic/Agent Orchestration.webp",
      caption: "Multi-agent orchestration: Four specialized agents (Inventory, Verification, Research, and Voice) work in parallel to gather comprehensive vehicle insights.",
      alt: "Visualization of centralized agent orchestration with multiple AI agents working together",
      source: "https://dextralabs.com/wp-content/uploads/2025/06/Centralized-Orchestration-1024x683.webp"
    },
    "autopilot-interface": {
      src: "/aesthetic/Futuristic Identity Photo.png",
      caption: "The vision behind Autopilot: AI agents that see the market through your preferences, surfacing only what matters.",
      alt: "Futuristic visualization representing AI-powered autonomous car discovery",
      source: "https://www.lummi.ai/photo/futuristic-human-with-digital-visor-ntz9x"
    },
    "quality-dashboard": {
      src: "/aesthetic/Zach Woods Silicon Valley.webp",
      caption: "Quality monitoring: Like Jared's SWOT analysis in Silicon Valley, we obsess over metrics and decision-making frameworks to continuously improve search quality.",
      alt: "Jared from Silicon Valley with SWOT analysis board representing quality monitoring",
      source: "https://www.vox.com/2015/5/19/11562784/silicon-valley-season-two-episode-six-go-swot-yourself"
    },
    "roadmap": {
      src: "/aesthetic/floppy.jpeg",
      caption: "The real team behind Vehique: Floppy, our Chief Moral Support Officer, monitoring the late-night debugging sessions. She may not write code, but the emotional support is invaluable.",
      alt: "Floppy the cat sitting by the computer during late night coding sessions"
    },
    "search": {
      src: "/aesthetic/search.png",
      caption: "Vehique's search experience, where natural language meets real-time inventory.",
      alt: "Screenshot of Vehique's conversational search interface"
    },
    "carvana": {
      src: "/aesthetic/Carvana 2024.jpg",
      caption: "Carvana's iconic car vending machine. Proof that reimagining the experience matters as much as the transaction.",
      alt: "Carvana car vending machine tower"
    }
  };

  // Placeholder image styles with unique designs for each (currently empty as all images are provided)
  const placeholderStyles: Record<string, { icon: string; title: string; description: string; gradient: string }> = {};

  // Render paragraph content (handles image placeholders)
  const renderParagraph = (text: string, index: number) => {
    // Check for image placeholder
    if (text.startsWith("[IMAGE:")) {
      const imageId = text.match(/\[IMAGE:(.*?)\]/)?.[1];
      
      // Check if we have a real image for this ID
      if (imageId && imageData[imageId]) {
        const img = imageData[imageId];
        return (
          <motion.figure
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="my-12"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border/30 shadow-xl">
              <img 
                src={img.src} 
                alt={img.alt}
                className="w-full h-auto"
              />
            </div>
            <figcaption className="mt-4 text-center max-w-2xl mx-auto">
              <p className="text-sm text-muted-foreground/70 italic leading-relaxed">
                {img.caption}
              </p>
              {img.source && (
                <a 
                  href={img.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[10px] text-muted-foreground/50 hover:text-primary/70 transition-colors"
                >
                  Source: {new URL(img.source).hostname.replace('www.', '')} ↗
                </a>
              )}
            </figcaption>
          </motion.figure>
        );
      }

      // Render styled placeholder for images not yet available
      const placeholder = imageId ? placeholderStyles[imageId] : null;
      if (placeholder) {
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`my-12 rounded-2xl bg-gradient-to-br ${placeholder.gradient} border border-border/20 p-12 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden`}
          >
            {/* Decorative elements */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-foreground/5 blur-3xl" />
              <div className="absolute bottom-4 left-4 w-24 h-24 rounded-full bg-foreground/5 blur-2xl" />
            </div>
            
            <div className="relative text-center">
              <div className="text-5xl mb-4">{placeholder.icon}</div>
              <h4 className="text-lg font-medium text-foreground/80 mb-2">{placeholder.title}</h4>
              <p className="text-sm text-muted-foreground/60 max-w-md">{placeholder.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground/40 bg-background/50 px-4 py-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Image coming soon</span>
              </div>
            </div>
          </motion.div>
        );
      }

      // Fallback for unknown image IDs
      return (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="my-12 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/20 p-8 flex items-center justify-center min-h-[300px]"
        >
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-muted/50 flex items-center justify-center">
              <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Image: {imageId}</p>
            <p className="text-xs opacity-60 mt-1">Coming soon</p>
          </div>
        </motion.div>
      );
    }

    // Check for TOC placeholder
    if (text === "[TOC]") {
      return (
        <motion.nav
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="my-8 p-6 rounded-2xl bg-card/40 border border-border/20 backdrop-blur-sm"
          aria-label="Table of contents"
        >
          <ul className="space-y-3">
            {tocSections.map((section, i) => (
              <motion.li
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.05 }}
              >
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`group flex items-center gap-3 w-full text-left transition-all duration-300 hover:translate-x-1 ${
                    activeSection === section.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform duration-300 ${
                      activeSection === section.id ? "text-primary" : "opacity-40 group-hover:opacity-100"
                    }`} 
                  />
                  <span className="text-base">{section.title}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        </motion.nav>
      );
    }

    // Parse markdown formatting: links [text](url) and bold **text**
    const parseMarkdown = (content: string) => {
      // Combined regex for links and bold
      const markdownRegex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = markdownRegex.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(content.slice(lastIndex, match.index));
        }
        
        if (match[1] && match[2]) {
          // It's a link [text](url)
          parts.push(
            <a
              key={`link-${match.index}`}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-2 transition-colors"
            >
              {match[1]}
            </a>
          );
        } else if (match[3]) {
          // It's bold **text**
          parts.push(
            <strong key={`bold-${match.index}`} className="font-semibold text-foreground">
              {match[3]}
            </strong>
          );
        }
        
        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex));
      }

      return parts.length > 0 ? parts : content;
    };

    return (
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-lg leading-relaxed text-foreground/85 mb-6 text-justify"
      >
        {parseMarkdown(text)}
      </motion.p>
    );
  };

  return (
    <div className="min-h-screen bg-background font-google-sans-flex selection:bg-foreground selection:text-background">
      <PublicHeader />
      
      <article className="container mx-auto max-w-3xl px-6 pt-32 pb-24">
        {/* Back link */}
        <motion.a 
          href="/blog" 
          onClick={handleBack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Blog
        </motion.a>
        
        {/* Article header */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12 mb-16"
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-foreground/5 text-muted-foreground border border-border/20"
              >
                {tag}
              </span>
            ))}
          </div>
          
          {/* Title */}
          <h1 className="font-google-sans-flex text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] mb-8">
            {post.title}
          </h1>
          
          {/* Meta info with minimal auto-scroll button */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground/70 pb-8 border-b border-border/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {post.author.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="font-medium text-foreground">{post.author.name}</div>
                {post.author.role && (
                  <div className="text-xs text-muted-foreground">{post.author.role}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readingTime}
              </span>
              
              {/* Minimal auto-scroll button - always visible */}
              <button
                onClick={toggleAutoScroll}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isAutoScrolling 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {isAutoScrolling ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span>{isAutoScrolling ? "Pause" : "Auto-scroll"}</span>
              </button>
            </div>
          </div>
        </motion.header>
        
        {/* Article content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="prose-article"
        >
          {/* Intro paragraphs */}
          {intro.map((paragraph, index) => renderParagraph(paragraph, index))}

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-28">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-light tracking-tight mt-16 mb-8 text-foreground"
              >
                {section.title}
              </motion.h2>
              {section.content.map((paragraph, index) => 
                renderParagraph(paragraph, index)
              )}
            </section>
          ))}
        </motion.div>
        
        {/* Share section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 pt-8 border-t border-border/20"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Share this article
              </h3>
              <p className="text-xs text-muted-foreground/60">
                If you found this useful, share it with others
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareTelegram}
                className="w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Share on Telegram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </button>
              <button
                onClick={handleCopyLink}
                className="w-10 h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center transition-all hover:scale-110"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Author bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 p-8 rounded-2xl bg-card/30 border border-border/20 backdrop-blur-sm"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-primary">
                {post.author.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">{post.author.name}</h3>
              {post.author.role && (
                <p className="text-xs text-muted-foreground mb-2">{post.author.role}</p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                Building the future of AI-powered car shopping at Vehique. On a mission to make finding your perfect vehicle effortless.
              </p>
              <Link 
                href="mailto:hello@vehique.ai" 
                className="inline-block mt-3 text-xs font-bold text-primary hover:underline"
              >
                hello@vehique.ai
              </Link>
            </div>
          </div>
        </motion.div>
      </article>

      {/* Auto-scroll control bar - floating, centered to blog content */}
      {/* Hides after 5s of inactivity during auto-scroll, reappears on user activity */}
      <AnimatePresence>
        {showAutoScrollBar && isBarVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-8 left-0 right-0 z-50 pointer-events-none"
          >
            <div className="container mx-auto max-w-3xl px-6 flex justify-center pointer-events-auto">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-2xl blur-xl opacity-60" />
                
                {/* Main control bar */}
                <div className="relative flex items-center gap-1 px-2 py-2 rounded-2xl bg-background/80 backdrop-blur-xl border border-border/30 shadow-2xl shadow-black/10">
                  {/* Progress bar background */}
                  <div className="absolute inset-x-2 bottom-0 h-0.5 bg-border/20 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                      style={{ width: `${readProgress}%` }}
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                  </div>
                
                {/* Play/Pause button */}
                <motion.button
                  onClick={toggleAutoScroll}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    isAutoScrolling 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                  }`}
                  aria-label={isAutoScrolling ? "Pause auto-scroll" : "Start auto-scroll"}
                >
                  <AnimatePresence mode="wait">
                    {isAutoScrolling ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Pause className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Pulsing ring when active */}
                  {isAutoScrolling && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-primary"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.3, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </motion.button>
                
                {/* Divider */}
                <div className="w-px h-6 bg-border/30 mx-1" />
                
                {/* Speed selector with +/- buttons */}
                <div className="flex items-center gap-0.5 px-1">
                  <motion.button
                    onClick={() => setSpeedIndex(Math.max(0, speedIndex - 1))}
                    disabled={speedIndex === 0}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    aria-label="Decrease speed"
                  >
                    −
                  </motion.button>
                  <div className="relative px-2 py-1.5 min-w-[48px]">
                    <motion.div
                      className="absolute inset-0 bg-foreground/8 rounded-lg"
                      layoutId="speed-indicator-float"
                    />
                    <span className="relative z-10 text-xs font-semibold text-foreground tabular-nums flex items-center justify-center">
                      {SPEED_LEVELS[speedIndex].label}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setSpeedIndex(Math.min(SPEED_LEVELS.length - 1, speedIndex + 1))}
                    disabled={speedIndex === SPEED_LEVELS.length - 1}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    aria-label="Increase speed"
                  >
                    +
                  </motion.button>
                </div>
                
                {/* Divider */}
                <div className="w-px h-6 bg-border/30 mx-1" />
                
                {/* Progress indicator */}
                <div className="px-3 py-1.5 text-xs text-muted-foreground/60 font-mono tabular-nums min-w-[52px] text-center">
                  {Math.round(readProgress)}%
                </div>
                
                {/* Keyboard hint */}
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-foreground/5 text-[10px] text-muted-foreground/40">
                  <kbd className="px-1.5 py-0.5 rounded bg-foreground/5 font-mono">Space</kbd>
                  <span>to toggle</span>
                </div>
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleScrollToTop}
            className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur-sm border border-border/20 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      <Footer 
        language={language}
        setLanguage={setLanguage}
        isLangOpen={isLangOpen}
        setIsLangOpen={setIsLangOpen}
        languages={US_POPULAR_LANGUAGES}
        t={t}
      />
    </div>
  );
}
