import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PRICE_RANGES } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ range: string }>;
}

// Generate static params for all price ranges
export async function generateStaticParams() {
  return PRICE_RANGES.map((range) => ({
    range: range.slug,
  }));
}

function getRangeBySlug(slug: string) {
  return PRICE_RANGES.find((r) => r.slug === slug);
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { range: rangeSlug } = await params;
  const priceRange = getRangeBySlug(rangeSlug);

  if (!priceRange) {
    return {
      title: "Price Range Not Found",
    };
  }

  const title = `Cars ${priceRange.name} | Affordable Cars for Sale | Vehique`;
  const description = `Find the best cars ${priceRange.name.toLowerCase()} with Vehique's AI-powered search. Browse used and new vehicles in your budget, compare prices, verify VINs, and get the best deals.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `cars ${priceRange.name.toLowerCase()}`,
      `used cars ${priceRange.name.toLowerCase()}`,
      `cheap cars for sale`,
      `affordable cars`,
      `budget cars`,
      `best cars ${priceRange.name.toLowerCase()}`,
      `car deals ${priceRange.name.toLowerCase()}`,
      `buy car ${priceRange.name.toLowerCase()}`,
      `AI car search budget`,
    ],
    alternates: {
      canonical: `/cars/price/${priceRange.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/price/${priceRange.slug}`,
      siteName: "Vehique",
      type: "website",
    },
  };
}

export default async function PriceRangePage({ params }: Props) {
  const { range: rangeSlug } = await params;
  const priceRange = getRangeBySlug(rangeSlug);

  if (!priceRange) {
    notFound();
  }

  // Redirect to homepage with pre-filled search for this price range
  redirect(`/?minPrice=${priceRange.min}&maxPrice=${priceRange.max}`);
}

