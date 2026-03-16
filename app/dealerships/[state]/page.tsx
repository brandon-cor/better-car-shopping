import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { US_STATES } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ state: string }>;
}

function getStateBySlug(slug: string) {
  return US_STATES.find((s) => s.slug === slug);
}

// Generate static params for all US states
export async function generateStaticParams() {
  return US_STATES.map((state) => ({
    state: state.slug,
  }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    return {
      title: "State Not Found",
    };
  }

  const title = `Car Dealerships in ${state.name} | ${state.abbr} Auto Dealers | Vehique`;
  const description = `Find the best car dealerships in ${state.name} with Vehique's AI-powered search. Browse trusted ${state.abbr} auto dealers, compare inventory, read reviews, and find the best deals on new and used cars in ${state.name}.`;

  return {
    title,
    description,
    keywords: [
      `car dealerships in ${state.name}`,
      `${state.abbr} car dealers`,
      `${state.name} auto dealers`,
      `used car dealers ${state.name}`,
      `new car dealers ${state.name}`,
      `${state.name} dealership reviews`,
      `best car dealers ${state.abbr}`,
      `trusted dealers ${state.name}`,
      `car lots ${state.name}`,
      `auto sales ${state.name}`,
      `dealerships near me ${state.abbr}`,
      `${state.name} dealer inventory`,
      `buy car from dealer ${state.name}`,
    ],
    alternates: {
      canonical: `/dealerships/${state.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/dealerships/${state.slug}`,
      siteName: "Vehique",
      type: "website",
    },
    other: {
      "geo.region": `US-${state.abbr}`,
      "geo.placename": state.name,
    },
  };
}

export default async function DealershipStatePage({ params }: Props) {
  const { state: stateSlug } = await params;
  const state = getStateBySlug(stateSlug);

  if (!state) {
    notFound();
  }

  // Redirect to homepage with pre-filled search for dealerships in this state
  redirect(`/?dealerships=${state.slug}`);
}

