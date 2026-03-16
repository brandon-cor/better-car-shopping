"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowLeft, Lock, Mail, LogIn } from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Footer } from "@/components/layout/footer";
import { TRANSLATIONS, US_POPULAR_LANGUAGES } from "@/lib/constants/translations";
import { useState } from "react";

interface RestrictedClientProps {
  reason?: string;
  redirectPath?: string;
}

export function RestrictedClient({ reason, redirectPath }: RestrictedClientProps) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [language, setLanguage] = useState("en");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const handleBack = () => {
    router.push("/blog");
  };

  // Determine message based on reason
  const getMessage = () => {
    switch (reason) {
      case "auth":
        return {
          title: "This story is private",
          subtitle: "Sign in to check if you have access",
          showSignIn: true,
        };
      case "access":
        return {
          title: "You don't have access to this content",
          subtitle: "This article is available to a limited audience. If you believe you should have access, please reach out.",
          showSignIn: false,
        };
      case "private":
        return {
          title: "Content not available",
          subtitle: "This page is not publicly accessible.",
          showSignIn: false,
        };
      default:
        return {
          title: "This content has moved on",
          subtitle: "The article you're looking for is no longer publicly available. Some stories are meant for a smaller audience.",
          showSignIn: !isSignedIn,
        };
    }
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-background font-google-sans-flex selection:bg-foreground selection:text-background flex flex-col">
      <PublicHeader />
      
      <main className="flex-1 flex items-center justify-center px-6 py-32">
        <div className="max-w-lg w-full text-center">
          {/* Lock icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
            className="relative mx-auto mb-10"
          >
            <div className="relative w-28 h-28 mx-auto rounded-3xl bg-gradient-to-br from-foreground/5 to-foreground/[0.02] border border-border/30 flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-12 h-12 text-foreground/40" strokeWidth={1.5} />
            </div>
          </motion.div>
          
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-light tracking-tight mb-4"
          >
            {message.title}
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground/70 leading-relaxed mb-10 max-w-md mx-auto"
          >
            {message.subtitle}
          </motion.p>
          
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Sign in button (if applicable) */}
            {message.showSignIn && (
              <SignInButton 
                mode="modal" 
                forceRedirectUrl={redirectPath || "/blog"}
              >
                <button className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background font-medium text-sm transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]">
                  <LogIn className="w-4 h-4" />
                  Sign in to continue
                </button>
              </SignInButton>
            )}
            
            {/* Back to blog */}
            <button
              onClick={handleBack}
              className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground/5 hover:bg-foreground/10 font-medium text-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to blog
            </button>
          </motion.div>
          
          {/* Contact section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-border/20"
          >
            <p className="text-sm text-muted-foreground/50 mb-4">
              Think you should have access?
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              <Link
                href="mailto:hello@vehique.ai?subject=Blog Access Request"
                className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>hello@vehique.ai</span>
              </Link>
            </div>
          </motion.div>
          
          {/* Decorative gradient */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/5 via-transparent to-transparent blur-3xl opacity-50" />
          </div>
        </div>
      </main>
      
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

