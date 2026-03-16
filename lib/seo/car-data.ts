// Comprehensive car makes and models data for programmatic SEO
// This generates thousands of indexable landing pages

export const CAR_MAKES = [
  { slug: "toyota", name: "Toyota", popular: true },
  { slug: "honda", name: "Honda", popular: true },
  { slug: "ford", name: "Ford", popular: true },
  { slug: "chevrolet", name: "Chevrolet", popular: true },
  { slug: "nissan", name: "Nissan", popular: true },
  { slug: "hyundai", name: "Hyundai", popular: true },
  { slug: "kia", name: "Kia", popular: true },
  { slug: "subaru", name: "Subaru", popular: true },
  { slug: "mazda", name: "Mazda", popular: true },
  { slug: "volkswagen", name: "Volkswagen", popular: true },
  { slug: "bmw", name: "BMW", popular: true },
  { slug: "mercedes-benz", name: "Mercedes-Benz", popular: true },
  { slug: "audi", name: "Audi", popular: true },
  { slug: "lexus", name: "Lexus", popular: true },
  { slug: "tesla", name: "Tesla", popular: true },
  { slug: "jeep", name: "Jeep", popular: true },
  { slug: "ram", name: "RAM", popular: true },
  { slug: "gmc", name: "GMC", popular: true },
  { slug: "buick", name: "Buick", popular: false },
  { slug: "cadillac", name: "Cadillac", popular: false },
  { slug: "chrysler", name: "Chrysler", popular: false },
  { slug: "dodge", name: "Dodge", popular: true },
  { slug: "acura", name: "Acura", popular: false },
  { slug: "infiniti", name: "Infiniti", popular: false },
  { slug: "lincoln", name: "Lincoln", popular: false },
  { slug: "volvo", name: "Volvo", popular: false },
  { slug: "porsche", name: "Porsche", popular: false },
  { slug: "land-rover", name: "Land Rover", popular: false },
  { slug: "jaguar", name: "Jaguar", popular: false },
  { slug: "mini", name: "MINI", popular: false },
  { slug: "mitsubishi", name: "Mitsubishi", popular: false },
  { slug: "genesis", name: "Genesis", popular: false },
  { slug: "alfa-romeo", name: "Alfa Romeo", popular: false },
  { slug: "maserati", name: "Maserati", popular: false },
  { slug: "ferrari", name: "Ferrari", popular: false },
  { slug: "lamborghini", name: "Lamborghini", popular: false },
  { slug: "bentley", name: "Bentley", popular: false },
  { slug: "rolls-royce", name: "Rolls-Royce", popular: false },
  { slug: "aston-martin", name: "Aston Martin", popular: false },
  { slug: "mclaren", name: "McLaren", popular: false },
  { slug: "rivian", name: "Rivian", popular: false },
  { slug: "lucid", name: "Lucid", popular: false },
  { slug: "polestar", name: "Polestar", popular: false },
];

