import { z } from "zod";
import { dealerSchema } from "./schemas/dealer-schema";
import { mediaSchema } from "./schemas/media-schema";
import { buildSchema } from "./schemas/build-schema";
import { marketSchema } from "./schemas/market-schema";
import { safetySchema } from "./schemas/safety-schema";

// Helper for optional URL that accepts empty strings or invalid URLs gracefully
const optionalUrl = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return undefined;
    try {
      new URL(val);
      return val;
    } catch {
      return undefined;
    }
  },
  z.string().url().optional()
);

// Helper for coercing string to number (external APIs often return numbers as strings)
const coercedNumberField = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  z.number().optional()
);

export const carListingSchema = z.object({
  id: z.string(),
  vin: z.string().optional(),
  heading: z.string().optional(), // Made optional - MarketCheck sometimes returns undefined
  price: coercedNumberField.nullable(),
  msrp: coercedNumberField.nullable(),
  vdp_url: optionalUrl,
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  year: coercedNumberField,
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  body_type: z.string().optional(),
  miles: coercedNumberField,
  fuel_type: z.string().optional(),
  dealer: dealerSchema.partial().optional(),
  dist: coercedNumberField,
  media: mediaSchema.partial().optional(),
}).passthrough();

// Helper for optional coerced numbers that handles empty strings
const optionalCoercedNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.coerce.number().optional()
);

export const searchParamsSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: optionalCoercedNumber,
  year_min: optionalCoercedNumber,
  year_max: optionalCoercedNumber,
  price_min: optionalCoercedNumber,
  price_max: optionalCoercedNumber,
  exterior_color: z.string().optional(),
  zip: z.string().optional(),
  latitude: optionalCoercedNumber,
  longitude: optionalCoercedNumber,
  radius: optionalCoercedNumber,
  rows: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 20 : val),
    z.coerce.number().default(20)
  ),
  start: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? 0 : val),
    z.coerce.number().default(0)
  ),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const searchResponseSchema = z.object({
  num_found: z.number(),
  listings: z.array(carListingSchema),
});

// High value feature schema (from extra.high_value_features)
const highValueFeatureSchema = z.object({
  category: z.string(),
  description: z.string(),
  type: z.string().optional(), // "Standard" or "Optional"
});

// Extra data schema
const extraSchema = z.object({
  high_value_features: z.array(highValueFeatureSchema).optional(),
  options_packages: z.array(z.string()).optional(),
}).passthrough();

export const detailedListingSchema = carListingSchema.extend({
  // Basic vehicle info (some from build, normalized to root)
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  engine: z.string().optional(),
  stock_no: z.string().optional(),
  inventory_type: z.string().optional(),
  
  // Days on market metrics
  dom: coercedNumberField,
  dom_180: coercedNumberField,
  dom_active: coercedNumberField,
  dos_active: coercedNumberField,
  
  // Seller info
  seller_type: z.string().optional(),
  source: z.string().optional(),
  in_transit: z.boolean().optional(),
  
  // Title/History flags
  carfax_1_owner: z.boolean().optional(),
  carfax_clean_title: z.boolean().optional(),
  daysonmarket: coercedNumberField,
  
  // Timestamps
  scraped_at: z.union([z.string(), z.number()]).optional(),
  scraped_at_date: z.string().optional(),
  last_seen_at: z.union([z.string(), z.number()]).optional(),
  last_seen_at_date: z.string().optional(),
  first_seen_at: z.union([z.string(), z.number()]).optional(),
  first_seen_at_date: z.string().optional(),
  first_seen_at_mc: z.union([z.string(), z.number()]).optional(),
  first_seen_at_mc_date: z.string().optional(),
  first_seen_at_source: z.union([z.string(), z.number()]).optional(),
  first_seen_at_source_date: z.string().optional(),
  
  // Price history
  ref_price: coercedNumberField,
  ref_price_dt: coercedNumberField,
  price_change_percent: coercedNumberField,
  ref_miles: coercedNumberField,
  ref_miles_dt: coercedNumberField,
  
  // Colors
  base_ext_color: z.string().optional(),
  base_int_color: z.string().optional(),
  
  // Build specs (comprehensive vehicle data)
  build: buildSchema.optional(),
  
  // Extra data with high value features
  extra: extraSchema.optional(),
  
  // Features organized by category
  features: z.object({
    packages: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
    safety_features: z.array(z.string()).optional(),
    tech_features: z.array(z.string()).optional(),
    comfort_features: z.array(z.string()).optional(),
    convenience_features: z.array(z.string()).optional(),
  }).optional(),
  
  // Market analytics
  market: marketSchema.partial().optional(),
  
  // Vehicle history
  history: z.object({
    accident_count: z.number().optional(),
    service_records: z.number().optional(),
    ownership_history: z.array(z.object({
      owner: z.number(),
      start_date: z.string(),
      end_date: z.string().optional(),
    })).optional(),
    title_history: z.array(z.string()).optional(),
  }).optional(),
  
  // Safety ratings
  safety: safetySchema.partial().optional(),
  
  // Warranty info
  warranty: z.object({
    remaining_warranty: z.object({
      months: z.number().optional(),
      miles: z.number().optional(),
      expires: z.string().optional(),
    }).optional(),
    extended_options: z.array(z.object({
      name: z.string(),
      price: z.number(),
      coverage: z.string(),
    })).optional(),
  }).optional(),
  
  // Financial info
  financial: z.object({
    financing_available: z.boolean().optional(),
    incentives: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      type: z.string(),
    })).optional(),
    trade_in_value: z.number().optional(),
    estimated_monthly_payment: z.number().optional(),
  }).optional(),
  
  // Text content
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  warranty_info: z.string().optional(),
  disclaimer: z.string().optional(),
  
  // MC dealership (duplicate dealer info with more fields)
  mc_dealership: z.object({
    mc_website_id: z.number().optional(),
    mc_dealer_id: z.number().optional(),
    mc_location_id: z.number().optional(),
    mc_rooftop_id: z.number().optional(),
    mc_category: z.string().optional(),
    website: z.string().optional(),
    name: z.string().optional(),
    dealer_type: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    zip: z.string().optional(),
    msa_code: z.string().optional(),
    phone: z.string().optional(),
    seller_email: z.string().optional(),
  }).optional(),
}).passthrough();

export type CarListing = z.infer<typeof carListingSchema>;
export type DetailedListing = z.infer<typeof detailedListingSchema>;
export type SearchParams = z.infer<typeof searchParamsSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
