"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Compass, Flower2, Atom, Building2, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BillingCycle = "weekly" | "monthly" | "quarterly";

interface PlanFeature {
  text: string;
  highlighted?: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  weeklyPrice: number | null;
  monthlyPrice: number | null;
  quarterlyPrice: number | null;
  quarterlyRate: number | null;
  features: PlanFeature[];
  icon: React.ReactNode;
  iconBg: string;
  popular?: boolean;
  comingSoon?: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Get started with basic agentic car search. Perfect for casual browsing.",
    weeklyPrice: 0,
    monthlyPrice: 0,
    quarterlyPrice: 0,
    quarterlyRate: 0,
    icon: <Compass className="w-8 h-8" strokeWidth={2.5} />,
    iconBg: "bg-primary",
    features: [
      { text: "Agentic search (basic)" },
      { text: "Save cars + basic collections" },
      { text: "Basic listing summary" },
      { text: "Key highlights extraction" },
      { text: "Limited deep checks per month" },
    ],
    cta: "Current Plan",
  },
  {
    id: "super",
    name: "Super",
    description: "Smarter search, trust checks, and alerts. For serious car shoppers.",
    weeklyPrice: 6.99,
    monthlyPrice: 29,
    quarterlyPrice: 75,
    quarterlyRate: 25,
    icon: <Flower2 className="w-8 h-8" strokeWidth={2} />,
    iconBg: "bg-secondary",
    features: [
      { text: "Advanced filters & smarter ranking", highlighted: true },
      { text: "Listing trust checks" },
      { text: "Duplicate & red flag detection" },
      { text: "Price and market comps" },
      { text: "Watchlists + alerts" },
      { text: "Price drop notifications" },
      { text: "Limited dealer outreach" },
    ],
    cta: "Upgrade to Super",
  },
  {
    id: "hyper",
    name: "Hyper",
    description: "Full-service research, verification, and dealer outreach. The complete package.",
    weeklyPrice: 11.99,
    monthlyPrice: 49,
    quarterlyPrice: 120,
    quarterlyRate: 40,
    icon: <Atom className="w-8 h-8" strokeWidth={2} />,
    iconBg: "bg-primary",
    popular: true,
    features: [
      { text: "Everything in Super", highlighted: true },
      { text: "Deep research reports", highlighted: true },
      { text: "VIN decode + spec consistency" },
      { text: "Scam risk signals" },
      { text: "Agentic dealer calls & emails" },
      { text: "Appointment scheduling" },
      { text: "Negotiation pack & leverage points" },
      { text: "Priority speed + higher limits" },
      { text: "Multi-site browser scouting" },
      { text: "\"Find me the best one\" workflow", highlighted: true },
      { text: "Verified shortlists" },
      { text: "Call transcripts & evidence links" },
      { text: "Concierge escalation" },
    ],
    cta: "Go Hyper",
  },
  {
    id: "enterprise",
    name: "Dealership Enterprise",
    description: "For dealerships: inventory sync, lead management, and team tools.",
    weeklyPrice: null,
    monthlyPrice: null,
    quarterlyPrice: null,
    quarterlyRate: null,
    icon: <Building2 className="w-8 h-8" strokeWidth={2} />,
    iconBg: "bg-muted",
    comingSoon: true,
    features: [
      { text: "Inventory sync (feed/API/bulk)" },
      { text: "Unified lead inbox" },
      { text: "Auto follow-up sequences" },
      { text: "Call transcripts + next steps" },
      { text: "Lead qualification & routing" },
      { text: "Analytics dashboard" },
      { text: "Listing verification tools" },
      { text: "Team roles & permissions" },
      { text: "CRM & webhook integrations" },
    ],
    cta: "Contact Sales",
  },
];

