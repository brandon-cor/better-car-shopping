import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CAR_MAKES, CAR_MODELS, getMakeBySlug, getModelBySlug } from "@/lib/seo/car-data";
import { JsonLd } from "@/components/seo/json-ld";

interface Props {
  params: Promise<{ make: string; model: string }>;
}

// Generate static params for all car make/model combinations
export async function generateStaticParams() {
  const params: { make: string; model: string }[] = [];
  
  CAR_MAKES.forEach((make) => {
    const models = CAR_MODELS[make.slug] || [];
    models.forEach((model) => {
      params.push({
        make: make.slug,
        model: model.slug,
      });
    });
  });
  
  return params;
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { make: makeSlug, model: modelSlug } = await params;
  const make = getMakeBySlug(makeSlug);
  const model = getModelBySlug(makeSlug, modelSlug);
  
  if (!make || !model) {
    return {
      title: "Car Not Found",
    };
  }

  const fullName = `${make.name} ${model.name}`;
  const title = `${fullName} for Sale | Find Best ${fullName} Deals | Vehique`;
  const description = `Search ${fullName} cars for sale with AI-powered Vehique. Compare ${fullName} prices, check vehicle history, read reviews, and find the best deals on new and used ${fullName} ${model.type}s near you.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `${fullName} for sale`,
      `used ${fullName}`,
      `new ${fullName}`,
      `${fullName} price`,
      `${fullName} review`,
      `${fullName} specs`,
      `buy ${fullName}`,
      `${fullName} deals`,
      `${fullName} near me`,
      `${make.name} ${model.name} ${new Date().getFullYear()}`,
      `${make.name} ${model.name} ${new Date().getFullYear() - 1}`,
      `best ${fullName}`,
      `${fullName} ${model.type}`,
      `AI search ${fullName}`,
    ],
    alternates: {
      canonical: `/cars/${make.slug}/${model.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/${make.slug}/${model.slug}`,
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

export default async function ModelPage({ params }: Props) {
  const { make: makeSlug, model: modelSlug } = await params;
  const make = getMakeBySlug(makeSlug);
  const model = getModelBySlug(makeSlug, modelSlug);

  if (!make || !model) {
    notFound();
  }

  const fullName = `${make.name} ${model.name}`;

  // JSON-LD structured data for this model
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: fullName,
    description: `Find the best ${fullName} deals with Vehique's AI-powered car search`,
    brand: {
      "@type": "Brand",
      name: make.name,
    },
    category: model.type,
    url: `https://vehique.ai/cars/${make.slug}/${model.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      offerCount: "1000+",
      lowPrice: "5000",
      highPrice: "150000",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "100",
    },
  };

  // Redirect to homepage with pre-filled search for this make/model
  redirect(`/?make=${make.slug}&model=${model.slug}`);

  // If you want to build out a full page instead of redirect:
  // return (
  //   <>
  //     <JsonLd data={jsonLd} />
  //     <div>Content for {fullName}</div>
  //   </>
  // );
}

