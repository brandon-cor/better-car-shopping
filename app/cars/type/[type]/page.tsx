import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BODY_TYPES } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ type: string }>;
}

// Generate static params for all body types
export async function generateStaticParams() {
  return BODY_TYPES.map((type) => ({
    type: type.slug,
  }));
}

function getTypeBySlug(slug: string) {
  return BODY_TYPES.find((t) => t.slug === slug);
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: typeSlug } = await params;
  const bodyType = getTypeBySlug(typeSlug);

  if (!bodyType) {
    return {
      title: "Category Not Found",
    };
  }

  const title = `${bodyType.name}s for Sale | AI-Powered ${bodyType.name} Search | Vehique`;
  const description = `Find the best ${bodyType.name.toLowerCase()}s for sale with Vehique's AI car search. ${bodyType.description}. Compare prices, verify VINs, and get the best deals on new and used ${bodyType.name.toLowerCase()}s.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `${bodyType.name}s for sale`,
      `used ${bodyType.name}s`,
      `new ${bodyType.name}s`,
      `best ${bodyType.name}s`,
      `${bodyType.name} deals`,
      `buy ${bodyType.name}`,
      `${bodyType.name} prices`,
      `${bodyType.name} near me`,
      `AI ${bodyType.name} search`,
      `cheap ${bodyType.name}s`,
      `affordable ${bodyType.name}s`,
    ],
    alternates: {
      canonical: `/cars/type/${bodyType.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/type/${bodyType.slug}`,
      siteName: "Vehique",
      type: "website",
    },
  };
}

export default async function TypePage({ params }: Props) {
  const { type: typeSlug } = await params;
  const bodyType = getTypeBySlug(typeSlug);

  if (!bodyType) {
    notFound();
  }

  // Redirect to homepage with pre-filled search for this body type
  redirect(`/?type=${bodyType.slug}`);
}

