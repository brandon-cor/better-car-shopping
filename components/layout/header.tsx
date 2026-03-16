"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { Settings, LogOut, MessageCircle, Compass } from "lucide-react";
import Link from "next/link";
import { PersonalizationDropdown, UserPreferences } from "./personalization-dropdown";
import { useUser, SignInButton, SignUpButton, SignOutButton } from "@clerk/nextjs";
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
import { useFeedback } from "@/components/feedback";

const IconlyLight = {
  Home: ({ className }: { className?: string }) => (
    <svg viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-84v-120q-60-12-102-54t-54-102H164q12 109 89.5 185T440-164Zm80 0q109-12 186.5-89.5T796-440H676q-12 60-54 102t-102 54v120ZM164-520h116l120-120h160l120 120h116q-15-121-105-200.5T480-800q-121 0-211 79.5T164-520Z" />
    </svg>
  ),
  Heart: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.62 20.81c-.34.12-.9.12-1.24 0C8.48 19.82 2 15.69 2 8.69 2 5.6 4.5 3.1 7.59 3.1c1.82 0 3.43.88 4.41 2.23a5.41 5.41 0 014.41-2.23c3.09 0 5.59 2.5 5.59 5.59 0 7-6.48 11.13-11.39 12.12z" />
    </svg>
  ),
  AI: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.65 19.1l-2.03-3.92a1.02 1.02 0 00-.91-.56H8.38a1.02 1.02 0 00-.91.56l-2.03 3.92a2.01 2.01 0 00.17 2.14 1.99 1.99 0 001.62.86h9.52c.67 0 1.3-.34 1.62-.86a2.01 2.01 0 00.17-2.14zM16.51 14.54l1.39-3.92a1.02 1.02 0 00-.23-1.04 1.02 1.02 0 00-.94-.28l-4.14.73a1.02 1.02 0 01-.36 0l-4.14-.73a1.02 1.02 0 00-.94.28 1.02 1.02 0 00-.23 1.04l1.39 3.92M12 2v4M5 5l2.12 2.12M19 5l-2.12 2.12" />
    </svg>
  ),
  Call: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21.97 18.33a2.54 2.54 0 01-.25 1.09 2.6 2.6 0 01-.92.92 4.6 4.6 0 01-1.27.51c-.6.16-1.36.29-2.24.3-4.13.06-8.21-3.32-9.66-4.77C6.18 14.93 2.8 10.85 2.86 6.72c.01-.88.14-1.64.3-2.24.16-.6.33-.94.51-1.27.18-.33.43-.64.92-.92.36-.21.72-.25 1.09-.25h2.9c.5 0 .93.34 1.02.82.12.58.26 1.15.43 1.71.12.42.02.88-.27 1.22L8.3 7.46a.54.54 0 00-.11.53c.27 1.15.82 2.36 1.63 3.51.81 1.15 1.75 2.15 2.76 2.92a.54.54 0 00.51.05l2.1-.88c.36-.15.77-.12 1.11.07.67.38 1.36.7 2.07.96.44.16.73.58.73 1.05v2.74z" />
    </svg>
  ),
  Flash: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6.09 13.28h3.09v7.2c0 1.03 1.22 1.57 1.98.87l7.46-6.93a1 1 0 00-.68-1.73h-3.09V5.49c0-1.03-1.22-1.57-1.98-.87l-7.46 6.93a1 1 0 00.68 1.73z" />
    </svg>
  ),
  History: ({ className }: { className?: string }) => (
    <svg viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M610-760q-21 0-35.5-14.5T560-810q0-21 14.5-35.5T610-860q21 0 35.5 14.5T660-810q0 21-14.5 35.5T610-760Zm0 660q-21 0-35.5-14.5T560-150q0-21 14.5-35.5T610-200q21 0 35.5 14.5T660-150q0 21-14.5 35.5T610-100Zm160-520q-21 0-35.5-14.5T720-670q0-21 14.5-35.5T770-720q21 0 35.5 14.5T820-670q0 21-14.5 35.5T770-620Zm0 380q-21 0-35.5-14.5T720-290q0-21 14.5-35.5T770-340q21 0 35.5 14.5T820-290q0 21-14.5 35.5T770-240Zm60-190q-21 0-35.5-14.5T780-480q0-21 14.5-35.5T830-530q21 0 35.5 14.5T880-480q0 21-14.5 35.5T830-430ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880v80q-134 0-227 93t-93 227q0 134 93 227t227 93v80Zm132-212L440-464v-216h80v184l148 148-56 56Z" />
    </svg>
  ),
  Plus: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  ),
  Sidebar: ({ className }: { className?: string }) => (
    <svg viewBox="0 -960 960 960" fill="currentColor" className={className}>
      <path d="M660-320v-320L500-480l160 160ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm120-80v-560H200v560h120Zm80 0h360v-560H400v560Zm-80 0H200h120Z" />
    </svg>
  ),
};

const TABS = [
  { id: "Results", icon: IconlyLight.Home },
  { id: "Showroom", icon: IconlyLight.Heart },
  { id: "Research Agents", icon: IconlyLight.AI },
  { id: "Autopilot", icon: IconlyLight.Flash },
  { id: "Dealer Connect", icon: IconlyLight.Call },
];

