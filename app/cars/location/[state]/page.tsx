import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { US_STATES } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ state: string }>;
}

// Generate static params for all US states
export async function generateStaticParams() {
  return US_STATES.map((state) => ({
    state: state.slug,
  }));
}

function getStateBySlug(slug: string) {
  return US_STATES.find((s) => s.slug === slug);
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    return {
      title: "Location Not Found",
    };
  }

  const title = `Cars for Sale in ${state.name} | AI Car Search ${state.abbr} | Vehique`;
  const description = `Find the best cars for sale in ${state.name} with Vehique's AI-powered search. Browse used and new vehicles in ${state.abbr}, compare prices, verify VINs, and connect with trusted ${state.name} dealers.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `cars for sale in ${state.name}`,
      `used cars ${state.name}`,
      `new cars ${state.name}`,
      `${state.abbr} car dealers`,
      `buy car ${state.name}`,
      `${state.name} auto dealers`,
      `cars near me ${state.abbr}`,
      `${state.name} car prices`,
      `cheap cars ${state.name}`,
      `AI car search ${state.name}`,
    ],
    alternates: {
      canonical: `/cars/location/${state.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/location/${state.slug}`,
      siteName: "Vehique",
      type: "website",
    },
    other: {
      "geo.region": `US-${state.abbr}`,
      "geo.placename": state.name,
    },
  };
}

export default async function StatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  // Redirect to homepage with pre-filled search for this location
  redirect(`/?location=${state.slug}`);
}

