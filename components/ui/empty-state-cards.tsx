"use client";

import { Crown, Star, Zap, Clock, TrendingUp, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CardEvent {
  id: number | string;
  title: string;
  subtitle: string;
  location?: string;
  image: string;
  badge?: string;
  badgeIcon?: "crown" | "star" | "zap" | "clock" | "trending";
  participants?: Array<{ avatar: string }>;
}

interface EmptyStateCardsProps {
  cards: CardEvent[];
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  interval?: number;
  cardWidth?: number;
  cardHeight?: number;
}

// Wrap function to cycle through indices
function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

// Badge icon mapping
function getBadgeIcon(badge?: string, iconName?: string) {
  if (iconName === "star") return Star;
  if (iconName === "zap") return Zap;
  if (iconName === "clock") return Clock;
  if (iconName === "trending") return TrendingUp;
  
  // Auto-detect based on badge text
  if (!badge) return Crown;
  const lower = badge.toLowerCase();
  if (lower.includes("saved") || lower.includes("favorite")) return Star;
  if (lower.includes("price") || lower.includes("drop")) return TrendingUp;
  if (lower.includes("rare") || lower.includes("find")) return Zap;
  if (lower.includes("active") || lower.includes("process") || lower.includes("schedul")) return Clock;
  return Crown;
}

// Animation variants for the horizontal fan carousel
const cardVariants = {
  center: {
    x: "-50%",
    rotate: 0,
    scale: 1,
    opacity: 1,
    zIndex: 3,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  left: {
    x: "-140%",
    rotate: -12,
    scale: 0.85,
    opacity: 0.75,
    zIndex: 2,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  right: {
    x: "40%",
    rotate: 12,
    scale: 0.85,
    opacity: 0.75,
    zIndex: 2,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  hidden: {
    opacity: 0,
    scale: 0.7,
    zIndex: 1,
    transition: { duration: 0.25 },
  },
};

export function EmptyStateCards({ 
  cards, 
  title, 
  description, 
  action,
  interval = 3500,
  cardWidth = 200,
  cardHeight = 290,
}: EmptyStateCardsProps) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const setPageRef = useRef((val: number, dir: number) => {
    setPage(val);
    setDirection(dir);
  });

  useEffect(() => {
    setPageRef.current = (val: number, dir: number) => {
      setPage(val);
      setDirection(dir);
    };
  });

  // Auto-cycle through cards
  useEffect(() => {
    if (cards.length <= 1) return;
    
    const timer = setInterval(() => {
      setPageRef.current(page + 1, 1);
    }, interval);
    
    return () => clearInterval(timer);
  }, [page, interval, cards.length]);

  const activeIndex = wrap(0, cards.length, page);

  // Get the 3 visible cards: left, center, right
  const visibleCards = [-1, 0, 1].map(
    (offset) => cards[wrap(0, cards.length, activeIndex + offset)]
  );

  const getVariant = (index: number): "left" | "center" | "right" => {
    if (index === 1) return "center";
    if (index === 0) return "left";
    return "right";
  };

  if (cards.length === 0) return null;

  return (
    <div className="flex flex-col items-center w-full min-h-[540px] pt-16 pb-6">
      {/* Card Carousel Container - pushed down and slight shift left */}
      <div 
        className="relative flex items-center justify-center"
        style={{ 
          width: "100%",
          height: cardHeight + 30,
          marginLeft: -12,
          marginBottom: 40,
        }}
      >
        {/* Cards container */}
        <div 
          className="relative" 
          style={{ 
            width: cardWidth * 3,
            height: cardHeight,
          }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            {visibleCards.map((card, index) => {
              const BadgeIcon = getBadgeIcon(card.badge, card.badgeIcon);
              const variant = getVariant(index);
              
              return (
                <motion.div
                  key={card.id}
                  custom={direction}
                  variants={cardVariants}
                  initial="hidden"
                  animate={variant}
                  exit="hidden"
                  className="absolute top-0 left-1/2 origin-center"
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                  }}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-card shadow-2xl shadow-black/30">
                    {/* Image Background */}
                    <img
                      src={card.image}
                      alt={card.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    
                    {/* Badge - Top Left */}
                    {card.badge && (
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <span className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur-xl">
                          <BadgeIcon className="w-2.5 h-2.5" />
                          {card.badge}
                        </span>
                      </div>
                    )}
                    
                    {/* Dark gradient for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[5]" />
                    
                    {/* Bottom Content */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 text-white">
                      {/* Participants */}
                      {card.participants && card.participants.length > 0 && (
                        <div className="mb-1.5 flex items-center justify-center gap-1">
                          {card.participants.map((p, i) => (
                            <img
                              key={i}
                              src={p.avatar}
                              alt={`Participant ${i + 1}`}
                              className="w-5 h-5 rounded-full border-2 border-white/30 object-cover"
                            />
                          ))}
                        </div>
                      )}
                      
                      {/* Title */}
                      <p className="text-center text-sm font-bold leading-tight tracking-tight line-clamp-2">
                        {card.title}
                      </p>
                      
                      {/* Subtitle */}
                      <p className="mt-0.5 text-center text-[10px] font-medium text-white/80 leading-snug line-clamp-1">
                        {card.subtitle}
                      </p>
                      
                      {/* Location */}
                      {card.location && (
                        <div className="mt-1 flex items-center justify-center gap-0.5 text-white/70">
                          <MapPin className="w-2 h-2" />
                          <span className="text-[9px] font-medium">{card.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Gradient Blur Overlay - Apple Invites style */}
                    <div className="absolute inset-x-0 bottom-0 h-2/5 isolate z-10 pointer-events-none">
                      <div className="gradient-mask-t-0 absolute inset-0 overflow-hidden rounded-b-[22px] backdrop-blur-[1px]" />
                      <div className="gradient-mask-t-0 absolute inset-0 overflow-hidden rounded-b-[22px] backdrop-blur-[2px]" />
                      <div className="gradient-mask-t-0 absolute inset-0 overflow-hidden rounded-b-[22px] backdrop-blur-[4px]" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Text Content - positioned below cards */}
      {(title || description) && (
        <div className="w-full text-center space-y-2 max-w-sm mx-auto px-6">
          {title && (
            <h3 className="text-lg font-black tracking-tight text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 px-5 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all duration-300"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
