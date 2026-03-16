"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser, SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
import { Settings, LogOut, MessageCircle, Compass, LayoutGrid, GitCompare, Binoculars } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePricing } from "@/components/pricing";
import { useSettings } from "@/components/settings";
import { useFeedback } from "@/components/feedback";


interface PublicHeaderProps {
  onTabNavigate?: (tab: string) => void;
}

export function PublicHeader({ onTabNavigate }: PublicHeaderProps = {}) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { openPricing } = usePricing();
  const { openSettings } = useSettings();
  const { openFeedback } = useFeedback();
  const [hasMounted, setHasMounted] = useState(false);
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const featureMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    return () => clearFeatureMenuTimeout();
  }, []);

  const clearFeatureMenuTimeout = () => {
    if (featureMenuTimeoutRef.current) {
      clearTimeout(featureMenuTimeoutRef.current);
      featureMenuTimeoutRef.current = null;
    }
  };

  const handleFeatureMenuEnter = () => {
    clearFeatureMenuTimeout();
    featureMenuTimeoutRef.current = setTimeout(() => setFeatureMenuOpen(true), 50);
  };

  const handleFeatureMenuLeave = () => {
    clearFeatureMenuTimeout();
    featureMenuTimeoutRef.current = setTimeout(() => setFeatureMenuOpen(false), 400);
  };

  return (
    <header className="absolute top-0 w-full z-[100]">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-16 h-16 sm:h-20 flex items-center justify-between"
      >
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
        >
          <Image
            src="/vehique-transparent-2025.png"
            alt="Vehique"
            width={26}
            height={26}
            className="dark:invert transition-transform group-hover:scale-110 duration-300"
            priority
          />
          <span className="text-sm sm:text-base lg:text-lg font-extrabold tracking-tight">Vehique</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 h-9">
            {/* About */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="relative flex items-center h-full text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group"
              onClick={() => {
                const lenis = (window as any).lenis;
                if (lenis) {
                  lenis.scrollTo("#about", { duration: 2, offset: -80 });
                } else {
                  document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              About
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </motion.button>

            {/* Blog */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex items-center h-full"
            >
              <Link
                href="/blog"
                className="relative flex items-center h-full text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group"
              >
                Blog
                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full" />
              </Link>
            </motion.div>

            {/* Pricing */}
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative flex items-center h-full text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group"
              onClick={openPricing}
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full" />
            </motion.button>

            {/* Dashboard - only when signed in; links to app Showroom. When on homepage use onTabNavigate so state updates without remount. */}
            {hasMounted && isSignedIn && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="flex items-center h-full"
              >
                {onTabNavigate ? (
                  <button
                    type="button"
                    onClick={() => {
                      onTabNavigate("Showroom");
                      router.push("/?tab=Showroom");
                    }}
                    className="relative flex items-center h-full text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group"
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full" />
                  </button>
                ) : (
                  <Link
                    href="/?tab=Showroom"
                    className="relative flex items-center h-full text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group"
                  >
                    Dashboard
                    <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full" />
                  </Link>
                )}
              </motion.div>
            )}

            {/* Feature dropdown: Showroom, Compare, Scout (opens on hover) */}
            <DropdownMenu open={featureMenuOpen} onOpenChange={setFeatureMenuOpen}>
              <div
                onPointerEnter={handleFeatureMenuEnter}
                onPointerLeave={handleFeatureMenuLeave}
              >
                <DropdownMenuTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="relative flex items-center h-full p-0 text-[11px] font-[900] uppercase tracking-widest text-foreground hover:text-foreground/80 transition-colors group outline-none data-[state=open]:text-foreground"
                  >
                    <span className="relative flex items-center h-full">
                      Features
                      <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-foreground transition-all duration-300 group-hover:w-full group-data-[state=open]:w-full" />
                    </span>
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={24}
                  className="w-56 max-w-[calc(100vw-2rem)] bg-[#f4f4f4] dark:bg-card backdrop-blur-md border-2 border-border/40 rounded-xl shadow-xl font-google-sans-flex"
                  onPointerEnter  ={handleFeatureMenuEnter}
                  onPointerLeave={handleFeatureMenuLeave}
                >
                  <DropdownMenuItem
                    onClick={() => (hasMounted && isSignedIn ? onTabNavigate?.("Showroom") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }))}
                    className="cursor-pointer px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
                      <LayoutGrid className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-foreground">Showroom</span>
                      <span className="text-xs text-muted-foreground">Save vehicles you love</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (hasMounted && isSignedIn ? onTabNavigate?.("Research Agents") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }))}
                    className="cursor-pointer px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
                      <GitCompare className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-foreground">Compare</span>
                      <span className="text-xs text-muted-foreground">Select 2+ vehicles to compare side-by-side with deep AI analysis</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => (hasMounted && isSignedIn ? onTabNavigate?.("Autopilot") : document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }))}
                    className="cursor-pointer px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/10 text-foreground">
                      <Binoculars className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-bold text-foreground">Scout</span>
                      <span className="text-xs text-muted-foreground">Deploy scouts to monitor the market 24/7</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
          </nav>
          <div className="flex items-center gap-2">
            {hasMounted && isSignedIn ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-foreground/5 transition-all duration-300 ease-custom"
                    >
                      <div className="w-8 h-8 rounded-md bg-primary border border-border/40 overflow-hidden flex items-center justify-center transition-transform duration-300 ease-custom hover:scale-105">
                        {user?.imageUrl ? (
                          <img
                            src={user.imageUrl}
                            alt={user.emailAddresses[0]?.emailAddress || "User"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-extrabold font-google-sans-flex">
                            {(user?.emailAddresses[0]?.emailAddress || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#f4f4f4] dark:bg-card backdrop-blur-md border-border/20 rounded-lg shadow-xl font-google-sans-flex">
                    <DropdownMenuLabel className="text-[10px] text-muted-foreground font-bold tracking-wide px-3 py-2">
                      {user?.emailAddresses[0]?.emailAddress?.toUpperCase() || ""}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/15" />
                    <button
                      onClick={openPricing}
                      className="w-full px-3 py-2.5 hover:bg-foreground/5 transition-colors duration-200 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center shrink-0 transition-transform duration-300 ease-custom">
                          <Compass className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-extrabold text-foreground tracking-tight">Starter</div>
                          <div className="text-[11px] text-muted-foreground font-medium">View all plans →</div>
                        </div>
                      </div>
                    </button>
                    <DropdownMenuSeparator className="bg-border/15" />
                    <DropdownMenuItem
                      onClick={openSettings}
                      className="cursor-pointer px-3 py-2 font-bold text-sm hover:bg-foreground/5 transition-colors duration-200"
                    >
                      <Settings className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={openFeedback}
                      className="cursor-pointer px-3 py-2 font-bold text-sm hover:bg-foreground/5 transition-colors duration-200"
                    >
                      <MessageCircle className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
                      Feedback
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer px-3 py-2 font-bold text-sm hover:bg-foreground/5 transition-colors duration-200">
                      <SignOutButton>
                        <div className="flex items-center w-full">
                          <LogOut className="w-3.5 h-3.5 mr-2" strokeWidth={2.5} />
                          Log out
                        </div>
                      </SignOutButton>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/5 transition-all text-foreground"
                  >
                    Sign In
                  </motion.button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full bg-foreground text-background hover:opacity-90 hover:shadow-lg hover:scale-105 transition-all"
                  >
                    Sign Up
                  </motion.button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </header>
  );
}