export const CAR_MODELS: Record<string, { slug: string; name: string; type: string }[]> = {
  toyota: [
    { slug: "camry", name: "Camry", type: "sedan" },
    { slug: "corolla", name: "Corolla", type: "sedan" },
    { slug: "rav4", name: "RAV4", type: "suv" },
    { slug: "highlander", name: "Highlander", type: "suv" },
    { slug: "tacoma", name: "Tacoma", type: "truck" },
    { slug: "tundra", name: "Tundra", type: "truck" },
    { slug: "4runner", name: "4Runner", type: "suv" },
    { slug: "prius", name: "Prius", type: "hybrid" },
    { slug: "sienna", name: "Sienna", type: "minivan" },
    { slug: "supra", name: "Supra", type: "sports" },
  ],
  honda: [
    { slug: "civic", name: "Civic", type: "sedan" },
    { slug: "accord", name: "Accord", type: "sedan" },
    { slug: "cr-v", name: "CR-V", type: "suv" },
    { slug: "pilot", name: "Pilot", type: "suv" },
    { slug: "hr-v", name: "HR-V", type: "suv" },
    { slug: "odyssey", name: "Odyssey", type: "minivan" },
    { slug: "ridgeline", name: "Ridgeline", type: "truck" },
    { slug: "passport", name: "Passport", type: "suv" },
  ],
  ford: [
    { slug: "f-150", name: "F-150", type: "truck" },
    { slug: "mustang", name: "Mustang", type: "sports" },
    { slug: "explorer", name: "Explorer", type: "suv" },
    { slug: "escape", name: "Escape", type: "suv" },
    { slug: "bronco", name: "Bronco", type: "suv" },
    { slug: "ranger", name: "Ranger", type: "truck" },
    { slug: "maverick", name: "Maverick", type: "truck" },
    { slug: "edge", name: "Edge", type: "suv" },
    { slug: "expedition", name: "Expedition", type: "suv" },
    { slug: "mustang-mach-e", name: "Mustang Mach-E", type: "electric" },
  ],
  chevrolet: [
    { slug: "silverado", name: "Silverado", type: "truck" },
    { slug: "equinox", name: "Equinox", type: "suv" },
    { slug: "tahoe", name: "Tahoe", type: "suv" },
    { slug: "suburban", name: "Suburban", type: "suv" },
    { slug: "traverse", name: "Traverse", type: "suv" },
    { slug: "camaro", name: "Camaro", type: "sports" },
    { slug: "corvette", name: "Corvette", type: "sports" },
    { slug: "colorado", name: "Colorado", type: "truck" },
    { slug: "blazer", name: "Blazer", type: "suv" },
    { slug: "bolt-ev", name: "Bolt EV", type: "electric" },
  ],
  tesla: [
    { slug: "model-3", name: "Model 3", type: "electric" },
    { slug: "model-y", name: "Model Y", type: "electric" },
    { slug: "model-s", name: "Model S", type: "electric" },
    { slug: "model-x", name: "Model X", type: "electric" },
    { slug: "cybertruck", name: "Cybertruck", type: "electric" },
  ],
  bmw: [
    { slug: "3-series", name: "3 Series", type: "sedan" },
    { slug: "5-series", name: "5 Series", type: "sedan" },
    { slug: "x3", name: "X3", type: "suv" },
    { slug: "x5", name: "X5", type: "suv" },
    { slug: "x7", name: "X7", type: "suv" },
    { slug: "i4", name: "i4", type: "electric" },
    { slug: "ix", name: "iX", type: "electric" },
  ],
  // Add more makes/models as needed
};

export const BODY_TYPES = [
  { slug: "sedan", name: "Sedan", description: "4-door passenger cars" },
  { slug: "suv", name: "SUV", description: "Sport Utility Vehicles" },
  { slug: "truck", name: "Truck", description: "Pickup trucks" },
  { slug: "crossover", name: "Crossover", description: "Crossover vehicles" },
  { slug: "coupe", name: "Coupe", description: "2-door sports cars" },
  { slug: "hatchback", name: "Hatchback", description: "Compact hatchbacks" },
  { slug: "minivan", name: "Minivan", description: "Family minivans" },
  { slug: "convertible", name: "Convertible", description: "Convertible cars" },
  { slug: "wagon", name: "Wagon", description: "Station wagons" },
  { slug: "electric", name: "Electric", description: "Electric vehicles (EVs)" },
  { slug: "hybrid", name: "Hybrid", description: "Hybrid vehicles" },
  { slug: "luxury", name: "Luxury", description: "Premium luxury vehicles" },
  { slug: "sports", name: "Sports Car", description: "High-performance sports cars" },
];

export const PRICE_RANGES = [
  { slug: "under-10k", name: "Under $10,000", min: 0, max: 10000 },
  { slug: "10k-15k", name: "$10,000 - $15,000", min: 10000, max: 15000 },
  { slug: "15k-20k", name: "$15,000 - $20,000", min: 15000, max: 20000 },
  { slug: "20k-25k", name: "$20,000 - $25,000", min: 20000, max: 25000 },
  { slug: "25k-30k", name: "$25,000 - $30,000", min: 25000, max: 30000 },
  { slug: "30k-40k", name: "$30,000 - $40,000", min: 30000, max: 40000 },
  { slug: "40k-50k", name: "$40,000 - $50,000", min: 40000, max: 50000 },
  { slug: "50k-75k", name: "$50,000 - $75,000", min: 50000, max: 75000 },
  { slug: "75k-100k", name: "$75,000 - $100,000", min: 75000, max: 100000 },
  { slug: "over-100k", name: "Over $100,000", min: 100000, max: 999999 },
];

