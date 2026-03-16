"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { PricingModal } from "./pricing-modal";

interface PricingContextType {
  openPricing: () => void;
  closePricing: () => void;
  isOpen: boolean;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export function PricingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPricing = () => setIsOpen(true);
  const closePricing = () => setIsOpen(false);

  return (
    <PricingContext.Provider value={{ openPricing, closePricing, isOpen }}>
      {children}
      <PricingModal isOpen={isOpen} onClose={closePricing} />
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (context === undefined) {
    throw new Error("usePricing must be used within a PricingProvider");
  }
  return context;
}