interface TopHeaderProps {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  onLogoClick?: () => void;
  onPreferencesChange?: (preferences: UserPreferences) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  filterSortSlot?: ReactNode;
  onHistoryClick?: () => void;
  onNewChat?: () => void;
  isHistoryOpen?: boolean;
}

export function TopHeader({ isSidebarVisible, onToggleSidebar, onLogoClick, onPreferencesChange, activeTab = "Results", onTabChange, filterSortSlot, onHistoryClick, onNewChat, isHistoryOpen }: TopHeaderProps) {
  const { isSignedIn, user } = useUser();
  const { openPricing } = usePricing();
  const { openSettings } = useSettings();
  const { openFeedback } = useFeedback();
  
  // Render tabs component - reused in both layouts
  const renderTabs = (isInline: boolean) => {
    return TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      // Use shorter labels on smaller screens
      const shortLabel = tab.id === "Research Agents" ? "Comparison" :
                         tab.id === "Dealer Connect" ? "Dealers" :
                         tab.id === "Autopilot" ? "Scouts" : tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => {
            onTabChange?.(tab.id);
          }}
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 ${isInline ? 'min-[1400px]:px-3' : 'lg:px-4'} py-2 sm:py-2.5 text-[11px] sm:text-xs ${isInline ? 'min-[1400px]:text-[13px]' : 'lg:text-[13px]'} font-bold transition-all duration-200 relative group shrink-0 ${
            isInline 
              ? isActive 
                ? "text-foreground" 
                : "text-foreground/70 hover:text-foreground"
              : isActive 
                ? "text-foreground border-b-2 border-foreground" 
                : "text-foreground/70 hover:text-foreground border-b-2 border-transparent hover:border-foreground/20"
          }`}
        >
          <tab.icon
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${isActive ? "scale-110 stroke-[2.5px]" : "group-hover:scale-110 stroke-[2px]"}`}
          />
          <span className="whitespace-nowrap font-extrabold">{shortLabel}</span>
          {/* Inline underline indicator for xl+ */}
          {isInline && isActive && (
            <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-foreground rounded-full" />
          )}
        </button>
      );
    });
  };

  return (
    <header className="border-b border-border/10 bg-background/80 backdrop-blur-md shrink-0 z-50 transition-all duration-300">
      {/* Main header row */}
      <div className="flex items-center">
        {/* Left section - Logo and sidebar controls */}
        <div className={`flex items-center justify-between px-3 sm:px-4 lg:pl-8 lg:pr-3 py-2 sm:py-2.5 shrink-0 transition-all duration-300 lg:border-r lg:border-border/10 ${
          isSidebarVisible ? "w-auto lg:w-[420px]" : "w-auto lg:w-[420px]"
        }`}>
          {/* Logo */}
          <Link 
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-auto lg:mr-0"
            onClick={onLogoClick}
          >
            <Image
              src="/vehique-transparent-2025.png"
              alt="Vehique"
              width={28}
              height={28}
              className="dark:invert w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
              priority
            />
            <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-tight">Vehique</h1>
          </Link>

          {/* Desktop Chat controls - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-1">
            <button 
              onClick={onHistoryClick}
              className={`p-1.5 rounded-md transition-colors group ${
                isHistoryOpen 
                  ? "text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Chat History"
            >
              <IconlyLight.History className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
            
            <button 
              onClick={onNewChat}
              className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground group"
              title="New Chat"
            >
              <IconlyLight.Plus className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
            
            <button 
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md transition-colors text-muted-foreground hover:text-foreground group"
              title={isSidebarVisible ? "Hide Sidebar" : "Show Sidebar"}
            >
              <IconlyLight.Sidebar className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Center section - Tabs inline only when there's enough space (1400px+) */}
        <div className="hidden min-[1400px]:flex items-center gap-0.5 px-4 overflow-x-auto no-scrollbar">
          {renderTabs(true)}
        </div>

        {/* Right section - User controls */}
        <div className="flex-1 flex items-center justify-end px-3 sm:px-4 lg:pr-6 py-2 sm:py-2.5 gap-1.5 sm:gap-2">
          {/* Filter & Sort slot - visible on md+ */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {filterSortSlot}
            {filterSortSlot && <div className="h-4 w-[1px] bg-border/30 mx-1" />}
          </div>
          
          <PersonalizationDropdown onPreferencesChange={onPreferencesChange} />
          
          {isSignedIn ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-foreground/5 transition-all duration-300 ease-custom">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-primary border border-border/40 overflow-hidden flex items-center justify-center transition-transform duration-300 ease-custom hover:scale-105">
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
                  </button>
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
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="text-xs font-bold h-7 px-3">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="text-xs font-bold h-7 px-3">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs - Second row, visible when not enough space for inline (below 1400px) */}
      <div className="flex min-[1400px]:hidden items-center border-t border-border/5 px-2 sm:px-3 lg:px-6 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {renderTabs(false)}
        </div>
        
        {/* Mobile Filter/Sort - shown on smaller screens */}
        <div className="flex md:hidden items-center gap-1 ml-auto pl-2 shrink-0">
          {filterSortSlot}
        </div>
      </div>
    </header>
  );
}