export const YEARS = Array.from({ length: 30 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { slug: year.toString(), name: year.toString() };
});

export const US_STATES = [
  { slug: "california", name: "California", abbr: "CA" },
  { slug: "texas", name: "Texas", abbr: "TX" },
  { slug: "florida", name: "Florida", abbr: "FL" },
  { slug: "new-york", name: "New York", abbr: "NY" },
  { slug: "pennsylvania", name: "Pennsylvania", abbr: "PA" },
  { slug: "illinois", name: "Illinois", abbr: "IL" },
  { slug: "ohio", name: "Ohio", abbr: "OH" },
  { slug: "georgia", name: "Georgia", abbr: "GA" },
  { slug: "north-carolina", name: "North Carolina", abbr: "NC" },
  { slug: "michigan", name: "Michigan", abbr: "MI" },
  { slug: "new-jersey", name: "New Jersey", abbr: "NJ" },
  { slug: "virginia", name: "Virginia", abbr: "VA" },
  { slug: "washington", name: "Washington", abbr: "WA" },
  { slug: "arizona", name: "Arizona", abbr: "AZ" },
  { slug: "massachusetts", name: "Massachusetts", abbr: "MA" },
  { slug: "tennessee", name: "Tennessee", abbr: "TN" },
  { slug: "indiana", name: "Indiana", abbr: "IN" },
  { slug: "missouri", name: "Missouri", abbr: "MO" },
  { slug: "maryland", name: "Maryland", abbr: "MD" },
  { slug: "wisconsin", name: "Wisconsin", abbr: "WI" },
  { slug: "colorado", name: "Colorado", abbr: "CO" },
  { slug: "minnesota", name: "Minnesota", abbr: "MN" },
  { slug: "south-carolina", name: "South Carolina", abbr: "SC" },
  { slug: "alabama", name: "Alabama", abbr: "AL" },
  { slug: "louisiana", name: "Louisiana", abbr: "LA" },
  { slug: "kentucky", name: "Kentucky", abbr: "KY" },
  { slug: "oregon", name: "Oregon", abbr: "OR" },
  { slug: "oklahoma", name: "Oklahoma", abbr: "OK" },
  { slug: "connecticut", name: "Connecticut", abbr: "CT" },
  { slug: "utah", name: "Utah", abbr: "UT" },
  { slug: "iowa", name: "Iowa", abbr: "IA" },
  { slug: "nevada", name: "Nevada", abbr: "NV" },
  { slug: "arkansas", name: "Arkansas", abbr: "AR" },
  { slug: "mississippi", name: "Mississippi", abbr: "MS" },
  { slug: "kansas", name: "Kansas", abbr: "KS" },
  { slug: "new-mexico", name: "New Mexico", abbr: "NM" },
  { slug: "nebraska", name: "Nebraska", abbr: "NE" },
  { slug: "idaho", name: "Idaho", abbr: "ID" },
  { slug: "west-virginia", name: "West Virginia", abbr: "WV" },
  { slug: "hawaii", name: "Hawaii", abbr: "HI" },
  { slug: "new-hampshire", name: "New Hampshire", abbr: "NH" },
  { slug: "maine", name: "Maine", abbr: "ME" },
  { slug: "montana", name: "Montana", abbr: "MT" },
  { slug: "rhode-island", name: "Rhode Island", abbr: "RI" },
  { slug: "delaware", name: "Delaware", abbr: "DE" },
  { slug: "south-dakota", name: "South Dakota", abbr: "SD" },
  { slug: "north-dakota", name: "North Dakota", abbr: "ND" },
  { slug: "alaska", name: "Alaska", abbr: "AK" },
  { slug: "vermont", name: "Vermont", abbr: "VT" },
  { slug: "wyoming", name: "Wyoming", abbr: "WY" },
];

