import type { Metadata, Viewport } from "next";
import { DM_Sans, Patrick_Hand } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/components/providers/swr-provider";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { PricingProvider } from "@/components/pricing";
import { SettingsProvider } from "@/components/settings";
import { DataSyncProvider } from "@/components/providers/data-sync-provider";
import { FeedbackProvider } from "@/components/feedback";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import { HomePageJsonLd } from "@/components/seo/json-ld";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-patrick",
});

const googleSansFlex = localFont({
  src: "./fonts/Google Sans Flex/static/GoogleSansFlex_24pt-Light.ttf",
  weight: "300",
  style: "normal",
  variable: "--font-google-sans-flex",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://vehique.ai"),
  alternates: {
    canonical: "/",
  },
  title: {
    default: "Vehique | Your AI operating system for car shopping and research",
    template: "%s | Vehique",
  },
  description:
    "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
  keywords: [
    // Primary AI + Car Keywords
    "AI car search",
    "AI car finder",
    "AI vehicle search",
    "AI auto search",
    "AI car buying",
    "AI car shopping",
    "artificial intelligence car search",
    "machine learning car finder",
    "smart car search",
    "intelligent car search",
    "AI powered car search",
    "AI driven vehicle finder",
    "automated car search",
    "AI car hunting",
    "AI car discovery",
    
    // Car Search Variations
    "car search engine",
    "vehicle search engine",
    "auto search engine",
    "car finder",
    "vehicle finder",
    "auto finder",
    "car lookup",
    "vehicle lookup",
    "find my car",
    "find cars near me",
    "car search app",
    "best car search",
    "advanced car search",
    "smart vehicle search",
    
    // Used Car Keywords
    "used car search",
    "used car finder",
    "used vehicle search",
    "pre-owned car search",
    "second hand car finder",
    "certified pre-owned search",
    "used car listings",
    "used car marketplace",
    "buy used cars",
    "used car deals",
    "cheap used cars",
    "affordable used cars",
    "used car prices",
    
    // New Car Keywords
    "new car search",
    "new car finder",
    "new vehicle search",
    "new car deals",
    "new car prices",
    "new car listings",
    "buy new car",
    "new car marketplace",
    
    // Car Buying Process
    "car buying assistant",
    "car buying guide",
    "car buying help",
    "how to buy a car",
    "car purchase assistant",
    "auto buying guide",
    "vehicle buying tips",
    "car shopping assistant",
    "car shopping guide",
    "car negotiation help",
    "car deal finder",
    "best car deals",
    
    // VIN & Research
    "VIN decoder",
    "VIN lookup",
    "VIN check",
    "VIN search",
    "vehicle history",
    "car history check",
    "vehicle research",
    "car research tool",
    "car comparison tool",
    "compare cars",
    "compare vehicles",
    
    // Dealer & Marketplace
    "car marketplace",
    "auto marketplace",
    "vehicle marketplace",
    "car listings",
    "auto listings",
    "dealer search",
    "dealer finder",
    "car dealer near me",
    "auto dealer search",
    "dealer reputation",
    "dealer reviews",
    
    // Price & Value
    "car price prediction",
    "car price analysis",
    "car value estimator",
    "vehicle price check",
    "fair car price",
    "car market value",
    "auto price comparison",
    "car price tracker",
    
    // Alternatives to Car Listing Sites & Marketplaces
    "Carvana alternative",
    "CarGurus alternative",
    "Autotrader alternative",
    "Cars.com alternative",
    "TrueCar alternative",
    "Edmunds alternative",
    "KBB alternative",
    "Kelley Blue Book alternative",
    "CarMax alternative",
    "Vroom alternative",
    "eBay Motors alternative",
    "Facebook Marketplace cars alternative",
    "Craigslist cars alternative",
    "Bring a Trailer alternative",
    "Hemmings alternative",
    "AutoTempest alternative",
    "CarsDirect alternative",
    "NADA Guides alternative",
    "iSeeCars alternative",
    "Carfax alternative",
    "AutoCheck alternative",
    "Shift alternative",
    "Clutch alternative",
    "Tred alternative",
    "CarLotz alternative",
    "Peddle alternative",
    "CarBrain alternative",
    "Driveway alternative",
    "AcceleRide alternative",
    "better than Carvana",
    "better than CarGurus",
    "better than Autotrader",
    "better than CarMax",
    "better than Vroom",
    "like Carvana but better",
    "like CarGurus but smarter",
    "sites like Autotrader",
    "sites like CarGurus",
    "sites like Carvana",
    "apps like Carvana",
    "car buying sites like Carvana",
    
    // Car Aggregator & Listing Sites (for discovery)
    "car listing aggregator",
    "car listing site",
    "car marketplace aggregator",
    "all car listings in one place",
    "search all car sites",
    "multi-site car search",
    "car listing comparison",
    "compare car listing sites",
    "best car listing website",
    "top car search websites",
    "car search aggregator",
    "vehicle listing aggregator",
    
    // Dealership Keywords
    "car dealership search",
    "dealership finder",
    "find car dealerships",
    "auto dealerships near me",
    "car dealers near me",
    "used car dealerships",
    "new car dealerships",
    "dealership reviews",
    "dealership ratings",
    "trusted car dealers",
    "best car dealerships",
    "local car dealerships",
    "dealership inventory search",
    "dealer inventory",
    "dealership comparison",
    "find dealers selling",
    "which dealers have",
    "certified dealer search",
    "franchise dealer search",
    "independent dealer search",
    
    // Near Me / Local SEO Keywords
    "cars for sale near me",
    "used cars near me",
    "new cars near me",
    "car dealerships near me",
    "auto dealers near me",
    "buy car near me",
    "car lots near me",
    "vehicles for sale near me",
    "cheap cars near me",
    "cars in my area",
    "local car sales",
    "cars for sale in my city",
    "nearby car dealers",
    "closest car dealership",
    "car shopping near me",
    "auto sales near me",
    "SUVs near me",
    "trucks near me",
    "sedans near me",
    "electric cars near me",
    "hybrid cars near me",
    "luxury cars near me",
    
    // Technology Keywords
    "automotive AI",
    "car tech",
    "auto technology",
    "car automation",
    "vehicle AI",
    "car search automation",
    "AI car agent",
    "car search bot",
    "automated car buying",
    
    // Action Keywords
    "buy car online",
    "search cars online",
    "find car online",
    "car search online",
    "online car shopping",
    "digital car buying",
    "car e-commerce",
    
    // Long-tail Keywords
    "best AI tool to find cars",
    "AI that finds cars for you",
    "automated car search tool",
    "car search with AI",
    "find best car deals AI",
    "AI car price negotiation",
    "smart car buying assistant",
    "AI vehicle recommendation",
    "personalized car search",
    "custom car finder",
    
    // AI Assistant & LLM Discovery Keywords
    "ask AI to find a car",
    "ChatGPT car search",
    "AI car recommendation",
    "ask ChatGPT for car advice",
    "Gemini car search",
    "Claude car search",
    "Perplexity car search",
    "AI car buying advice",
    "LLM car search",
    "conversational car search",
    "natural language car search",
    "talk to AI about cars",
    "AI car consultant",
    "virtual car shopping assistant",
    "AI-powered car advisor",
    "chatbot car search",
    "AI car concierge",
    "GPT car finder",
    "AI car expert",
    "machine learning car recommendations",
    
    // Voice Search & Conversational
    "find me a car",
    "help me find a car",
    "what car should I buy",
    "best car for me",
    "recommend a car",
    "suggest a car",
    "I need a car",
    "looking for a car",
    "searching for a vehicle",
    "find me a good deal on a car",
    "where can I find cars",
    "how to find cheap cars",
    "where to buy used cars",
    "best place to buy a car",
    "easiest way to find a car",
    
    // Specific Use Case Keywords
    "family car finder",
    "commuter car search",
    "first car finder",
    "reliable car search",
    "fuel efficient car finder",
    "low mileage cars",
    "one owner cars",
    "no accident cars",
    "clean title cars",
    "salvage title cars",
    "certified pre-owned finder",
    "lease deals finder",
    "car financing search",
    "zero down car deals",
    "bad credit car search",
    
    // Comparison Keywords
    "compare car prices",
    "compare car deals",
    "compare dealerships",
    "car price comparison tool",
    "side by side car comparison",
    "which car is better",
    "car vs car comparison",
    "best value car",
    "best car for the money",
    "most reliable used cars",
    "cars with best resale value",
    
    // Review & Research Keywords  
    "car reviews AI",
    "AI car ratings",
    "unbiased car reviews",
    "honest car reviews",
    "car reliability ratings",
    "car safety ratings search",
    "consumer car reviews",
    "expert car recommendations",
    "car buying research tool",
  ],
  authors: [{ name: "Vehique", url: "https://vehique.ai" }],
  creator: "Vehique",
  publisher: "Vehique",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vehique.ai",
    siteName: "Vehique",
    title: "Vehique | Your AI operating system for car shopping and research",
    description:
      "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    images: [
      {
        url: "/Logo.png",
        width: 1024,
        height: 1024,
        alt: "Vehique - AI Car Search Autopilot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vehique | Your AI operating system for car shopping and research",
    description:
      "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    images: ["/Logo.png"],
    creator: "@vehique",
    site: "@vehique",
  },
  category: "Automotive",
  classification: "Automotive Technology",
  applicationName: "Vehique",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vehique",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          rootBox: "w-full",
          card: "shadow-none",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${googleSansFlex.variable} ${patrickHand.variable}`}>
        <head>
          {/* Preconnect hints for performance */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
          <link rel="preconnect" href="https://vitals.vercel-insights.com" />
          
          {/* Search Engine Verification */}
          <meta name="google-site-verification" content="8xbl-w9lgzM7PycgrAOyCR5cG9VnshoSv96rhZ1KH6E" />
          <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
          <meta name="yandex-verification" content="YOUR_YANDEX_VERIFICATION_CODE" />
          
          {/* Additional SEO Meta Tags */}
          <meta name="rating" content="General" />
          <meta name="distribution" content="global" />
          <meta name="revisit-after" content="1 days" />
          <meta name="geo.region" content="US" />
          <meta name="geo.placename" content="United States" />
          <meta name="language" content="English" />
          <meta name="coverage" content="Worldwide" />
          <meta name="target" content="all" />
          <meta name="HandheldFriendly" content="True" />
          <meta name="MobileOptimized" content="320" />
          
          <HomePageJsonLd />
        </head>
        <body suppressHydrationWarning className="font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div suppressHydrationWarning>
              <SWRProvider>
                <PreferencesProvider>
                  <PricingProvider>
                    <SettingsProvider>
                      <FeedbackProvider>
                        <DataSyncProvider>
                          <SmoothScroll />
                          {children}
                          <Toaster />
                          <Analytics />
                          <SpeedInsights />
                        </DataSyncProvider>
                      </FeedbackProvider>
                    </SettingsProvider>
                  </PricingProvider>
                </PreferencesProvider>
              </SWRProvider>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
