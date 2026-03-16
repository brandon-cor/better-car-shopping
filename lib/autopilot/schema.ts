/**
 * Vehique Autopilot - Yutori Output Schema
 * 
 * This schema defines the structured output format that Yutori's scouts
 * will use when discovering vehicle listings. It ensures we get consistent,
 * parseable data from the web monitoring.
 */

/**
 * JSON Schema for vehicle listing output from Yutori scouts.
 * This is sent to Yutori when creating a scout to ensure structured responses.
 */
export const VEHICLE_OUTPUT_SCHEMA = {
  type: "json" as const,
  json_schema: {
    type: "object",
    properties: {
      vehicles: {
        type: "array",
        description: "List of vehicle listings discovered that match the search criteria",
        items: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Vehicle title in format: Year Make Model Trim (e.g., '2023 Toyota Camry XLE')"
            },
            price: {
              type: "string",
              description: "Listed price with currency symbol (e.g., '$32,500' or 'Call for Price')"
            },
            miles: {
              type: "number",
              description: "Odometer reading in miles"
            },
            location: {
              type: "string",
              description: "Dealer location in format: City, State (e.g., 'San Francisco, CA')"
            },
            dealer: {
              type: "string",
              description: "Dealership name"
            },
            phone: {
              type: "string",
              description: "Dealer phone number"
            },
            url: {
              type: "string",
              description: "Direct URL to the vehicle listing page"
            },
            image: {
              type: "string",
              description: "URL of the primary vehicle image"
            },
            body_type: {
              type: "string",
              description: "Vehicle body type (e.g., 'SUV', 'Sedan', 'Truck', 'Coupe')"
            },
            fuel_type: {
              type: "string",
              description: "Fuel type (e.g., 'Gasoline', 'Electric', 'Hybrid', 'Diesel')"
            },
            exterior_color: {
              type: "string",
              description: "Exterior color of the vehicle"
            },
            interior_color: {
              type: "string",
              description: "Interior color of the vehicle"
            },
            transmission: {
              type: "string",
              description: "Transmission type (e.g., 'Automatic', 'Manual', 'CVT')"
            },
            drivetrain: {
              type: "string",
              description: "Drivetrain configuration (e.g., 'FWD', 'RWD', 'AWD', '4WD')"
            },
            engine: {
              type: "string",
              description: "Engine description (e.g., '2.5L 4-Cylinder')"
            },
            vin: {
              type: "string",
              description: "Vehicle Identification Number (17 characters)"
            },
            days_on_market: {
              type: "number",
              description: "Number of days the listing has been active"
            },
            price_change: {
              type: "object",
              description: "Price change information if the price was recently modified",
              properties: {
                previous: {
                  type: "string",
                  description: "Previous price"
                },
                current: {
                  type: "string",
                  description: "Current price"
                },
                direction: {
                  type: "string",
                  enum: ["up", "down"],
                  description: "Direction of price change"
                }
              }
            }
          },
          required: ["title", "price", "url"]
        }
      },
      summary: {
        type: "string",
        description: "Brief summary of what was found (e.g., 'Found 5 SUVs under $35k in the SF Bay Area')"
      },
      total_found: {
        type: "number",
        description: "Total number of matching vehicles found"
      },
      search_sources: {
        type: "array",
        description: "List of websites/sources that were searched",
        items: {
          type: "string"
        }
      }
    },
    required: ["vehicles"]
  }
};

/**
 * Builds the query string for Yutori based on user input.
 * Enhances the natural language query with specific instructions for car searching.
 */
export function buildScoutQuery(userQuery: string, userLocation?: string): string {
  const locationContext = userLocation ? ` near ${userLocation}` : "";
  
  return `Search for vehicles matching: "${userQuery}"${locationContext}.

Look for car listings on major automotive marketplaces including:
- Autotrader
- Cars.com
- CarGurus
- Carvana
- Vroom
- Local dealer websites

For each vehicle found, extract:
- Full vehicle title (Year Make Model Trim)
- Listed price
- Mileage
- Dealer name and location
- Direct link to the listing
- Vehicle image URL
- Key specs (body type, fuel type, color, transmission)
- VIN if available
- Any recent price changes

Focus on currently available listings only. Prioritize verified dealers and certified pre-owned when possible.`;
}

/**
 * Maps interval type to seconds for Yutori API.
 */
export function intervalToSeconds(interval: "hourly" | "daily" | "custom", customSeconds?: number): number {
  switch (interval) {
    case "hourly":
      return 3600; // 1 hour
    case "daily":
      return 86400; // 24 hours
    case "custom":
      // Minimum 30 minutes (1800 seconds) as per Yutori API
      return Math.max(customSeconds || 3600, 1800);
    default:
      return 86400;
  }
}

/**
 * Formats interval for display.
 */
export function formatInterval(intervalSeconds: number): string {
  if (intervalSeconds <= 3600) {
    return "Every hour";
  } else if (intervalSeconds <= 7200) {
    return "Every 2 hours";
  } else if (intervalSeconds <= 14400) {
    return "Every 4 hours";
  } else if (intervalSeconds <= 43200) {
    return "Every 12 hours";
  } else if (intervalSeconds <= 86400) {
    return "Daily";
  } else {
    const days = Math.round(intervalSeconds / 86400);
    return `Every ${days} days`;
  }
}

