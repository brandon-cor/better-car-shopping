import { z } from "zod";

export const marketSchema = z.object({
  price_history: z.array(z.object({
    date: z.string(),
    price: z.number(),
  })).optional(),
  market_value: z.number().optional(),
  price_drops: z.number().optional(),
  comparable_listings: z.array(z.string()).optional(),
  market_days_supply: z.number().optional(),
  average_market_price: z.number().optional(),
  price_trend: z.enum(['increasing', 'decreasing', 'stable']).optional(),
});

export type Market = z.infer<typeof marketSchema>;

