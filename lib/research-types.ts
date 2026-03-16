// Types for vehicle comparison research results

export interface VehicleComparison {
  id: string;
  title: string;
  price: number | null;
  miles: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  bodyType: string | null;
  fuelType: string | null;
  transmission: string | null;
  drivetrain: string | null;
  exteriorColor: string | null;
  dealer: string | null;
  location: string | null;
  vdpUrl: string | null;
  keyStrengths: string[];
  keyWeaknesses: string[];
  horsepower?: number | null;
  torque?: number | null;
  mpgCity?: number | null;
  mpgHighway?: number | null;
  engine?: string | null;
  interiorColor?: string | null;
  researchSnippets?: Array<{
    source: "reddit" | "youtube" | "jdpower" | "kbb" | "edmunds" | "web";
    title: string;
    snippet: string;
    url: string;
    importantParts: string[];
  }>;
  scores?: {
    reliability: number;
    value: number;
    satisfaction: number;
    roadTest: number;
  };
}

export interface ComparisonResult {
  vehicles: VehicleComparison[];
  comparison: {
    keyDifferences: string[];
    valueAnalysis: string;
    reliabilityNotes: string;
  };
  recommendation: {
    bestPick: string;
    rationale: string;
    confidence: "high" | "medium" | "low";
    matchScore: number; // 0-100, AI-generated composite score
    scoreBreakdown?: {
      value: number; // 0-100
      condition: number; // 0-100
      reliability: number; // 0-100
      features: number; // 0-100
      dataQuality: number; // 0-100
    };
  };
  verificationNotes: string[];
  sources: Array<{ 
    title: string; 
    url: string; 
    type: "marketcheck" | "dealer" | "web" 
  }>;
}

export interface StreamStep {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
  description?: string;
}
