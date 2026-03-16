import { z } from "zod";

export const safetySchema = z.object({
  recalls: z.array(z.object({
    id: z.string(),
    description: z.string(),
    date: z.string(),
    status: z.string(),
  })).optional(),
  nhtsa_ratings: z.object({
    overall: z.number().optional(),
    frontal_crash: z.number().optional(),
    side_crash: z.number().optional(),
    rollover: z.number().optional(),
  }).optional(),
  crash_test_scores: z.object({
    overall: z.number().optional(),
    front_driver: z.number().optional(),
    front_passenger: z.number().optional(),
    side_driver: z.number().optional(),
    side_passenger: z.number().optional(),
  }).optional(),
});

export type Safety = z.infer<typeof safetySchema>;

