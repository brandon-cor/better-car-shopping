import { z } from "zod";

// Helper for coercing string to number (external APIs often return numbers as strings)
const coercedNumber = z.preprocess(
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

// Helper for optional URL that accepts empty strings or invalid URLs gracefully
const optionalUrl = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return undefined;
    // Check if it's a valid URL, otherwise return undefined
    try {
      new URL(val);
      return val;
    } catch {
      return undefined;
    }
  },
  z.string().url().optional()
);

// Helper for optional email that accepts empty strings gracefully
const optionalEmail = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'string' || val.trim() === '') return undefined;
    return val;
  },
  z.string().email().optional()
);

export const dealerSchema = z.object({
  id: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().optional()
  ),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: optionalEmail,
  website: optionalUrl,
  city: z.string().optional(),
  state: z.string().optional(),
  street: z.string().optional(),
  zip: z.string().optional(),
  latitude: coercedNumber,
  longitude: coercedNumber,
  rating: coercedNumber,
  review_count: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().optional()
  ),
  certified: z.boolean().optional(),
  franchise: z.boolean().optional(),
  hours: z.object({
    monday: z.string().optional(),
    tuesday: z.string().optional(),
    wednesday: z.string().optional(),
    thursday: z.string().optional(),
    friday: z.string().optional(),
    saturday: z.string().optional(),
    sunday: z.string().optional(),
  }).optional(),
}).passthrough();

export type Dealer = z.infer<typeof dealerSchema>;

