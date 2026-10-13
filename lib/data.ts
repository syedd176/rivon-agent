export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  inStock: boolean;
  leadTime?: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
  duration: string;
  coverage: string[];
}

export const products: Product[] = [
  {
    id: "p1",
    name: "Bed Bug Treatment Kit — Professional Grade",
    category: "Pest Control",
    price: 89.99,
    unit: "per room",
    description: "HSE-approved residual spray concentrate + monitoring traps. Covers up to 25m². Effective for 6 months.",
    inStock: true,
  },
  {
    id: "p2",
    name: "Cockroach Gel Bait — Syngenta Advion",
    category: "Pest Control",
    price: 34.50,
    unit: "per tube (30g)",
    description: "Indoxacarb 0.6% gel. Targets German and Oriental cockroach. Used by UK pest controllers.",
    inStock: true,
  },
  {
    id: "p3",
    name: "Rat Bait Station — Tamper Resistant",
    category: "Pest Control",
    price: 12.00,
    unit: "each",
    description: "Lockable HDPE bait station. Rodenticide block holder. Weather-resistant for outdoor use.",
    inStock: true,
  },
  {
    id: "p4",
    name: "EV Home Charger — 7kW Smart",
    category: "EV Charging",
    price: 649.00,
    unit: "unit",
    description: "7kW single-phase smart charger. Zappi-compatible. OZEV grant eligible. WiFi + app control.",
    inStock: true,
    leadTime: "3–5 days",
  },
  {
    id: "p5",
    name: "EV Tethered Cable — Type 2, 8m",
    category: "EV Charging",
    price: 149.00,
    unit: "unit",
    description: "32A Type 2 to Type 2, 8 metre. Compatible with most UK EVs. Weatherproof.",
    inStock: true,
  },
  {
    id: "p6",
    name: "Deep Clean Pack — 3-bedroom home",
    category: "Cleaning",
    price: 195.00,
    unit: "per visit",
    description: "Full internal clean. Oven, kitchen, bathrooms, vacuuming and mopping. Eco-certified products. 4–5 hours.",
    inStock: true,
  },
  {
    id: "p7",
    name: "End of Tenancy Clean",
    category: "Cleaning",
    price: 280.00,
    unit: "flat rate",
    description: "Deposit-back clean. Covers all rooms, oven, windows internal, carpets vacuumed. Certificate issued.",
    inStock: true,
  },
  {
    id: "p8",
    name: "Removal Van — Transit, up to 15m³",
    category: "Removals",
    price: 75.00,
    unit: "per hour (min 2h)",
    description: "One-man-and-van. Transit-sized. Includes blankets and straps. Within service zone.",
    inStock: true,
  },
  {
    id: "p9",
    name: "Full House Move — 3 bed",
    category: "Removals",
    price: 580.00,
    unit: "half-day rate",
    description: "3-man crew + Luton van. Pack, load, transport, unload. Up to 4 hours on-site.",
    inStock: true,
  },
];

export const services: Service[] = [
  {
    id: "s1",
    name: "Residential Pest Survey",
    category: "Pest Control",
    basePrice: 65,
    unit: "per visit",
    description: "Qualified BPCA-registered technician inspects property, identifies species, assesses severity, provides written report and treatment plan.",
    duration: "45–90 min",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s2",
    name: "Rat & Mouse Eradication — Residential",
    category: "Pest Control",
    basePrice: 140,
    unit: "per treatment (3 visits)",
    description: "3-visit programme. Bait stations placed on visit 1, monitored on visit 2, removed on visit 3. Includes full proofing report.",
    duration: "30 min per visit",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s3",
    name: "Wasp Nest Removal",
    category: "Pest Control",
    basePrice: 85,
    unit: "per nest",
    description: "Same-day treatment available. Insecticide dust applied direct to nest. Guaranteed; return visit free if colony active after 48h.",
    duration: "30 min",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s4",
    name: "EV Charger Installation — Home",
    category: "EV Charging",
    basePrice: 249,
    unit: "installed",
    description: "OZEV-registered installer. Includes 7kW charger, installation, commissioning, and OZEV grant paperwork. Single-phase only.",
    duration: "3–4 hours",
    coverage: ["London", "Manchester", "Birmingham", "Leeds"],
  },
  {
    id: "s5",
    name: "Regular Domestic Cleaning",
    category: "Cleaning",
    basePrice: 22,
    unit: "per hour",
    description: "Weekly or fortnightly. Trusted, DBS-checked cleaner. Eco products available. 2-hour minimum.",
    duration: "2–4 hours",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s6",
    name: "After-Builders Clean",
    category: "Cleaning",
    basePrice: 350,
    unit: "per day",
    description: "Specialist dust removal, paint splatter treatment, full kitchen and bathroom deep clean. COSHH-trained team.",
    duration: "Full day",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s7",
    name: "Man and Van — Local Move",
    category: "Removals",
    basePrice: 75,
    unit: "per hour (2h min)",
    description: "One driver, one helper. Transit van. Suitable for single rooms, student moves, flat-to-flat. Within 25 miles.",
    duration: "Hourly",
    coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"],
  },
  {
    id: "s8",
    name: "Full House Removal — Long Distance",
    category: "Removals",
    basePrice: 950,
    unit: "flat rate (3-bed)",
    description: "3-man crew + Luton van, up to 200 miles. Includes full wrap of large furniture. Quote adjusted for volume and distance.",
    duration: "Full day",
    coverage: ["UK-wide"],
  },
];
