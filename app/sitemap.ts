import { MetadataRoute } from "next";
import { CAR_MAKES, CAR_MODELS, BODY_TYPES, PRICE_RANGES, US_STATES, MAJOR_CITIES, COMPETITOR_SITES } from "@/lib/seo/car-data";

const BASE_URL = "https://vehique.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const sitemap: MetadataRoute.Sitemap = [];

  // Homepage - highest priority
  sitemap.push({
    url: BASE_URL,
    lastModified: now,
    changeFrequency: "daily",
    priority: 1.0,
  });

  // Core pages
  sitemap.push({
    url: `${BASE_URL}/about`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.8,
  });

  sitemap.push({
    url: `${BASE_URL}/legal`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  });

  // Car Make Pages - high priority
  CAR_MAKES.forEach((make) => {
    sitemap.push({
      url: `${BASE_URL}/cars/${make.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: make.popular ? 0.9 : 0.8,
    });

    // Car Model Pages - medium-high priority
    const models = CAR_MODELS[make.slug] || [];
    models.forEach((model) => {
      sitemap.push({
        url: `${BASE_URL}/cars/${make.slug}/${model.slug}`,
        lastModified: now,
        changeFrequency: "daily",
        priority: make.popular ? 0.85 : 0.75,
      });
    });
  });

  // Body Type Pages - medium priority
  BODY_TYPES.forEach((type) => {
    sitemap.push({
      url: `${BASE_URL}/cars/type/${type.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  // Price Range Pages - medium priority
  PRICE_RANGES.forEach((range) => {
    sitemap.push({
      url: `${BASE_URL}/cars/price/${range.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  // Location/State Pages - medium priority
  US_STATES.forEach((state) => {
    sitemap.push({
      url: `${BASE_URL}/cars/location/${state.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  // Major City Pages - high priority (local SEO)
  MAJOR_CITIES.forEach((city) => {
    sitemap.push({
      url: `${BASE_URL}/cars/city/${city.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    });
  });

  // Dealership State Pages - medium-high priority
  US_STATES.forEach((state) => {
    sitemap.push({
      url: `${BASE_URL}/dealerships/${state.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  });

  // Competitor Alternative Pages - high priority (capture comparison traffic)
  COMPETITOR_SITES.forEach((site) => {
    sitemap.push({
      url: `${BASE_URL}/alternative/${site.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  });

  return sitemap;
}

// Enable ISR for sitemap - regenerate every hour
export const revalidate = 3600;

