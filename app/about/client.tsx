"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";

export function AboutClient() {
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const [isLangOpen, setIsLangOpen] = useState(false);

  useEffect(() => {
    // Force scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  return (
    <div className="min-h-screen bg-background font-google-sans-flex selection:bg-foreground selection:text-background">
      <PublicHeader />

      <div className="container mx-auto max-w-3xl px-6 pt-32 pb-24">
        <a 
          href="/" 
          onClick={handleBack}
          className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
        >
          Back
        </a>

        <header className="mt-16 mb-20">
          <h1 className="font-google-sans-flex text-5xl md:text-6xl font-light tracking-tight mb-6">
            About
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl">
            Vehique is an AI-Assisted car shopping and research platform. Describe what you want, 
            and our agents find it across 2 million listings.
          </p>
        </header>

        <div className="space-y-24">
          <section>
            <p className="text-lg leading-relaxed text-foreground/80">
              Traditional car search is broken. You visit a dozen websites, scroll 
              through thousands of listings, manually check VINs, research dealers, 
              and still wonder if you got a good deal.
            </p>
            <p className="text-lg leading-relaxed text-foreground/80 mt-6">
              We built Vehique to fix this. Tell us what you're looking for in plain 
              language. Our AI handles the rest.
            </p>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              What we do
            </h2>
            <div className="space-y-6">
              <div className="pb-6 border-b border-border/50">
                <h3 className="text-lg font-medium mb-2">Search</h3>
                <p className="text-muted-foreground">
                  AI agents scan 2 million+ listings across Carvana, CarGurus, 
                  Autotrader, Cars.com, and other major platforms.
                </p>
              </div>
              <div className="pb-6 border-b border-border/50">
                <h3 className="text-lg font-medium mb-2">Verify</h3>
                <p className="text-muted-foreground">
                  Automatic VIN decoding reveals vehicle history, accidents, 
                  ownership records, and recalls.
                </p>
              </div>
              <div className="pb-6 border-b border-border/50">
                <h3 className="text-lg font-medium mb-2">Analyze</h3>
                <p className="text-muted-foreground">
                  Dealer reputation scoring and price intelligence identify 
                  good deals and trusted sellers.
                </p>
              </div>
              <div className="pb-6 border-b border-border/50">
                <h3 className="text-lg font-medium mb-2">Negotiate</h3>
                <p className="text-muted-foreground">
                  Data-backed insights help you negotiate the best price.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Contact
            </h2>
            <div className="space-y-3 text-foreground/80">
              <p>
                <a 
                  href="mailto:hello@vehique.ai" 
                  className="hover:text-foreground transition-colors"
                >
                  hello@vehique.ai
                </a>
              </p>
              <p>
                <a 
                  href="https://twitter.com/vehiqueAI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </p>
              <p>
                <a 
                  href="https://www.linkedin.com/company/vehique/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer 
        language={language}
        setLanguage={setLanguage}
        isLangOpen={isLangOpen}
        setIsLangOpen={setIsLangOpen}
        languages={US_POPULAR_LANGUAGES}
        t={t}
      />
    </div>
  );
}

