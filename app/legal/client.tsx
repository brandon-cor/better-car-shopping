"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";

export function LegalClient() {
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
          <h1 className="font-google-sans-flex text-5xl md:text-6xl font-light tracking-tight">
            Legal Information, Terms of Service & Privacy Policy
          </h1>
        </header>
        
        <div className="space-y-20">
          <section id="terms" className="scroll-mt-32">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Terms of Service
            </h2>
            <p className="text-xs text-muted-foreground/60 mb-8">
              Last updated: January 5, 2025
            </p>
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <p>
                By using Vehique, you agree to these terms.
              </p>
              <div>
                <h3 className="font-medium mb-2">Service</h3>
                <p className="text-muted-foreground">
                  Vehique is an AI-powered car search platform that aggregates vehicle 
                  listings from multiple sources. We provide search, analysis, and 
                  recommendation services.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Use</h3>
                <p className="text-muted-foreground">
                  You may use Vehique for personal, non-commercial car search purposes. 
                  Do not misuse our services or access them through unauthorized methods.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Accuracy</h3>
                <p className="text-muted-foreground">
                  Listings, prices, and availability are provided by third parties. 
                  We do not guarantee accuracy. Verify details directly with sellers 
                  before purchasing.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Relationship</h3>
                <p className="text-muted-foreground">
                  Vehique is not a dealer or broker. We do not sell vehicles. 
                  We connect you with sellers and dealerships.
                </p>
              </div>
            </div>
          </section>

          <section id="privacy" className="scroll-mt-32">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Privacy
            </h2>
            <p className="text-xs text-muted-foreground/60 mb-8">
              Last updated: January 5, 2025
            </p>
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <div>
                <h3 className="font-medium mb-2">Collection</h3>
                <p className="text-muted-foreground">
                  We collect search queries, preferences, and usage data to improve our service.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Use</h3>
                <p className="text-muted-foreground">
                  To provide and improve our AI car search, personalize your experience, 
                  analyze usage patterns, and communicate with you.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Security</h3>
                <p className="text-muted-foreground">
                  We implement industry-standard security measures. 
                  We do not sell your personal data.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Analytics</h3>
                <p className="text-muted-foreground">
                  We use Vercel Analytics to understand usage and improve the experience.
                </p>
              </div>
            </div>
          </section>

          <section id="disclaimer" className="scroll-mt-32">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Disclaimer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Vehique provides listing information for informational purposes only. 
              We are not responsible for third-party listing accuracy. Conduct your 
              own due diligence before purchasing any vehicle.
            </p>
          </section>

          <section className="scroll-mt-32">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-8">
              Contact
            </h2>
            <p className="text-muted-foreground">
              <a 
                href="mailto:hello@vehique.ai" 
                className="hover:text-foreground transition-colors"
              >
                hello@vehique.ai
              </a>
            </p>
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