// Animated price component for smooth transitions
function AnimatedPrice({ 
  price, 
  suffix, 
  monthlyPrice,
  isQuarterly,
  isFree,
  isTBD 
}: { 
  price: number | null; 
  suffix: string; 
  monthlyPrice?: number | null;
  isQuarterly?: boolean;
  isFree?: boolean;
  isTBD?: boolean;
}) {
  if (isTBD) {
    return (
      <div className="text-2xl font-black text-foreground/40">
        TBD
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-4xl sm:text-5xl font-black text-foreground">$0</span>
        <span className="text-sm font-bold text-muted-foreground">/mo</span>
      </div>
    );
  }

  const savings = isQuarterly && monthlyPrice && price 
    ? Math.round((1 - (price / monthlyPrice)) * 100) 
    : 0;

  return (
    <div>
      <div className="flex items-baseline gap-1 h-12 overflow-hidden">
          <motion.span
            key={price}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl font-black text-foreground block"
          >
            ${price}
          </motion.span>
          <motion.span
            key={suffix}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-sm font-bold text-muted-foreground"
          >
            {suffix}
          </motion.span>
      </div>
      <AnimatePresence>
        {isQuarterly && monthlyPrice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-1 text-xs text-primary font-bold overflow-hidden"
          >
            Save ${monthlyPrice - (price || 0)}/mo ({savings}% off) — billed quarterly
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const { toast } = useToast();

  const showCookingToast = () => {
    toast({
      title: "🍳 We're cooking!",
      description: "This feature is coming soon. Stay tuned!",
    });
  };

  // Lock body scroll and handle ESC key when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      // 1. Stop Lenis smooth scrolling
      (window as any).lenis?.stop();
      
      // 2. Lock native scroll
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      
      // 3. Add keyboard listener
      window.addEventListener("keydown", handleKeyDown);
    } else {
      (window as any).lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      (window as any).lenis?.start();
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const getPrice = (plan: Plan) => {
    if (plan.comingSoon) return { price: null, suffix: "", isTBD: true };
    if (plan.monthlyPrice === 0) return { price: 0, suffix: "", isFree: true };
    
    if (billingCycle === "weekly") {
      return { price: plan.weeklyPrice, suffix: "/week", isWeekly: true };
    } else if (billingCycle === "monthly") {
      return { price: plan.monthlyPrice, suffix: "/mo" };
    } else {
      // Show the per-month rate as main price, with savings info
      return { 
        price: plan.quarterlyRate, 
        suffix: "/mo",
        monthlyPrice: plan.monthlyPrice,
        isQuarterly: true,
      };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-4 sm:inset-6 md:inset-10 lg:inset-16 z-[201] overflow-hidden"
          >
            <div className="relative w-full h-full bg-background rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
              >
                <X className="w-5 h-5 text-foreground/70" />
              </button>

              {/* Scrollable Content - entire modal scrolls */}
              <div 
                className="flex-1 overflow-y-auto custom-scrollbar overscroll-contain"
                data-lenis-prevent
              >
                <div className="px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-12 md:py-16">
                  {/* Header */}
                  <div className="text-center mb-8 sm:mb-12">
                    {/* Early Access Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
                    >
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        Early access pricing — limited time
                      </span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4"
                    >
                      Choose your plan
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto"
                    >
                      Questions about which is best for you? Reach out at{" "}
                      <a href="mailto:hello@vehique.ai" className="text-foreground underline underline-offset-2 hover:no-underline">
                        hello@vehique.ai
                      </a>
                    </motion.p>

                    {/* Billing Toggle - equal-width segments so selected pill aligns exactly */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-center justify-center mt-8"
                    >
                      <div className="relative inline-grid grid-cols-3 items-stretch bg-foreground/5 dark:bg-foreground/5 rounded-full p-1 min-w-[240px]">
                        {/* Animated background pill - one segment width; x is % of own width so 0, 100%, 200% */}
                        <motion.div
                          className="absolute top-1 bottom-1 left-1 rounded-full bg-foreground shadow-lg"
                          style={{ width: "calc((100% - 8px) / 3)" }}
                          initial={false}
                          animate={{
                            x: billingCycle === "weekly" ? 0 : billingCycle === "monthly" ? "100%" : "200%",
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                        <button
                          onClick={() => setBillingCycle("weekly")}
                          className={cn(
                            "relative z-10 col-span-1 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-300",
                            billingCycle === "weekly"
                              ? "text-background"
                              : "text-foreground/60 hover:text-foreground"
                          )}
                        >
                          Weekly
                        </button>
                        <button
                          onClick={() => setBillingCycle("monthly")}
                          className={cn(
                            "relative z-10 col-span-1 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-300",
                            billingCycle === "monthly"
                              ? "text-background"
                              : "text-foreground/60 hover:text-foreground"
                          )}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setBillingCycle("quarterly")}
                          className={cn(
                            "relative z-10 col-span-1 px-4 sm:px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-300",
                            billingCycle === "quarterly"
                              ? "text-background"
                              : "text-foreground/60 hover:text-foreground"
                          )}
                        >
                          Quarterly
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
                    {PLANS.map((plan, index) => {
                      const priceInfo = getPrice(plan);
                      
                      return (
                        <motion.div
                          key={plan.id}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + index * 0.08, duration: 0.5 }}
                          className={cn(
                            "relative flex flex-col rounded-2xl border transition-all duration-300",
                            plan.popular
                              ? "bg-card border-primary/40 shadow-xl shadow-primary/10 ring-2 ring-primary/20"
                              : "bg-card border-border/30 hover:border-border/50",
                            plan.comingSoon && "opacity-80"
                          )}
                        >
                          {/* Popular Badge with Crown */}
                          {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5" />
                              Recommended
                            </div>
                          )}

                          {/* Coming Soon Badge */}
                          {plan.comingSoon && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold shadow-lg">
                              Coming Soon
                            </div>
                          )}

                          <div className="p-6 sm:p-8 flex flex-col flex-1">
                            {/* Icon */}
                            <div className={cn(
                              "w-16 h-16 rounded-xl flex items-center justify-center text-primary-foreground mb-3 shadow-lg",
                              plan.iconBg
                            )}>
                              {plan.icon}
                            </div>

                            {/* Plan Name & Description */}
                            <h3 className="text-xl font-black tracking-tight text-foreground mb-2">
                              {plan.name}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 min-h-[40px]">
                              {plan.description}
                            </p>

                            {/* Animated Content Wrapper */}
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={billingCycle}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ 
                                  duration: 0.3, 
                                  delay: index * 0.05, // Staggered effect
                                  ease: "easeOut" 
                                }}
                                className="flex flex-col flex-1"
                              >
                                {/* Animated Price */}
                                <div className="mb-6 min-h-[70px]">
                                  <AnimatedPrice 
                                    price={priceInfo.price}
                                    suffix={priceInfo.suffix}
                                    monthlyPrice={priceInfo.monthlyPrice}
                                    isQuarterly={priceInfo.isQuarterly}
                                    isFree={priceInfo.isFree}
                                    isTBD={priceInfo.isTBD}
                                  />
                                </div>

                                {/* CTA Button */}
                                <button
                                  className={cn(
                                    "w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 mb-6",
                                    plan.cta === "Current Plan" 
                                      ? "bg-foreground/5 text-foreground cursor-default border border-foreground/10"
                                      : plan.popular
                                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                      : plan.comingSoon
                                      ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
                                      : "bg-foreground text-background hover:opacity-90"
                                  )}
                                  disabled={plan.comingSoon || plan.cta === "Current Plan"}
                                  onClick={() => {
                                    if (plan.cta !== "Current Plan" && !plan.comingSoon) {
                                      showCookingToast();
                                    }
                                  }}
                                >
                                  {plan.cta}
                                </button>

                                {/* Features */}
                                <div className="space-y-3 flex-1">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    This includes:
                                  </p>
                                  {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                      <div className={cn(
                                        "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                        feature.highlighted 
                                          ? "bg-primary/20 text-primary" 
                                          : "bg-foreground/10 text-foreground/60"
                                      )}>
                                        <Check className="w-2.5 h-2.5" strokeWidth={3} />
                                      </div>
                                      <span className={cn(
                                        "text-sm leading-tight",
                                        feature.highlighted 
                                          ? "font-bold text-foreground" 
                                          : "text-muted-foreground"
                                      )}>
                                        {feature.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