// Generate all possible URL combinations for sitemap
export function generateAllSEOUrls(): string[] {
  const urls: string[] = [];
  const baseUrl = "https://vehique.ai";
  
  // Make pages: /cars/toyota, /cars/honda, etc.
  CAR_MAKES.forEach(make => {
    urls.push(`${baseUrl}/cars/${make.slug}`);
    
    // Make + Model pages: /cars/toyota/camry
    const models = CAR_MODELS[make.slug] || [];
    models.forEach(model => {
      urls.push(`${baseUrl}/cars/${make.slug}/${model.slug}`);
    });
  });
  
  // Body type pages: /cars/type/suv
  BODY_TYPES.forEach(type => {
    urls.push(`${baseUrl}/cars/type/${type.slug}`);
  });
  
  // Price range pages: /cars/price/under-10k
  PRICE_RANGES.forEach(range => {
    urls.push(`${baseUrl}/cars/price/${range.slug}`);
  });
  
  // State pages: /cars/location/california
  US_STATES.forEach(state => {
    urls.push(`${baseUrl}/cars/location/${state.slug}`);
  });
  
  return urls;
}

// Major US Cities for local SEO
export const MAJOR_CITIES = [
  { slug: "new-york", name: "New York", state: "NY", metro: "New York City" },
  { slug: "los-angeles", name: "Los Angeles", state: "CA", metro: "Los Angeles" },
  { slug: "chicago", name: "Chicago", state: "IL", metro: "Chicago" },
  { slug: "houston", name: "Houston", state: "TX", metro: "Houston" },
  { slug: "phoenix", name: "Phoenix", state: "AZ", metro: "Phoenix" },
  { slug: "philadelphia", name: "Philadelphia", state: "PA", metro: "Philadelphia" },
  { slug: "san-antonio", name: "San Antonio", state: "TX", metro: "San Antonio" },
  { slug: "san-diego", name: "San Diego", state: "CA", metro: "San Diego" },
  { slug: "dallas", name: "Dallas", state: "TX", metro: "Dallas-Fort Worth" },
  { slug: "san-jose", name: "San Jose", state: "CA", metro: "San Jose" },
  { slug: "austin", name: "Austin", state: "TX", metro: "Austin" },
  { slug: "jacksonville", name: "Jacksonville", state: "FL", metro: "Jacksonville" },
  { slug: "fort-worth", name: "Fort Worth", state: "TX", metro: "Dallas-Fort Worth" },
  { slug: "columbus", name: "Columbus", state: "OH", metro: "Columbus" },
  { slug: "charlotte", name: "Charlotte", state: "NC", metro: "Charlotte" },
  { slug: "san-francisco", name: "San Francisco", state: "CA", metro: "San Francisco Bay Area" },
  { slug: "indianapolis", name: "Indianapolis", state: "IN", metro: "Indianapolis" },
  { slug: "seattle", name: "Seattle", state: "WA", metro: "Seattle" },
  { slug: "denver", name: "Denver", state: "CO", metro: "Denver" },
  { slug: "washington-dc", name: "Washington", state: "DC", metro: "Washington DC" },
  { slug: "boston", name: "Boston", state: "MA", metro: "Boston" },
  { slug: "el-paso", name: "El Paso", state: "TX", metro: "El Paso" },
  { slug: "nashville", name: "Nashville", state: "TN", metro: "Nashville" },
  { slug: "detroit", name: "Detroit", state: "MI", metro: "Detroit" },
  { slug: "portland", name: "Portland", state: "OR", metro: "Portland" },
  { slug: "memphis", name: "Memphis", state: "TN", metro: "Memphis" },
  { slug: "oklahoma-city", name: "Oklahoma City", state: "OK", metro: "Oklahoma City" },
  { slug: "las-vegas", name: "Las Vegas", state: "NV", metro: "Las Vegas" },
  { slug: "louisville", name: "Louisville", state: "KY", metro: "Louisville" },
  { slug: "baltimore", name: "Baltimore", state: "MD", metro: "Baltimore" },
  { slug: "milwaukee", name: "Milwaukee", state: "WI", metro: "Milwaukee" },
  { slug: "albuquerque", name: "Albuquerque", state: "NM", metro: "Albuquerque" },
  { slug: "tucson", name: "Tucson", state: "AZ", metro: "Tucson" },
  { slug: "fresno", name: "Fresno", state: "CA", metro: "Fresno" },
  { slug: "sacramento", name: "Sacramento", state: "CA", metro: "Sacramento" },
  { slug: "mesa", name: "Mesa", state: "AZ", metro: "Phoenix" },
  { slug: "atlanta", name: "Atlanta", state: "GA", metro: "Atlanta" },
  { slug: "kansas-city", name: "Kansas City", state: "MO", metro: "Kansas City" },
  { slug: "colorado-springs", name: "Colorado Springs", state: "CO", metro: "Colorado Springs" },
  { slug: "miami", name: "Miami", state: "FL", metro: "Miami" },
  { slug: "raleigh", name: "Raleigh", state: "NC", metro: "Raleigh-Durham" },
  { slug: "omaha", name: "Omaha", state: "NE", metro: "Omaha" },
  { slug: "long-beach", name: "Long Beach", state: "CA", metro: "Los Angeles" },
  { slug: "virginia-beach", name: "Virginia Beach", state: "VA", metro: "Virginia Beach" },
  { slug: "oakland", name: "Oakland", state: "CA", metro: "San Francisco Bay Area" },
  { slug: "minneapolis", name: "Minneapolis", state: "MN", metro: "Minneapolis-St. Paul" },
  { slug: "tampa", name: "Tampa", state: "FL", metro: "Tampa Bay" },
  { slug: "tulsa", name: "Tulsa", state: "OK", metro: "Tulsa" },
  { slug: "arlington", name: "Arlington", state: "TX", metro: "Dallas-Fort Worth" },
  { slug: "new-orleans", name: "New Orleans", state: "LA", metro: "New Orleans" },
];

