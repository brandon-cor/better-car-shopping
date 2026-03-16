"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import type { FeedbackCategory, FeedbackSentiment } from "@/lib/supabase/types";
import { Loader2 } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<FeedbackCategory>("other");
  const [sentiment, setSentiment] = useState<FeedbackSentiment>(3);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setCategory("other");
    setSentiment(3);
    setMessage("");
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }, [onOpenChange, resetForm]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          sentiment,
          message: message.trim(),
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
          userId: user?.id || null,
          email: user?.emailAddresses?.[0]?.emailAddress || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });
      
      handleClose(false);
    } catch {
      toast({
        title: "Something went wrong",
        description: "We couldn't submit your feedback. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const canSubmit = message.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full h-24 px-3 py-2 rounded-md border border-border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

