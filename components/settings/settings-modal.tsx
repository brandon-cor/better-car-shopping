"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  User, 
  Shield, 
  CreditCard, 
  CalendarClock, 
  BarChart3,
  Mail,
  Smartphone,
  Laptop,
  Plus,
  Compass,
  Check,
  ChevronRight,
  Sparkles,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser, useSessionList } from "@clerk/nextjs";
import { usePricing } from "@/components/pricing";
import Image from "next/image";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "profile" | "security" | "billing" | "scheduled" | "usage";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "scheduled", label: "Scheduled Search", icon: CalendarClock },
  { id: "usage", label: "Usage", icon: BarChart3 },
] as const;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const { user } = useUser();
  const { sessionId } = useAuth();
  const { sessions, isLoaded: isSessionsLoaded } = useSessionList();
  const { openPricing } = usePricing();

  // Reset tab when opening
  useEffect(() => {
    if (isOpen) setActiveTab("profile");
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      (window as any).lenis?.stop();
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
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

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Avatar Section */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border/40">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-md overflow-hidden bg-primary border border-border/40">
                  {user?.imageUrl ? (
                    <Image 
                      src={user.imageUrl} 
                      alt="Profile" 
                      fill 
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold font-google-sans-flex text-primary-foreground">
                      {(user?.firstName?.[0] || "U").toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm">{user?.fullName || "User"}</div>
                  <div className="text-xs text-muted-foreground">Avatar</div>
                </div>
              </div>
              <button className="text-xs font-bold text-primary hover:underline">Update</button>
            </div>

            {/* Email Section */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email Addresses</div>
              <div className="space-y-2">
                {user?.emailAddresses.map((email) => (
                  <div key={email.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{email.emailAddress}</span>
                      {user.primaryEmailAddressId === email.id && (
                        <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase">Primary</span>
                      )}
                    </div>
                  </div>
                ))}
                <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                  <Plus className="w-3.5 h-3.5" /> Add email address
                </button>
              </div>
            </div>

            {/* Connected Accounts */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Connected Accounts</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                    <span className="text-xs font-medium">Google</span>
                  </div>
                  <button className="text-xs font-bold text-muted-foreground hover:text-foreground">Disconnect</button>
                </div>
                <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                  <Plus className="w-3.5 h-3.5" /> Connect account
                </button>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Passkeys */}
            <div className="space-y-2.5">
               <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Passkeys</div>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80">
                    <Plus className="w-3.5 h-3.5" /> Add a passkey
                  </button>
               </div>
               <div className="p-6 border border-dashed border-border/40 rounded-lg flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                  <Shield className="w-6 h-6 opacity-20" />
                  <p className="text-xs">No passkeys configured yet.</p>
               </div>
            </div>

            {/* Active Devices */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Devices</div>
              <div className="space-y-2">
                {isSessionsLoaded && sessions?.length ? (
                  sessions.map((session: any) => {
                    const ipAddress = session.latestActivity?.ipAddress;
                    const location = [session.latestActivity?.city, session.latestActivity?.country].filter(Boolean).join(", ");
                    const activityMeta = [ipAddress, location].filter(Boolean).join(" • ");

                    return (
                    <div key={session.id} className={cn("flex items-start gap-3 p-3.5 rounded-lg border border-border/40", session.status !== "active" && "opacity-60")}>
                      {session.latestActivity?.isMobile ? (
                        <Smartphone className="w-5 h-5 text-foreground mt-0.5" />
                      ) : (
                        <Laptop className="w-5 h-5 text-foreground mt-0.5" />
                      )}
                      <div className="flex-1 space-y-0.5">
                         <div className="flex items-center gap-2">
                           <span className="font-bold text-xs">
                             {session.latestActivity?.deviceType || "Unknown Device"} 
                             {session.latestActivity?.browserName && ` - ${session.latestActivity.browserName}`}
                           </span>
                           {sessionId && session.id === sessionId && (
                             <span className="px-1.5 py-0.5 bg-foreground/10 text-[9px] font-bold uppercase rounded-full text-muted-foreground">This Device</span>
                           )}
                         </div>
                         {activityMeta && (
                           <div className="text-[11px] text-muted-foreground">{activityMeta}</div>
                         )}
                         <div className="text-[11px] text-muted-foreground font-mono">Last active: {new Date(session.lastActiveAt).toLocaleString()}</div>
                      </div>
                      {session.status === "active" && (
                        <button 
                          onClick={() => session.revoke()}
                          className="text-xs font-bold text-destructive hover:underline"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-muted-foreground">No active sessions found.</div>
                )}
              </div>
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Current Plan Card */}
            <div className="p-4 rounded-lg border border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-sm">Starter Plan</div>
                  <div className="text-xs text-muted-foreground">Active since Jan 2025</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  openPricing();
                }}
                className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
              >
                Upgrade Plan
              </button>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Payment Methods</div>
                <button className="px-2.5 py-1.5 text-xs font-bold border border-border/40 rounded-lg hover:bg-foreground/5 transition-colors">
                  Add Payment Method
                </button>
              </div>
              <div className="p-6 border border-dashed border-border/40 rounded-lg flex flex-col items-center justify-center text-center gap-2 text-muted-foreground">
                 <CreditCard className="w-6 h-6 opacity-20" />
                 <p className="text-xs">No payment methods saved.</p>
              </div>
            </div>
          </div>
        );

      case "scheduled":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               {/* Empty State */}
               <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border/40 rounded-lg">
                 <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                   <CalendarClock className="w-5 h-5 text-muted-foreground" />
                 </div>
                 <h3 className="font-bold text-sm mb-1">No schedules yet</h3>
                 <p className="text-muted-foreground text-xs max-w-xs mb-5">
                   Set up automated searches to get notified when new cars matching your criteria match the market.
                 </p>
                 <button className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90">
                   Create Schedule
                 </button>
               </div>
            </div>
        );

      case "usage":
        return (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-border/40 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-1">No usage data</h3>
                <p className="text-muted-foreground text-xs max-w-xs mb-5">
                  Usage tracking will be available in a future update.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    openPricing();
                  }}
                  className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-lg hover:opacity-90"
                >
                  View plans
                </button>
              </div>
            </div>
        );
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
            className="fixed inset-4 sm:inset-6 md:inset-10 lg:inset-20 z-[201] overflow-hidden flex items-center justify-center pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-2xl h-[58vh] bg-background rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-border/50 font-google-sans-flex">
              
              {/* Sidebar */}
              <div className="w-full md:w-56 lg:w-60 border-b md:border-b-0 md:border-r border-border/30 flex flex-col p-3 sm:p-5 shrink-0">
                <div className="flex items-center justify-between md:mb-6 mb-3">
                   <h2 className="text-base font-bold tracking-tight">Settings</h2>
                   <button 
                     onClick={onClose}
                     className="md:hidden p-1.5 rounded-full hover:bg-foreground/5"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </div>

                <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible no-scrollbar pb-2 md:pb-0">
                  {TABS.map((tab) => {
                     const isActive = activeTab === tab.id;
                     return (
                       <button
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id)}
                         className={cn(
                           "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap",
                           isActive 
                             ? "bg-foreground/10 text-foreground shadow-sm" 
                             : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                         )}
                       >
                         <tab.icon className={cn("w-4 h-4", isActive ? "text-foreground" : "text-muted-foreground")} />
                         {tab.label}
                       </button>
                     );
                  })}
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Desktop Close Button - positioned outside content flow */}
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors hidden md:flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-foreground/60" />
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 pt-10 md:pt-5">
                   <div className="max-w-lg mx-auto md:pr-6">
                      {renderContent()}
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

