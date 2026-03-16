"use client";

import { useState } from "react";
import { 
  Calculator,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronDown
} from "lucide-react";
import { DetailedListing } from "@/lib/schema";
import { formatPrice } from "@/lib/types";

interface QuickFactsProps {
  listing: DetailedListing;
}

export function QuickFacts({ listing }: QuickFactsProps) {
  const price = listing.price || 0;
  
  // State for interactive calculation
  const [term, setTerm] = useState(72);
  const [apr, setApr] = useState(6.9);
  const [downPercent, setDownPercent] = useState(10);
  
  const downPayment = price * (downPercent / 100);
  const principal = price - downPayment;
  const monthlyRate = (apr / 100) / 12;
  
  const monthlyPayment = principal > 0 
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)
    : 0;

  return (
    <div className="bg-card/70 backdrop-blur-sm border border-border/30 rounded-2xl p-3 shadow-sm shadow-foreground/5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Calculator className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Financing Estimate
          </h3>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="text-center py-3 bg-primary/5 rounded-xl border border-primary/10 transition-all">
          <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mb-1">Monthly Payment</p>
          <p className="text-3xl font-black text-primary tracking-tighter">
            ${Math.round(monthlyPayment).toLocaleString()}
            <span className="text-sm ml-1 font-medium">/mo</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1">
          {/* Down Payment Picker */}
          <div className="flex items-center justify-between py-2 border-b border-border/5">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-medium">
              <DollarSign className="w-3 h-3" />
              Down Payment
            </div>
            <select 
              value={downPercent}
              onChange={(e) => setDownPercent(Number(e.target.value))}
              className="bg-transparent text-[11px] font-bold text-foreground cursor-pointer outline-none hover:text-primary transition-colors text-right dir-rtl"
            >
              {[0, 5, 10, 15, 20, 25].map((p) => (
                <option key={p} value={p} className="bg-background">{p}% ({formatPrice(price * (p/100))})</option>
              ))}
            </select>
          </div>

          {/* APR Picker */}
          <div className="flex items-center justify-between py-2 border-b border-border/5">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-medium">
              <TrendingUp className="w-3 h-3" />
              Interest (APR)
            </div>
            <select 
              value={apr}
              onChange={(e) => setApr(Number(e.target.value))}
              className="bg-transparent text-[11px] font-bold text-emerald-600 cursor-pointer outline-none hover:text-primary transition-colors text-right dir-rtl"
            >
              {[3.9, 4.9, 5.9, 6.9, 7.9, 8.9, 9.9].map((rate) => (
                <option key={rate} value={rate} className="bg-background">{rate}% APR</option>
              ))}
            </select>
          </div>

          {/* Term Picker */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-medium">
              <Clock className="w-3 h-3" />
              Loan Term
            </div>
            <select 
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
              className="bg-transparent text-[11px] font-bold text-foreground cursor-pointer outline-none hover:text-primary transition-colors text-right dir-rtl"
            >
              {[36, 48, 60, 72, 84].map((m) => (
                <option key={m} value={m} className="bg-background">{m} Months</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-muted/30 p-2 rounded-lg">
          <p className="text-[8px] text-muted-foreground leading-relaxed text-center">
            Change values above to recalculate. Actual terms subject to credit approval and dealer verification.
          </p>
        </div>
      </div>
    </div>
  );
}
