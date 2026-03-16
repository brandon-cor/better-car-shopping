import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MAJOR_CITIES, getCityBySlug } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ city: string }>;
}

// Generate static params for all major cities
export async function generateStaticParams() {
  return MAJOR_CITIES.map((city) => ({
    city: city.slug,
  }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    return {
      title: "City Not Found",
    };
  }

  const title = `Cars for Sale in ${city.name}, ${city.state} | ${city.metro} Car Dealerships | Vehique`;
  const description = `Find the best cars for sale in ${city.name}, ${city.state} with Vehique's AI-powered search. Browse ${city.metro} car dealerships, compare prices, check vehicle history, and find trusted dealers. Search used cars, new cars, SUVs, trucks, and more in ${city.name}.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `cars for sale in ${city.name}`,
      `${city.name} car dealerships`,
      `used cars ${city.name} ${city.state}`,
      `new cars ${city.name}`,
      `car dealers in ${city.name}`,
      `${city.name} auto dealers`,
      `buy car ${city.name}`,
      `${city.metro} car sales`,
      `cars near ${city.name}`,
      `${city.name} car prices`,
      `cheap cars ${city.name}`,
      `best car deals ${city.name}`,
      `${city.name} used car lots`,
      `${city.state} car dealerships`,
      `AI car search ${city.name}`,
    ],
    alternates: {
      canonical: `/cars/city/${city.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/cars/city/${city.slug}`,
      siteName: "Vehique",
      type: "website",
    },
    other: {
      "geo.region": `US-${city.state}`,
      "geo.placename": city.name,
    },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  // Redirect to homepage with pre-filled search for this city
  redirect(`/?city=${city.slug}`);
}

