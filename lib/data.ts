export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  unit: string;
  description: string;
  inStock: boolean;
  colors?: string[];
  sizes?: string[];
  sku: string;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon: string;
  color: string;
  categories: string[];
  returnPolicy: string;
  shippingPolicy: string;
  faq: { q: string; a: string }[];
  products: Product[];
}

export const businesses: Business[] = [
  {
    id: "b1",
    name: "SoundDrop",
    slug: "sounddrop",
    tagline: "Premium audio, every day",
    icon: "🎧",
    color: "#6c63ff",
    categories: ["Earbuds", "Headphones", "Handsfree", "Accessories"],
    returnPolicy: "30-day returns. Item must be unused and in original packaging. Refund issued within 5 business days.",
    shippingPolicy: "Free shipping on orders over £40. Standard delivery 3–5 days. Express next-day available for £5.99.",
    faq: [
      { q: "Are the earbuds waterproof?", a: "All our earbuds are IPX4 rated — splash and sweat resistant. Not for swimming." },
      { q: "Do you offer warranty?", a: "12-month manufacturer warranty on all products. Covers defects, not physical damage." },
      { q: "Can I return used earbuds?", a: "For hygiene reasons, opened earbuds can only be returned if faulty. Unused items accepted within 30 days." },
      { q: "What's your best seller?", a: "The ProBuds X3 ANC are our most popular — great ANC and 28h battery life." },
      { q: "Do you ship internationally?", a: "UK and Ireland only currently." },
    ],
    products: [
      { id: "sd1", sku: "SD-PBX3", name: "ProBuds X3 ANC", category: "Earbuds", price: 79.99, originalPrice: 99.99, unit: "pair", description: "Active noise cancelling. 28h total battery. IPX4. Multipoint Bluetooth 5.3. USB-C charging case.", inStock: true, colors: ["Midnight Black", "Pearl White", "Sage Green"] },
      { id: "sd2", sku: "SD-PBL1", name: "ProBuds Lite", category: "Earbuds", price: 34.99, unit: "pair", description: "Open-ear design. 20h battery. Comfortable all-day fit. Dual mic for calls.", inStock: true, colors: ["White", "Black"] },
      { id: "sd3", sku: "SD-HP40", name: "StudioHead 40", category: "Headphones", price: 129.99, unit: "unit", description: "Over-ear. 40h playtime. Foldable. 40mm drivers. AUX + USB-C. Great for commute and studio.", inStock: true, colors: ["Black", "Cream"] },
      { id: "sd4", sku: "SD-HP20W", name: "StudioHead 20 Wireless", category: "Headphones", price: 59.99, unit: "unit", description: "On-ear wireless. 20h battery. Soft cushions. Built-in mic. Lightweight 180g.", inStock: true, colors: ["Navy", "Black", "Rose"] },
      { id: "sd5", sku: "SD-HF10", name: "ClearCall Wired Handsfree", category: "Handsfree", price: 12.99, unit: "unit", description: "3.5mm wired. Inline mic and volume control. Universal compatibility. Tangle-resistant cable.", inStock: true, colors: ["Black", "White"] },
      { id: "sd6", sku: "SD-HF20", name: "NeckLoop Bluetooth Handsfree", category: "Handsfree", price: 29.99, unit: "unit", description: "Neckband style. 12h battery. Magnetic earbuds. IPX5. For calls and music.", inStock: true, colors: ["Black"] },
      { id: "sd7", sku: "SD-ACC1", name: "Charging Case — Universal", category: "Accessories", price: 14.99, unit: "unit", description: "2000mAh power bank case. USB-C in/out. Fits most earbud cases. Compact pocket size.", inStock: true },
      { id: "sd8", sku: "SD-ACC2", name: "Foam Ear Tips — 3 Pack", category: "Accessories", price: 7.99, unit: "pack", description: "Memory foam. Sizes S/M/L. Compatible with most IEM and earbud stems. Better isolation.", inStock: true },
    ],
  },
  {
    id: "b2",
    name: "ThreadHouse",
    slug: "threadhouse",
    tagline: "Everyday wear, done right",
    icon: "👕",
    color: "#f59e0b",
    categories: ["Men's T-Shirts", "Women's T-Shirts", "Oversized", "Polo Shirts"],
    returnPolicy: "60-day returns. Unwashed, unworn with tags attached. Exchange or full refund.",
    shippingPolicy: "Free standard shipping on all orders. 4–6 business days. Express 1–2 days for £4.99.",
    faq: [
      { q: "Do your sizes run true?", a: "Our regular fit tees run true to size. Oversized styles are intentionally large — check the size guide on each product." },
      { q: "How do I wash the tees?", a: "Machine wash 30°C, inside out. Do not tumble dry printed designs. Iron on reverse." },
      { q: "Do you do bulk or corporate orders?", a: "Yes — contact us for orders of 20+ pieces. Custom labels available." },
      { q: "What fabric do you use?", a: "100% ring-spun cotton on most styles. Some blended fabrics for stretch performance tees." },
      { q: "Can I exchange for a different size?", a: "Yes, free exchanges within 60 days if the item is unworn with tags." },
    ],
    products: [
      { id: "th1", sku: "TH-MCR-BLK", name: "Men's Classic Round-Neck Tee", category: "Men's T-Shirts", price: 16.99, unit: "unit", description: "100% ring-spun cotton. 180gsm. Regular fit. Ribbed collar. Pre-shrunk.", inStock: true, colors: ["Black", "White", "Navy", "Grey", "Olive"], sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
      { id: "th2", sku: "TH-MVP-BLK", name: "Men's V-Neck Tee", category: "Men's T-Shirts", price: 17.99, unit: "unit", description: "Slim fit V-neck. Soft 160gsm cotton. Side-seamed. Great for layering.", inStock: true, colors: ["Black", "White", "Burgundy"], sizes: ["S", "M", "L", "XL"] },
      { id: "th3", sku: "TH-MOV-CRM", name: "Men's Oversized Drop-Shoulder", category: "Oversized", price: 22.99, unit: "unit", description: "Relaxed fit, drop shoulder. 220gsm heavyweight cotton. Boxy silhouette.", inStock: true, colors: ["Cream", "Black", "Washed Blue", "Dusty Pink"], sizes: ["S/M", "M/L", "L/XL"] },
      { id: "th4", sku: "TH-WCR-WHT", name: "Women's Fitted Round-Neck Tee", category: "Women's T-Shirts", price: 15.99, unit: "unit", description: "Fitted cut. Soft 160gsm cotton. Slightly cropped hem. Clean minimal look.", inStock: true, colors: ["White", "Black", "Pink", "Lilac", "Sage"], sizes: ["XS", "S", "M", "L", "XL"] },
      { id: "th5", sku: "TH-WOV-BLK", name: "Women's Oversized Tee", category: "Oversized", price: 21.99, unit: "unit", description: "Boyfriend-style. 200gsm. Dropped shoulder. Longer length. Pairs with leggings or jeans.", inStock: true, colors: ["Black", "White", "Taupe", "Coral"], sizes: ["XS/S", "S/M", "M/L", "L/XL"] },
      { id: "th6", sku: "TH-MPL-NVY", name: "Men's Piqué Polo", category: "Polo Shirts", price: 27.99, unit: "unit", description: "Classic piqué weave. 3-button placket. Ribbed collar and cuffs. Smart-casual.", inStock: true, colors: ["Navy", "White", "Black", "Bottle Green"], sizes: ["S", "M", "L", "XL", "XXL"] },
      { id: "th7", sku: "TH-WPL-WHT", name: "Women's Polo Tee", category: "Polo Shirts", price: 25.99, unit: "unit", description: "Relaxed fit polo. Soft cotton-modal blend. Half placket. Contemporary styling.", inStock: true, colors: ["White", "Black", "Blush"], sizes: ["XS", "S", "M", "L"] },
    ],
  },
  {
    id: "b3",
    name: "SoleStride",
    slug: "solestride",
    tagline: "Walk further, look better",
    icon: "👟",
    color: "#22c55e",
    categories: ["Casual Shoes", "Joggers / Running", "Formal", "Sandals & Slides"],
    returnPolicy: "45-day returns. Unworn, in original box. Free returns label included.",
    shippingPolicy: "Free UK shipping. 3–5 business days. Next-day delivery £6.99 if ordered before 2pm.",
    faq: [
      { q: "How do I find my size?", a: "We follow standard UK sizing. If you're between sizes, size up. Width options available on select styles." },
      { q: "Are your shoes vegan?", a: "Our Eco Runner and Canvas Slip-On ranges are 100% vegan. Others use genuine or synthetic leather — check the product page." },
      { q: "Can I return worn shoes?", a: "Shoes must be unworn and in original box. Tried on indoors briefly is fine." },
      { q: "Do you do half sizes?", a: "Yes, on most styles. Formal and running shoes always have half sizes." },
      { q: "How long does delivery take?", a: "Standard free delivery is 3–5 business days. Next-day is available for £6.99 if ordered before 2pm." },
    ],
    products: [
      { id: "ss1", sku: "SS-CHKLO", name: "Classic Chunky Loafer", category: "Casual Shoes", price: 64.99, unit: "pair", description: "Chunky lug sole. Faux leather upper. Slip-on. Platform height 4cm. Unisex sizing.", inStock: true, colors: ["Black", "White", "Tan"], sizes: ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10"] },
      { id: "ss2", sku: "SS-CNVSLP", name: "Canvas Slip-On", category: "Casual Shoes", price: 29.99, unit: "pair", description: "100% vegan. Lightweight canvas. Elastic side panels. Rubber outsole. Great everyday shoe.", inStock: true, colors: ["White", "Black", "Navy", "Olive"], sizes: ["UK 3–10"] },
      { id: "ss3", sku: "SS-ECORUN", name: "Eco Runner V2", category: "Joggers / Running", price: 79.99, originalPrice: 95.00, unit: "pair", description: "Recycled mesh upper. Cushioned EVA midsole. 4mm heel drop. 280g. Vegan. For 5k–half marathon training.", inStock: true, colors: ["Grey/Lime", "Black/White", "Navy/Orange"], sizes: ["UK 4–12 inc. halves"] },
      { id: "ss4", sku: "SS-TRAILX", name: "TrailX Grip Runner", category: "Joggers / Running", price: 89.99, unit: "pair", description: "Aggressive lugged outsole. Water-resistant upper. Toe cap protection. For trail and road.", inStock: true, colors: ["Khaki/Black", "Grey/Red"], sizes: ["UK 6–12 inc. halves"] },
      { id: "ss5", sku: "SS-OXFML", name: "Oxford Brogue — Leather", category: "Formal", price: 94.99, unit: "pair", description: "Genuine leather upper and lining. Leather sole with rubber heel tip. Classic brogue detailing. Hand-finished.", inStock: true, colors: ["Black", "Tan", "Oxblood"], sizes: ["UK 6–11 inc. halves"] },
      { id: "ss6", sku: "SS-DERBSY", name: "Derby Formal Shoe", category: "Formal", price: 79.99, unit: "pair", description: "Open lacing Derby style. Synthetic leather. Padded insole. Slim profile. Good for office wear.", inStock: true, colors: ["Black", "Dark Brown"], sizes: ["UK 7–11"] },
      { id: "ss7", sku: "SS-SLDSFT", name: "Soft Footbed Slide", category: "Sandals & Slides", price: 22.99, unit: "pair", description: "Contoured EVA footbed. Wide adjustable strap. Lightweight 200g. For home, pool, or casual wear.", inStock: true, colors: ["Black", "White", "Khaki"], sizes: ["UK 4–11"] },
    ],
  },
  {
    id: "b4",
    name: "Fabric & Fold",
    slug: "fabricfold",
    tagline: "Unstitched fabric, your craft",
    icon: "🧵",
    color: "#ec4899",
    categories: ["Lawn / Summer", "Linen", "Silk & Chiffon", "Winter Fabric", "Embroidered"],
    returnPolicy: "14-day returns on uncut fabric. Cut fabric cannot be returned. Colours may vary slightly from screen.",
    shippingPolicy: "Ships within 2 business days. UK standard delivery 3–5 days. Fabric is rolled and packaged to prevent creasing.",
    faq: [
      { q: "What does unstitched mean?", a: "Unstitched (also called fabric sets) means the cloth is sold as raw fabric — not sewn into a garment. You take it to a tailor or stitch it yourself." },
      { q: "How much fabric is in a suit set?", a: "A standard 3-piece suit set includes approx. 4.5–5 metres — enough for kameez, trousers, and dupatta." },
      { q: "Do you cut custom lengths?", a: "Yes. For plain fabrics, we can cut from 0.5m increments. Printed sets are sold as full sets only." },
      { q: "How do I care for lawn fabric?", a: "Hand wash or gentle machine cycle 30°C. Do not bleach. Iron on low heat." },
      { q: "Are the prints exclusive?", a: "Our embroidered and printed ranges are seasonal and limited. Once sold out, they do not repeat." },
    ],
    products: [
      { id: "ff1", sku: "FF-LWNDIG", name: "Lawn Digital Print — 3pc Set", category: "Lawn / Summer", price: 34.99, unit: "set", description: "100% lawn cotton. Digital floral print. 3-piece: kameez + trouser + dupatta. ~4.5m total. Summer 2026 collection.", inStock: true, colors: ["Rose Motif", "Teal Geometric", "Powder Blue Floral"] },
      { id: "ff2", sku: "FF-LWNPLN", name: "Lawn Plain — Per Metre", category: "Lawn / Summer", price: 6.50, unit: "per metre", description: "Pure lawn cotton. Soft, breathable. Minimum 1m. Ideal for lining or coordinating dupattas.", inStock: true, colors: ["White", "Ivory", "Blush", "Sky", "Mint", "Peach", "Black"] },
      { id: "ff3", sku: "FF-LINPLN", name: "Linen Plain — Per Metre", category: "Linen", price: 9.99, unit: "per metre", description: "55% linen, 45% cotton blend. Natural texture. Breathable. Min 1m. Suits summer shalwar kameez.", inStock: true, colors: ["Natural", "Ecru", "Dusty Rose", "Navy", "Olive"] },
      { id: "ff4", sku: "FF-SILKCHF", name: "Silk Chiffon Dupatta", category: "Silk & Chiffon", price: 19.99, unit: "piece", description: "2.5m dupatta. Lightweight, semi-sheer. Delicate drape. Printed border.", inStock: true, colors: ["Gold/Red Border", "Silver/Navy", "Ivory/Sage"] },
      { id: "ff5", sku: "FF-WLNSET", name: "Wool-Blend Winter Suit — 3pc", category: "Winter Fabric", price: 59.99, unit: "set", description: "Wool-viscose blend. Warm, structured. Embroidered neckline on kameez fabric. 3-piece set.", inStock: true, colors: ["Charcoal Burgundy", "Forest Green", "Midnight Blue"] },
      { id: "ff6", sku: "FF-EMBSET", name: "Embroidered Net Suit — 3pc", category: "Embroidered", price: 89.99, originalPrice: 110.00, unit: "set", description: "Machine embroidered net fabric kameez + inner + trouser fabric. Formal/wedding occasions. Limited run.", inStock: true, colors: ["Mauve Gold", "Ivory Silver", "Royal Blue"] },
    ],
  },
  {
    id: "b5",
    name: "PetPaw",
    slug: "petpaw",
    tagline: "For the ones who wait at the door",
    icon: "🐾",
    color: "#f97316",
    categories: ["Dog Food", "Cat Food", "Toys & Enrichment", "Accessories", "Grooming"],
    returnPolicy: "30-day returns on unopened food and unused accessories. Opened food not accepted for hygiene reasons.",
    shippingPolicy: "Free delivery on orders over £30. Standard 2–4 days. Subscription orders ship monthly with 10% discount.",
    faq: [
      { q: "Is the food grain-free?", a: "Our Primal range is grain-free. Classic range contains grains. Check each product label." },
      { q: "Do you offer a subscription?", a: "Yes — subscribe to any food product and save 10%. Cancel anytime, no contract." },
      { q: "What age is puppy food for?", a: "Puppy food is suitable for dogs under 12 months. Large breed puppies can use up to 18 months." },
      { q: "Can cats eat dog food?", a: "No — cats have specific nutritional needs (taurine, etc.). Always use species-specific food." },
      { q: "Are your toys safe for aggressive chewers?", a: "The ToughChew and rubber Kong-style range are rated for aggressive chewers. Plush toys are not." },
    ],
    products: [
      { id: "pp1", sku: "PP-DFPRIM2", name: "Primal Dry Dog Food — 2kg", category: "Dog Food", price: 18.99, unit: "bag", description: "Grain-free. 60% chicken. No artificial additives. Suitable adult dogs all breeds.", inStock: true },
      { id: "pp2", sku: "PP-DFPRIM6", name: "Primal Dry Dog Food — 6kg", category: "Dog Food", price: 44.99, originalPrice: 53.99, unit: "bag", description: "Grain-free. 60% chicken. Bulk bag. Best value for medium/large breeds.", inStock: true },
      { id: "pp3", sku: "PP-CFTUNAPCH", name: "Tuna & Pumpkin Cat Pouches — 12pk", category: "Cat Food", price: 14.99, unit: "pack", description: "Grain-free wet food. 12 x 85g pouches. High-protein. No fillers. Adult cats.", inStock: true },
      { id: "pp4", sku: "PP-CFDRY1", name: "Indoor Cat Dry Food — 1.5kg", category: "Cat Food", price: 12.99, unit: "bag", description: "Formulated for indoor cats. Lower calorie. Hairball control. Chicken & rice.", inStock: true },
      { id: "pp5", sku: "SD-TOYRP", name: "Rope Pull Toy", category: "Toys & Enrichment", price: 7.99, unit: "unit", description: "Braided cotton rope. 3 knots. Great for tug-of-war. Helps dental hygiene. Suitable medium dogs.", inStock: true },
      { id: "pp6", sku: "PP-TOYSQ", name: "Squeaky Plush Squirrel", category: "Toys & Enrichment", price: 9.99, unit: "unit", description: "Soft plush. Squeaker inside. 28cm. Not for aggressive chewers.", inStock: true },
      { id: "pp7", sku: "PP-ACCHRN", name: "Padded Dog Harness — Medium", category: "Accessories", price: 24.99, unit: "unit", description: "No-pull front clip. Adjustable chest/girth straps. Padded mesh. Reflective strips. Fits 45–65cm girth.", inStock: true, colors: ["Black", "Red", "Teal"] },
      { id: "pp8", sku: "PP-GRMSHMP", name: "Oatmeal Dog Shampoo — 500ml", category: "Grooming", price: 11.99, unit: "bottle", description: "Soothing oatmeal formula. For sensitive skin. pH balanced. No parabens or sulphates.", inStock: true },
    ],
  },
];

// ── Service data ──────────────────────────────────────────────────────────────

export interface ServiceOffering {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  description: string;
  duration: string;
  coverage: string[];
}

export interface ServiceBusiness {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  icon: string;
  color: string;
  categories: string[];
  faq: { q: string; a: string }[];
  qualificationQuestions: string[];
  services: ServiceOffering[];
}

export const serviceBusinesses: ServiceBusiness[] = [
  {
    id: "svc1",
    name: "ClearSpace Pest Control",
    slug: "clearspace",
    tagline: "BPCA-certified. Same-day available.",
    icon: "🐛",
    color: "#ef4444",
    categories: ["Rodents", "Insects", "Birds", "Surveys"],
    qualificationQuestions: ["What pest have you seen?", "How long have you noticed it?", "Is it residential or commercial?", "What is your postcode?"],
    faq: [
      { q: "How quickly can you come?", a: "Same-day for wasps and urgent infestations. Standard 24–48h for most jobs." },
      { q: "Do I need to leave my home?", a: "For most treatments no. Chemical fogging requires 4h vacate for people and pets." },
      { q: "Is it safe for children and pets?", a: "Our products are HSE-approved. We advise keeping children and pets out of treated areas for 2h." },
      { q: "How many visits will I need?", a: "Depends on pest. Wasp nests: 1 visit. Rat eradication: 3-visit programme. Bed bugs: up to 3 visits." },
      { q: "Are you BPCA certified?", a: "Yes. All technicians are BPCA-trained and carry ID." },
    ],
    services: [
      { id: "sv1", name: "Pest Survey & Report", category: "Surveys", basePrice: 65, unit: "visit", description: "Qualified survey, written report, treatment recommendations.", duration: "1h", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "sv2", name: "Rat & Mouse Eradication", category: "Rodents", basePrice: 140, unit: "3-visit programme", description: "Bait stations placed, monitored, removed. Proofing advice included.", duration: "30 min/visit", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "sv3", name: "Wasp Nest Removal", category: "Insects", basePrice: 85, unit: "per nest", description: "Same-day available. Insecticide dust. Free return if active after 48h.", duration: "30 min", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "sv4", name: "Bed Bug Treatment", category: "Insects", basePrice: 180, unit: "per room", description: "Heat or chemical treatment. Up to 3 visits. Discreet service.", duration: "2h", coverage: ["London", "Manchester", "Birmingham"] },
    ],
  },
  {
    id: "svc2",
    name: "SparkFit EV",
    slug: "sparkfit",
    tagline: "OZEV-registered EV charger installation",
    icon: "⚡",
    color: "#6c63ff",
    categories: ["Home Installation", "Business Installation", "Maintenance"],
    qualificationQuestions: ["Is your property single-phase or three-phase electricity?", "Have you already claimed an OZEV grant?", "Do you own or rent the property?", "What is your postcode?"],
    faq: [
      { q: "What is the OZEV grant?", a: "The EV Charge Point Grant provides up to £350 off home charger installation for renters and flat owners. Homeowners with driveways are not eligible." },
      { q: "How long does installation take?", a: "A standard home install takes 3–4 hours. We handle DNO notification if required." },
      { q: "Can I have a charger if I rent?", a: "Yes, with landlord permission. We can provide a letter template for landlords." },
      { q: "What charger speed do I need?", a: "7kW is right for most homes. 22kW 3-phase is for those with 3-phase supply (rare in residential)." },
      { q: "Do you supply the charger too?", a: "Yes — we supply and install. We carry Ohme, Zappi, and Wallbox units." },
    ],
    services: [
      { id: "ev1", name: "Home EV Charger Installation", category: "Home Installation", basePrice: 249, unit: "installed (incl. 7kW charger)", description: "OZEV-registered. Supply + fit. Smart charger, app control. 1-year labour warranty.", duration: "3–4 hours", coverage: ["London", "Manchester", "Birmingham", "Leeds"] },
      { id: "ev2", name: "Commercial EV Charger — 1 bay", category: "Business Installation", basePrice: 499, unit: "per bay", description: "22kW AC 3-phase. Load management. RFID access. Quantity discounts available.", duration: "Full day", coverage: ["UK-wide"] },
      { id: "ev3", name: "Charger Health Check", category: "Maintenance", basePrice: 79, unit: "per visit", description: "Safety inspection, firmware update, connector test. For any brand.", duration: "1 hour", coverage: ["London", "Manchester", "Birmingham"] },
    ],
  },
  {
    id: "svc3",
    name: "BrightHome Cleaning",
    slug: "brighthome",
    tagline: "DBS-checked. Eco-certified.",
    icon: "🧹",
    color: "#22c55e",
    categories: ["Regular Domestic", "Deep Clean", "End of Tenancy", "Commercial"],
    qualificationQuestions: ["How many bedrooms does your property have?", "Do you need regular or one-off cleaning?", "Do you have any pets (affects pricing)?", "What is your postcode?"],
    faq: [
      { q: "Are your cleaners DBS checked?", a: "Yes. All cleaners are DBS checked and insured. We carry public liability insurance up to £1m." },
      { q: "Do I need to provide supplies?", a: "We bring all equipment and products. Let us know if you prefer eco or fragrance-free products." },
      { q: "What's the difference between a regular and deep clean?", a: "Regular clean covers surfaces, floors, kitchen, bathrooms weekly. Deep clean includes inside appliances, behind furniture, skirting boards." },
      { q: "Can I get an end of tenancy certificate?", a: "Yes. Our end of tenancy clean comes with a signed completion certificate, useful for deposit disputes." },
      { q: "Do you clean on weekends?", a: "Yes — Saturday and Sunday slots available, no extra charge." },
    ],
    services: [
      { id: "cl1", name: "Regular Domestic Clean", category: "Regular Domestic", basePrice: 22, unit: "per hour (2h min)", description: "Weekly or fortnightly. Same trusted cleaner. Eco products. DBS checked.", duration: "2–4 hours", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "cl2", name: "Deep Clean — 3-bed home", category: "Deep Clean", basePrice: 195, unit: "per visit", description: "Full property deep clean. Oven, inside appliances, bathrooms, carpets vacuumed, mopping.", duration: "4–5 hours", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "cl3", name: "End of Tenancy Clean", category: "End of Tenancy", basePrice: 280, unit: "flat rate (up to 3 bed)", description: "Deposit-back clean. Certificate issued. Internal windows, oven, all rooms.", duration: "5–6 hours", coverage: ["London", "Manchester", "Birmingham", "Leeds", "Dublin"] },
      { id: "cl4", name: "After-Builders Clean", category: "Deep Clean", basePrice: 350, unit: "per day", description: "Dust removal, paint splatter, full kitchen & bath deep clean. COSHH-trained.", duration: "Full day", coverage: ["London", "Manchester", "Birmingham"] },
    ],
  },
  {
    id: "svc4",
    name: "SwiftMove Removals",
    slug: "swiftmove",
    tagline: "Careful hands. On time.",
    icon: "🚛",
    color: "#f59e0b",
    categories: ["Man & Van", "House Moves", "Office Moves", "Storage"],
    qualificationQuestions: ["Where are you moving from and to (postcodes)?", "How many bedrooms / approximate volume?", "What date do you need?", "Do you need packing as well?"],
    faq: [
      { q: "Do you provide boxes?", a: "Yes. Flat-pack boxes, packing tape, and bubble wrap available to purchase. We also rent reusable plastic crates." },
      { q: "Are my belongings insured?", a: "Basic goods-in-transit insurance is included. Enhanced cover available for antiques and high-value items." },
      { q: "Do you do last-minute bookings?", a: "Subject to availability. Same-day van possible on weekdays for small moves. Call rather than booking online for urgent jobs." },
      { q: "Can you move a piano or safe?", a: "Yes — specialist equipment for pianos, safes, and heavy items. Extra charge applies. Mention at booking." },
      { q: "What areas do you cover?", a: "UK-wide for house moves. Man-and-van within 25 miles of our depots (London, Manchester, Birmingham)." },
    ],
    services: [
      { id: "rm1", name: "Man & Van — Local", category: "Man & Van", basePrice: 75, unit: "per hour (2h min)", description: "One driver + helper. Transit van. Within 25 miles. Great for single rooms, student moves.", duration: "Hourly", coverage: ["London", "Manchester", "Birmingham"] },
      { id: "rm2", name: "Full House Move — 3 bed", category: "House Moves", basePrice: 580, unit: "half-day rate", description: "3-man crew + Luton van. Pack, load, transport, unload. Up to 4h on-site.", duration: "4–5 hours", coverage: ["UK-wide"] },
      { id: "rm3", name: "Office Relocation", category: "Office Moves", basePrice: 450, unit: "per day", description: "Weekend moves available. Disassemble/reassemble desks. IT equipment handled carefully.", duration: "Full day", coverage: ["London", "Manchester", "Birmingham"] },
      { id: "rm4", name: "Storage — Container Unit", category: "Storage", basePrice: 39, unit: "per week", description: "Secure unit from 25ft³. 24h CCTV. Flexible weekly terms. Collection service available.", duration: "Weekly", coverage: ["London", "Manchester"] },
    ],
  },
  {
    id: "svc5",
    name: "SolarStep",
    slug: "solarstep",
    tagline: "MCS-certified solar installation",
    icon: "☀️",
    color: "#eab308",
    categories: ["Solar Panels", "Battery Storage", "Maintenance", "Survey"],
    qualificationQuestions: ["Is your roof south/southwest facing?", "Is the property owned by you?", "Approximate electricity bill per month?", "What is your postcode?"],
    faq: [
      { q: "How long does installation take?", a: "A standard 4kWp home system takes 1–2 days. Battery add-ons take half a day extra." },
      { q: "Do I need planning permission?", a: "Most domestic installs are permitted development. Listed buildings and some conservation areas need permission — we advise at survey." },
      { q: "How much will I save?", a: "Typical UK 4kWp system saves £400–£700/yr depending on consumption and export tariff. We model this in the survey report." },
      { q: "What warranty do you offer?", a: "25-year panel performance warranty. 10-year product warranty. 2-year installation warranty from us." },
      { q: "What is the Smart Export Guarantee?", a: "SEG pays you for electricity you export back to the grid. Rates vary by supplier. We help you register." },
    ],
    services: [
      { id: "sol1", name: "Solar Survey & Proposal", category: "Survey", basePrice: 0, unit: "free", description: "MCS-registered surveyor visits, assesses roof, models savings, produces written proposal.", duration: "1.5 hours", coverage: ["London", "South East", "Midlands", "Manchester"] },
      { id: "sol2", name: "Solar Panel Installation — 4kWp", category: "Solar Panels", basePrice: 6500, unit: "installed (indicative)", description: "16 x 400W panels. MCS-certified. Includes inverter, mounting, DNO application, commissioning. ESTIMATE ONLY — owner approves final price.", duration: "1–2 days", coverage: ["London", "South East", "Midlands", "Manchester"] },
      { id: "sol3", name: "Battery Storage Add-On", category: "Battery Storage", basePrice: 2800, unit: "installed (indicative)", description: "5kWh battery. Pairs with new or existing solar. Evening/overnight self-consumption. ESTIMATE ONLY.", duration: "Half day", coverage: ["London", "South East", "Midlands", "Manchester"] },
      { id: "sol4", name: "Annual Panel Service", category: "Maintenance", basePrice: 129, unit: "per visit", description: "Inspect, clean, test output, check inverter, report. Keeps warranty valid.", duration: "2 hours", coverage: ["London", "South East", "Midlands"] },
    ],
  },
];
