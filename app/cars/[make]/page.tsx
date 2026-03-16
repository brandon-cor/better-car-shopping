import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CAR_MAKES, CAR_MODELS, getMakeBySlug } from "@/lib/seo/car-data";
import { JsonLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ make: string }>;
}

// Generate static params for all car makes
export async function generateStaticParams() {
  return CAR_MAKES.map((make) => ({
    make: make.slug,
  }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make: makeSlug } = await params;
  const make = getMakeBySlug(makeSlug);
  
  if (!make) {
    return {
      title: "Car Not Found",
    };
  }

  const title = `${make.name} Cars for Sale | AI-Powered ${make.name} Search | Vehique`;
  const description = `Find the best ${make.name} cars for sale with Vehique's AI search. Browse used and new ${make.name} vehicles, compare prices, verify VINs, and get dealer insights. Search ${make.name} models including ${(CAR_MODELS[make.slug] || []).slice(0, 4).map(m => m.name).join(", ")} and more.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `${make.name} cars for sale`,
      `used ${make.name}`,
      `new ${make.name}`,
      `${make.name} dealerships`,
      `buy ${make.name}`,
      `${make.name} prices`,
      `${make.name} reviews`,
      `best ${make.name} models`,
      `${make.name} near me`,
      `AI ${make.name} search`,
    ],
    alternates: {
      canonical: `/cars/${make.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/${make.slug}`,
      siteName: "Vehique",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MakePage({ params }: Props) {
  const { make: makeSlug } = await params;
  const make = getMakeBySlug(makeSlug);

  if (!make) {
    notFound();
  }

  const models = CAR_MODELS[make.slug] || [];

  // JSON-LD structured data for this make
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${make.name} Cars for Sale`,
    description: `Browse all ${make.name} vehicles available through Vehique's AI-powered car search`,
    url: `https://vehique.ai/cars/${make.slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "Vehique",
      url: "https://vehique.ai",
    },
    about: {
      "@type": "Brand",
      name: make.name,
    },
    mainEntity: {
      "@type": "ItemList",
      name: `${make.name} Models`,
      numberOfItems: models.length,
      itemListElement: models.map((model, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${make.name} ${model.name}`,
        url: `https://vehique.ai/cars/${make.slug}/${model.slug}`,
      })),
    },
  };

  // Redirect to homepage with pre-filled search for this make
  // This creates the SEO landing page while using the main search UI
  redirect(`/?make=${make.slug}`);

  // If you want to build out a full page instead of redirect:
  // return (
  //   <>
  //     <JsonLd data={jsonLd} />
  //     <div>Content for {make.name}</div>
  //   </>
  // );
}

