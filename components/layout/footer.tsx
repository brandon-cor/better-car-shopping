"use client";

import Image from "next/image";
import { Monitor, Sun, Moon, Globe, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { ImageDissolveLite } from "@/components/landing/image-dissolve";
import { useToast } from "@/hooks/use-toast";

interface FooterProps {
  language: string;
  setLanguage: (lang: string) => void;
  isLangOpen: boolean;
  setIsLangOpen: (open: boolean) => void;
  languages: { code: string; name: string }[];
  t: any;
}

export function Footer({ language, setLanguage, isLangOpen, setIsLangOpen, languages, t }: FooterProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  const showCookingToast = () => {
    toast({
      title: "🍳 We're cooking!",
      description: "This feature is coming soon. Stay tuned!",
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="relative py-24 border-t border-border/10 overflow-hidden">
      {/* Background Image with Dissolve - Consistent with Hero */}
      <div className="absolute inset-0 z-0 opacity-40 grayscale-[20%]">
        <ImageDissolveLite
          src="/Pure Coastal Scene.png"
          alt="Footer Background"
          className="w-full h-full"
          variant="cool"
          dissolveHeight={0}
          objectPosition="center 75%"
        />
        {/* Gradient overlay for text readability and smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/60" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="bg-background/30 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 sm:p-12 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2.5">
              <Image
                src="/vehique-transparent-2025.png"
                alt="Vehique"
                width={22}
                height={22}
                className="dark:invert"
              />
              <p className="font-google-sans-flex text-lg text-foreground/70 flex items-baseline gap-1">
                <span className="text-sm">©</span>
                <span>2026 Vehique</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle Strip */}
              <div className="flex items-center bg-background/50 border border-white/10 rounded-full p-1 shadow-sm backdrop-blur-sm">
                {[
                  { id: 'system', icon: <Monitor className="w-3 h-3" /> },
                  { id: 'light', icon: <Sun className="w-3 h-3" /> },
                  { id: 'dark', icon: <Moon className="w-3 h-3" /> }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={showCookingToast}
                    className={`p-1.5 rounded-full transition-all ${
                      mounted && theme === t.id 
                        ? "bg-foreground text-background shadow-sm" 
                        : "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100"
                    }`}
                    title={`${t.id.charAt(0).toUpperCase() + t.id.slice(1)} Mode`}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-foreground/70 cursor-pointer hover:bg-background/70 transition-all backdrop-blur-sm"
                >
                  <Globe className="w-3 h-3" /> 
                  {languages.find(l => l.code === language)?.name || "English"} 
                  <ChevronRight className={`w-3 h-3 transition-transform ${isLangOpen ? "-rotate-90" : "rotate-90"}`} />
                </div>

                {isLangOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-40 bg-background/90 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 backdrop-blur-xl">
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                          language === lang.code 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        }`}
                      >
                        {lang.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
