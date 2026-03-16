"use client";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Organization Schema
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vehique",
    url: "https://vehique.ai",
    logo: "https://vehique.ai/Logo.png",
    description:
      "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    sameAs: [
      "https://twitter.com/vehiqueAI",
      "https://www.linkedin.com/company/vehique/",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@vehique.ai",
      availableLanguage: ["English"],
    },
  };

  return <JsonLd data={data} />;
}

// WebSite Schema with SearchAction
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Vehique",
    url: "https://vehique.ai",
    description:
      "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://vehique.ai/?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Vehique",
      logo: {
        "@type": "ImageObject",
        url: "https://vehique.ai/Logo.png",
      },
    },
  };

  return <JsonLd data={data} />;
}

// SoftwareApplication Schema
export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Vehique",
    applicationCategory: "AutomotiveApplication",
    operatingSystem: "Web",
    description:
      "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    url: "https://vehique.ai",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
    featureList: [
      "AI-powered vehicle search",
      "VIN verification",
      "Dealer reputation analysis",
      "Automated negotiation",
      "Market price analysis",
    ],
  };

  return <JsonLd data={data} />;
}

// FAQ Schema for Featured Snippets
export function FAQJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Vehique?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehique is an AI-powered car search autopilot that scans over 2 million vehicle listings, verifies VINs, analyzes dealer reputation, and can even negotiate on your behalf. It's the smartest way to find your perfect car.",
        },
      },
      {
        "@type": "Question",
        name: "How does AI car search work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehique's AI agents continuously scan major car marketplaces, analyze listings for the best deals, verify vehicle history through VIN decoding, evaluate dealer trustworthiness, and present you with personalized recommendations based on your preferences.",
        },
      },
      {
        "@type": "Question",
        name: "Is Vehique better than traditional car search sites?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Unlike traditional sites like CarGurus, Autotrader, or Cars.com where you manually search and filter, Vehique's AI does the work for you. It finds deals you might miss, verifies vehicle history automatically, and can negotiate prices on your behalf.",
        },
      },
      {
        "@type": "Question",
        name: "How many car listings does Vehique search?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehique scans over 2,000,000 vehicle listings across multiple marketplaces to find the best matches for your criteria, updated in real-time.",
        },
      },
      {
        "@type": "Question",
        name: "Can Vehique help me negotiate car prices?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Vehique's AI can analyze market prices, identify negotiation opportunities, and provide guidance or even negotiate directly with dealers on your behalf to get you the best possible price.",
        },
      },
      {
        "@type": "Question",
        name: "What is VIN verification?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "VIN (Vehicle Identification Number) verification decodes the unique 17-character identifier of each vehicle to reveal its full history, including accidents, ownership records, recalls, and more. Vehique automatically verifies VINs for all listings.",
        },
      },
      {
        "@type": "Question",
        name: "Is Vehique free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehique offers a free tier with basic AI car search features. Premium features like unlimited searches, advanced negotiation assistance, and priority access are available through paid plans.",
        },
      },
      {
        "@type": "Question",
        name: "What types of cars can I find on Vehique?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Vehique searches for all types of vehicles including new cars, used cars, certified pre-owned vehicles, SUVs, trucks, sedans, electric vehicles, hybrids, and luxury cars from dealerships and private sellers.",
        },
      },
    ],
  };

  return <JsonLd data={data} />;
}

// BreadcrumbList Schema
export function BreadcrumbJsonLd({ items }: { items?: { name: string; url: string }[] }) {
  const defaultItems = [
    { name: "Home", url: "https://vehique.ai" },
  ];
  
  const breadcrumbItems = items || defaultItems;
  
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

// ItemList Schema for car categories
export function CarCategoriesJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Car Search Categories",
    description: "Browse vehicles by category on Vehique",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Used Cars",
        url: "https://vehique.ai/?category=used",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "New Cars",
        url: "https://vehique.ai/?category=new",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Electric Vehicles",
        url: "https://vehique.ai/?category=electric",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "SUVs & Trucks",
        url: "https://vehique.ai/?category=suv-truck",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Luxury Cars",
        url: "https://vehique.ai/?category=luxury",
      },
    ],
  };

  return <JsonLd data={data} />;
}

// Service Schema
export function ServiceJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "AI Car Search Service",
    provider: {
      "@type": "Organization",
      name: "Vehique",
      url: "https://vehique.ai",
    },
    description: "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    serviceType: "Car Search and Buying Assistance",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Vehique Services",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "AI Car Search",
            description: "Intelligent search across 2M+ listings",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "VIN Verification",
            description: "Automatic vehicle history verification",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Price Negotiation",
            description: "AI-assisted price negotiation with dealers",
          },
        },
      ],
    },
  };

  return <JsonLd data={data} />;
}