// Competitor sites for alternative keyword pages
export const COMPETITOR_SITES = [
  { slug: "carvana", name: "Carvana", type: "online-dealer" },
  { slug: "cargurus", name: "CarGurus", type: "marketplace" },
  { slug: "autotrader", name: "Autotrader", type: "marketplace" },
  { slug: "cars-com", name: "Cars.com", type: "marketplace" },
  { slug: "truecar", name: "TrueCar", type: "marketplace" },
  { slug: "edmunds", name: "Edmunds", type: "research" },
  { slug: "kbb", name: "Kelley Blue Book", type: "research" },
  { slug: "carmax", name: "CarMax", type: "dealer" },
  { slug: "vroom", name: "Vroom", type: "online-dealer" },
  { slug: "ebay-motors", name: "eBay Motors", type: "marketplace" },
  { slug: "facebook-marketplace", name: "Facebook Marketplace", type: "marketplace" },
  { slug: "craigslist", name: "Craigslist", type: "classifieds" },
  { slug: "autotempest", name: "AutoTempest", type: "aggregator" },
  { slug: "iseecars", name: "iSeeCars", type: "research" },
  { slug: "carfax", name: "Carfax", type: "history" },
];

// Get make by slug
export function getMakeBySlug(slug: string) {
  return CAR_MAKES.find(make => make.slug === slug);
}

// Get model by slug
export function getModelBySlug(makeSlug: string, modelSlug: string) {
  const models = CAR_MODELS[makeSlug] || [];
  return models.find(model => model.slug === modelSlug);
}

// Get city by slug
export function getCityBySlug(slug: string) {
  return MAJOR_CITIES.find(city => city.slug === slug);
}

// Get competitor by slug
export function getCompetitorBySlug(slug: string) {
  return COMPETITOR_SITES.find(site => site.slug === slug);
}

