import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { COMPETITOR_SITES, getCompetitorBySlug } from "@/lib/seo/car-data";

interface Props {
  params: Promise<{ site: string }>;
}

// Generate static params for all competitor sites
export async function generateStaticParams() {
  return COMPETITOR_SITES.map((site) => ({
    site: site.slug,
  }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { site: siteSlug } = await params;
  const competitor = getCompetitorBySlug(siteSlug);

  if (!competitor) {
    return {
      title: "Page Not Found",
    };
  }

  const title = `${competitor.name} Alternative | Better AI-Powered Car Search | Vehique`;
  const description = `Looking for a ${competitor.name} alternative? Try Vehique - the AI-powered car search that's smarter than ${competitor.name}. We scan 2M+ listings, verify VINs automatically, analyze dealer reputation, and help you negotiate better deals. See why users switch from ${competitor.name} to Vehique.`;

  return {
    title,
    description,
    robots: {
      index: true,
      follow: true,
    },
    keywords: [
      `${competitor.name} alternative`,
      `better than ${competitor.name}`,
      `${competitor.name} vs Vehique`,
      `sites like ${competitor.name}`,
      `apps like ${competitor.name}`,
      `${competitor.name} competitor`,
      `${competitor.name} replacement`,
      `instead of ${competitor.name}`,
      `switch from ${competitor.name}`,
      `${competitor.name} problems`,
      `${competitor.name} issues`,
      `AI car search`,
      `best car search site`,
      `smarter car search`,
    ],
    alternates: {
      canonical: `/alternative/${competitor.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://vehique.ai/alternative/${competitor.slug}`,
      siteName: "Vehique",
      type: "website",
    },
  };
}

export default async function AlternativePage({ params }: Props) {
  const { site: siteSlug } = await params;
  const competitor = getCompetitorBySlug(siteSlug);

  if (!competitor) {
    notFound();
  }

  // Redirect to homepage - the SEO value is in the metadata
  redirect(`/?ref=${competitor.slug}-alternative`);
}