// HowTo Schema for featured snippets
export function HowToJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Find Your Perfect Car with AI",
    description: "Step-by-step guide to using Vehique's AI car search to find your ideal vehicle",
    totalTime: "PT5M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Describe Your Ideal Car",
        text: "Tell Vehique what you're looking for in natural language. Our AI understands preferences like 'reliable family SUV under $35k' or 'sporty electric car with long range'.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "AI Searches Millions of Listings",
        text: "Vehique's AI agents scan over 2 million listings across multiple marketplaces to find vehicles matching your criteria.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Review Verified Results",
        text: "Get a curated list of vehicles with verified VINs, dealer reputation scores, and price analysis compared to market value.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Negotiate and Purchase",
        text: "Use Vehique's AI negotiation assistance to get the best price, then connect directly with the dealer to complete your purchase.",
      },
    ],
  };

  return <JsonLd data={data} />;
}

// AI Assistant Knowledge Base Schema
export function AIKnowledgeJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Vehique - AI Car Search Platform",
    description: "Vehique is your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    url: "https://vehique.ai",
    isAccessibleForFree: true,
    audience: {
      "@type": "Audience",
      audienceType: "Car Buyers",
    },
    specialty: [
      "AI-powered car search",
      "Vehicle discovery",
      "VIN verification",
      "Dealer reputation analysis",
      "Price negotiation assistance",
      "Natural language search",
      "Multi-platform aggregation",
    ],
    significantLinks: [
      "https://vehique.ai/llms.txt",
      "https://vehique.ai/.well-known/ai-plugin.json",
    ],
    mainContentOfPage: {
      "@type": "WebPageElement",
      description: "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".hero-text", ".main-description"],
    },
  };

  return <JsonLd data={data} />;
}

// Comparison Schema for competitor alternatives
export function ComparisonJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Car Search Platform Comparison",
    description: "Compare Vehique with other car search platforms",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Product",
          name: "Vehique",
          description: "The AI operating system for car buying. Deep research across 2M+ listings, autopilot that finds deals while you sleep, and AI agents that call dealers for you.",
          brand: { "@type": "Brand", name: "Vehique" },
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            ratingCount: "450",
            bestRating: "5",
            worstRating: "1",
          },
          additionalProperty: [
            { "@type": "PropertyValue", name: "AI Search", value: "Yes" },
            { "@type": "PropertyValue", name: "VIN Verification", value: "Automatic" },
            { "@type": "PropertyValue", name: "Negotiation Help", value: "Yes" },
            { "@type": "PropertyValue", name: "Multi-Platform", value: "Yes" },
          ],
        },
      },
    ],
  };

  return <JsonLd data={data} />;
}

// LocalBusiness Schema for local SEO
export function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://vehique.ai",
    name: "Vehique",
    description: "AI-powered car search platform serving all 50 US states",
    url: "https://vehique.ai",
    logo: "https://vehique.ai/Logo.png",
    image: "https://vehique.ai/Logo.png",
    priceRange: "Free - Premium",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    serviceType: "Car Search Service",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Car Search Services",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "Used Cars",
        },
        {
          "@type": "OfferCatalog", 
          name: "New Cars",
        },
        {
          "@type": "OfferCatalog",
          name: "Certified Pre-Owned",
        },
      ],
    },
  };

  return <JsonLd data={data} />;
}

// Video Object Schema (for future video content)
export function VideoGuideJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How AI Helps You Find the Perfect Car",
    description: "Learn how Vehique's AI technology revolutionizes car shopping by scanning millions of listings and finding the best deals automatically.",
    step: [
      {
        "@type": "HowToStep",
        name: "Natural Language Search",
        text: "Simply describe what you want: 'reliable SUV under $30k with good fuel economy'",
      },
      {
        "@type": "HowToStep",
        name: "AI Analysis",
        text: "Our AI scans 2M+ listings, verifies VINs, and checks dealer reputation",
      },
      {
        "@type": "HowToStep",
        name: "Smart Recommendations",
        text: "Get personalized matches ranked by value, reliability, and deal quality",
      },
      {
        "@type": "HowToStep",
        name: "Assisted Negotiation",
        text: "AI helps you negotiate the best price with data-backed insights",
      },
    ],
  };

  return <JsonLd data={data} />;
}

// Combined structured data for the homepage
export function HomePageJsonLd() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd />
      <BreadcrumbJsonLd />
      <CarCategoriesJsonLd />
      <ServiceJsonLd />
      <HowToJsonLd />
      <AIKnowledgeJsonLd />
      <ComparisonJsonLd />
      <LocalBusinessJsonLd />
    </>
  );
}

