"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FeedbackModal } from "./feedback-modal";

interface FeedbackContextValue {
  openFeedback: () => void;
  closeFeedback: () => void;
  isOpen: boolean;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openFeedback = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <FeedbackContext.Provider value={{ openFeedback, closeFeedback, isOpen }}>
      {children}
      <FeedbackModal open={isOpen} onOpenChange={setIsOpen} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}


