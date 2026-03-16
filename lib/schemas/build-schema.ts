import { z } from "zod";

// Helper for coercing strings to numbers (API returns some numbers as strings)
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

const coercedInt = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  },
  z.number().optional()
);

export const buildSchema = z.object({
  // Basic Info
  year: coercedInt,
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  version: z.string().optional(),
  body_type: z.string().optional(),
  vehicle_type: z.string().optional(),
  
  // Powertrain
  transmission: z.string().optional(),
  drivetrain: z.string().optional(),
  fuel_type: z.string().optional(),
  powertrain_type: z.string().optional(),
  
  // Engine specs - match actual API field names
  engine: z.string().optional(),
  engine_size: coercedNumber,
  engine_block: z.string().optional(),
  cylinders: coercedInt,
  made_in: z.string().optional(),
  
  // Dimensions - API returns these as strings
  overall_height: z.string().optional(),
  overall_length: z.string().optional(),
  overall_width: z.string().optional(),
  wheelbase: z.string().optional(),
  ground_clearance: z.string().optional(),
  
  // Capacity
  std_seating: z.string().optional(),
  doors: coercedInt,
  cargo_capacity: z.string().optional(),
  fuel_tank_capacity: z.string().optional(),
  
  // Weight
  curb_weight: z.string().optional(),
  gross_weight: z.string().optional(),
  towing_capacity: z.string().optional(),
  payload_capacity: z.string().optional(),
  
  // Fuel Economy - API uses highway_mpg/city_mpg
  highway_mpg: coercedNumber,
  city_mpg: coercedNumber,
  combined_mpg: coercedNumber,
  
  // Additional specs
  horsepower: coercedNumber,
  torque: coercedNumber,
  top_speed: coercedNumber,
  acceleration_0_60: coercedNumber,
}).passthrough();

export type Build = z.infer<typeof buildSchema>;
