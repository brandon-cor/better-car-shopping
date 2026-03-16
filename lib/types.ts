import { CarListing, DetailedListing } from "./schema";

export type Call = {
  id: string;
  createdAt: string;
  status: string;
  type?: string;
  summary?: string;
  listingTitle?: string;
  dealerName?: string;
  listingImage?: string;
  listingId?: string;
  listingPrice?: string;
  listingLocation?: string;
  // Call metrics
  startedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  endedReason?: string;
  // Call outcome
  cost?: number;
  transcript?: string;
};

export type DisplayListing = {
  id: string;
  title: string;
  price: string;
  location: string;
  dealer: string;
  phone?: string;
  image?: string;
  miles?: number;
  distance?: number;
  bodyType?: string;
  fuelType?: string;
  vdpUrl?: string;
  raw: CarListing;
};

export function mapCarListing(listing: CarListing): DisplayListing {
  const price = listing.price ? `$${listing.price.toLocaleString()}` : "Contact for price";
  const location = [listing.dealer?.city, listing.dealer?.state].filter(Boolean).join(", ") || "Unknown";
  return {
    id: listing.id,
    title: listing.heading || "Vehicle",
    price,
    location,
    dealer: listing.dealer?.name || "Dealer",
    phone: listing.dealer?.phone,
    image: listing.media?.photo_links?.[0],
    miles: listing.miles,
    distance: listing.dist,
    bodyType: listing.body_type,
    fuelType: listing.fuel_type,
    vdpUrl: listing.vdp_url,
    raw: listing,
  };
}

export function formatPrice(price?: number | null): string {
  if (!price) return "Contact for price";
  return `$${price.toLocaleString()}`;
}

export function formatLocation(dealer?: { city?: string; state?: string; street?: string; zip?: string }): string {
  if (!dealer) return "Unknown";
  const parts = [dealer.city, dealer.state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown";
}
