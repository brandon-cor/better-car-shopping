import { NextResponse } from "next/server";

// OpenAPI specification for AI assistants and integrations
const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Vehique AI Car Search API",
    description: "Your AI operating system for car shopping and research. Scan millions of listings, verify VINs, compare prices, and find your perfect vehicle effortlessly.",
    version: "1.0.0",
    contact: {
      name: "Vehique Support",
      email: "hello@vehique.ai",
      url: "https://vehique.ai",
    },
    termsOfService: "https://vehique.ai/legal",
  },
  servers: [
    {
      url: "https://vehique.ai/api",
      description: "Production server",
    },
  ],
  paths: {
    "/search": {
      get: {
        operationId: "searchVehicles",
        summary: "Search for vehicles",
        description: "Search for vehicles using natural language or structured parameters. Returns matching listings with AI analysis.",
        parameters: [
          {
            name: "q",
            in: "query",
            description: "Natural language search query (e.g., 'reliable SUV under $30k')",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "make",
            in: "query",
            description: "Vehicle make (e.g., Toyota, Honda, Ford)",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "model",
            in: "query",
            description: "Vehicle model (e.g., Camry, Civic, F-150)",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "minPrice",
            in: "query",
            description: "Minimum price in USD",
            required: false,
            schema: { type: "integer" },
          },
          {
            name: "maxPrice",
            in: "query",
            description: "Maximum price in USD",
            required: false,
            schema: { type: "integer" },
          },
          {
            name: "year",
            in: "query",
            description: "Model year",
            required: false,
            schema: { type: "integer" },
          },
          {
            name: "type",
            in: "query",
            description: "Body type (suv, sedan, truck, coupe, electric, hybrid)",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "location",
            in: "query",
            description: "Location (city or state)",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Successful search results",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    results: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          make: { type: "string" },
                          model: { type: "string" },
                          year: { type: "integer" },
                          price: { type: "number" },
                          mileage: { type: "integer" },
                          location: { type: "string" },
                          dealerName: { type: "string" },
                          dealerRating: { type: "number" },
                          url: { type: "string" },
                        },
                      },
                    },
                    totalCount: { type: "integer" },
                    aiAnalysis: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/vin/{vin}/decode": {
      get: {
        operationId: "decodeVIN",
        summary: "Decode a VIN",
        description: "Decode a Vehicle Identification Number to get vehicle details and history.",
        parameters: [
          {
            name: "vin",
            in: "path",
            description: "17-character Vehicle Identification Number",
            required: true,
            schema: { type: "string", minLength: 17, maxLength: 17 },
          },
        ],
        responses: {
          "200": {
            description: "VIN decoded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    vin: { type: "string" },
                    make: { type: "string" },
                    model: { type: "string" },
                    year: { type: "integer" },
                    trim: { type: "string" },
                    engine: { type: "string" },
                    transmission: { type: "string" },
                    drivetrain: { type: "string" },
                    bodyType: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Vehicle: {
        type: "object",
        properties: {
          id: { type: "string", description: "Unique listing identifier" },
          make: { type: "string", description: "Vehicle manufacturer" },
          model: { type: "string", description: "Vehicle model name" },
          year: { type: "integer", description: "Model year" },
          price: { type: "number", description: "Listing price in USD" },
          mileage: { type: "integer", description: "Odometer reading in miles" },
          vin: { type: "string", description: "Vehicle Identification Number" },
          condition: { type: "string", enum: ["new", "used", "certified"] },
          bodyType: { type: "string" },
          exteriorColor: { type: "string" },
          interiorColor: { type: "string" },
          fuelType: { type: "string" },
          transmission: { type: "string" },
          drivetrain: { type: "string" },
        },
      },
      Dealer: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          rating: { type: "number", minimum: 0, maximum: 5 },
          reviewCount: { type: "integer" },
          address: { type: "string" },
          phone: { type: "string" },
          website: { type: "string" },
        },
      },
    },
  },
  tags: [
    { name: "Search", description: "Vehicle search operations" },
    { name: "VIN", description: "VIN decoding and verification" },
    { name: "Dealers", description: "Dealer information and ratings" },
  ],
};

export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

