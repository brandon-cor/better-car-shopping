import { z } from "zod";

export const mediaSchema = z.object({
  photo_links: z.array(z.string()).optional(),
  video_links: z.array(z.string()).optional(),
  interior_photos: z.array(z.string()).optional(),
  exterior_photos: z.array(z.string()).optional(),
  panoramic_views: z.array(z.string()).optional(),
  photo_count: z.number().optional(),
});

export type Media = z.infer<typeof mediaSchema>;

