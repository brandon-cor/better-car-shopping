"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, Phone, Bot, Zap, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type LimitFeature = "SEARCH" | "CALL" | "SCOUT_CREATE";

interface UpgradeLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: LimitFeature;
  limit?: number;
  resetTime?: number;
}

function formatTimeUntilReset(resetTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const secondsRemaining = resetTimestamp - now;
  
  if (secondsRemaining <= 0) return "any moment now";
  
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
}

const FEATURE_CONFIG: Record<LimitFeature, {
  title: string;
  description: string;
  features: Array<{ icon: React.ReactNode; text: string }>;
}> = {
  SEARCH: {
    title: "Daily search limit reached",
    description: "You've used all your searches for today. Upgrade to get more searches and unlock premium features.",
    features: [
      { icon: <Search className="w-4 h-4 text-primary" />, text: "Unlimited AI Market Scans" },
      { icon: <Zap className="w-4 h-4 text-primary" />, text: "Priority search results" },
      { icon: <Sparkles className="w-4 h-4 text-primary" />, text: "Advanced filters & insights" },
    ],
  },
  CALL: {
    title: "Daily call limit reached",
    description: "You've used all your dealer calls for today. Upgrade to make more calls and unlock negotiation features.",
    features: [
      { icon: <Phone className="w-4 h-4 text-primary" />, text: "Unlimited AI dealer calls" },
      { icon: <Sparkles className="w-4 h-4 text-primary" />, text: "Smart negotiation assistance" },
      { icon: <Clock className="w-4 h-4 text-primary" />, text: "Priority call scheduling" },
    ],
  },
  SCOUT_CREATE: {
    title: "Daily scout limit reached",
    description: "You've deployed your scout for today. Upgrade to deploy more scouts and monitor multiple searches.",
    features: [
      { icon: <Bot className="w-4 h-4 text-primary" />, text: "Deploy unlimited scouts" },
      { icon: <Zap className="w-4 h-4 text-primary" />, text: "Faster market monitoring" },
      { icon: <Sparkles className="w-4 h-4 text-primary" />, text: "Priority notifications" },
    ],
  },
};

export function UpgradeLimitModal({ 
  isOpen, 
  onClose, 
  feature, 
  resetTime 
}: UpgradeLimitModalProps) {
  const config = FEATURE_CONFIG[feature];
  const { toast } = useToast();

  const handleUpgradeClick = () => {
    toast({
      title: "🍳 We're cooking!",
      description: "This feature is coming soon. Stay tuned!",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md font-google-sans-flex border-border/60 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-[900] tracking-tighter text-foreground">
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-base font-medium text-muted-foreground/80 leading-relaxed">
            {config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-6">
          <div className="space-y-4">
            {config.features.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3.5 group">
                <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {feat.icon}
                </div>
                <span className="text-sm font-bold text-foreground/90 tracking-wide">{feat.text}</span>
              </div>
            ))}
          </div>
          
          {resetTime && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Resets in {formatTimeUntilReset(resetTime)}
              </p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-start flex-col sm:flex-row gap-3 sm:gap-2">
          <Button 
            onClick={handleUpgradeClick}
            className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            Upgrade
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:flex-1 h-11 rounded-xl text-sm font-black uppercase tracking-widest border-border/40 hover:bg-foreground/5 hover:text-foreground hover:border-foreground/20 text-muted-foreground transition-all"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
