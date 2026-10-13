/**
 * Inline SVG product imagery. Kept as data URIs so cards never wait on the
 * network, never 404, and look consistent across every store.
 */

const SHAPES: Record<string, (c: string) => string> = {
  earbuds: c => `
    <circle cx="26" cy="34" r="11" fill="${c}" opacity=".9"/>
    <circle cx="26" cy="34" r="4.5" fill="#0c0c0f" opacity=".55"/>
    <path d="M26 45c0 7 1 11 1 14" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".75"/>
    <circle cx="58" cy="34" r="11" fill="${c}" opacity=".9"/>
    <circle cx="58" cy="34" r="4.5" fill="#0c0c0f" opacity=".55"/>
    <path d="M58 45c0 7 1 11 1 14" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".75"/>`,

  headphones: c => `
    <path d="M18 46V36a24 24 0 0 1 48 0v10" stroke="${c}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    <rect x="11" y="43" width="14" height="23" rx="7" fill="${c}" opacity=".9"/>
    <rect x="59" y="43" width="14" height="23" rx="7" fill="${c}" opacity=".9"/>`,

  handsfree: c => `
    <path d="M30 20c-8 4-11 13-9 22" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <rect x="17" y="40" width="13" height="20" rx="6.5" fill="${c}" opacity=".9"/>
    <path d="M34 60q14 10 28 0" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>
    <circle cx="64" cy="56" r="6" fill="${c}" opacity=".85"/>`,

  tshirt: c => `
    <path d="M28 22l-12 7 5 12 7-3v25h28V38l7 3 5-12-12-7-7 5h-14z"
          fill="${c}" opacity=".88" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M35 22q7 7 14 0" stroke="#0c0c0f" stroke-width="2" fill="none" opacity=".4"/>`,

  polo: c => `
    <path d="M28 22l-12 7 5 12 7-3v25h28V38l7 3 5-12-12-7-7 5h-14z"
          fill="${c}" opacity=".88" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M35 22l7 10 7-10" stroke="#0c0c0f" stroke-width="2.5" fill="none" opacity=".5"/>
    <path d="M42 32v9" stroke="#0c0c0f" stroke-width="2" opacity=".4"/>`,

  shoe: c => `
    <path d="M12 54h44c8 0 18-4 22-9 2-2 1-5-2-6l-16-5-9-7-8 4-10-2-21 3z"
          fill="${c}" opacity=".88"/>
    <path d="M12 54h66v6a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" fill="${c}" opacity=".55"/>
    <path d="M30 32l6 6M40 29l7 7" stroke="#0c0c0f" stroke-width="2" opacity=".35" stroke-linecap="round"/>`,

  runner: c => `
    <path d="M10 52h40c10 0 22-5 27-11 2-3 0-6-3-6l-14-3-11-9-7 5-9-2-23 4z"
          fill="${c}" opacity=".88"/>
    <path d="M10 52h67v6a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="${c}" opacity=".5"/>
    <path d="M26 30l5 7M35 26l6 8M44 24l5 8" stroke="#0c0c0f" stroke-width="2" opacity=".35" stroke-linecap="round"/>`,

  sandal: c => `
    <ellipse cx="42" cy="56" rx="30" ry="9" fill="${c}" opacity=".55"/>
    <path d="M18 50q24-12 48 0" stroke="${c}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".9"/>`,

  fabric: c => `
    <path d="M14 22h56v44H14z" fill="${c}" opacity=".3"/>
    <path d="M14 22q14 9 28 0t28 0" stroke="${c}" stroke-width="3" fill="none" opacity=".9"/>
    <path d="M14 36q14 9 28 0t28 0" stroke="${c}" stroke-width="3" fill="none" opacity=".75"/>
    <path d="M14 50q14 9 28 0t28 0" stroke="${c}" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M14 64q14 9 28 0t28 0" stroke="${c}" stroke-width="3" fill="none" opacity=".45"/>`,

  dupatta: c => `
    <path d="M16 26q13 12 26 0t26 0v8q-13 12-26 0t-26 0z" fill="${c}" opacity=".75"/>
    <path d="M16 44q13 12 26 0t26 0v8q-13 12-26 0t-26 0z" fill="${c}" opacity=".5"/>
    <path d="M16 62q13 11 26 0t26 0" stroke="${c}" stroke-width="3" fill="none" opacity=".8"/>`,

  petfood: c => `
    <path d="M24 32h36l-4 32a4 4 0 0 1-4 3H32a4 4 0 0 1-4-3z" fill="${c}" opacity=".85"/>
    <path d="M22 24h40v9H22z" rx="2" fill="${c}" opacity=".6"/>
    <circle cx="42" cy="48" r="4" fill="#0c0c0f" opacity=".35"/>
    <circle cx="35" cy="55" r="3" fill="#0c0c0f" opacity=".3"/>
    <circle cx="49" cy="55" r="3" fill="#0c0c0f" opacity=".3"/>`,

  pettoy: c => `
    <circle cx="42" cy="44" r="17" fill="${c}" opacity=".85"/>
    <circle cx="35" cy="38" r="3.5" fill="#0c0c0f" opacity=".5"/>
    <circle cx="49" cy="38" r="3.5" fill="#0c0c0f" opacity=".5"/>
    <path d="M36 50q6 5 12 0" stroke="#0c0c0f" stroke-width="2.5" fill="none" opacity=".45" stroke-linecap="round"/>
    <ellipse cx="27" cy="29" rx="6" ry="8" fill="${c}" opacity=".7"/>
    <ellipse cx="57" cy="29" rx="6" ry="8" fill="${c}" opacity=".7"/>`,

  harness: c => `
    <path d="M30 24h24v10H30z" fill="${c}" opacity=".8"/>
    <path d="M24 34h36v9H24z" fill="${c}" opacity=".6"/>
    <path d="M30 43v18M54 43v18" stroke="${c}" stroke-width="5" opacity=".75" stroke-linecap="round"/>
    <circle cx="42" cy="29" r="4" fill="#0c0c0f" opacity=".4"/>`,

  bottle: c => `
    <path d="M36 20h12v8l6 7v30a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4V35l6-7z" fill="${c}" opacity=".85"/>
    <rect x="33" y="42" width="18" height="14" rx="2" fill="#0c0c0f" opacity=".3"/>`,

  box: c => `
    <path d="M42 18l26 11v26L42 66 16 55V29z" fill="${c}" opacity=".75"/>
    <path d="M16 29l26 11 26-11M42 40v26" stroke="#0c0c0f" stroke-width="2" fill="none" opacity=".35"/>`,
};

/** Category → shape. Falls back to a generic box. */
function shapeFor(category: string, name: string): keyof typeof SHAPES {
  const c = category.toLowerCase();
  const n = name.toLowerCase();

  if (c.includes("earbud")) return "earbuds";
  if (c.includes("headphone")) return "headphones";
  if (c.includes("handsfree")) return "handsfree";
  if (c.includes("polo")) return "polo";
  if (c.includes("t-shirt") || c.includes("oversized")) return "tshirt";
  if (c.includes("running") || c.includes("jogger")) return "runner";
  if (c.includes("sandal") || c.includes("slide")) return "sandal";
  if (c.includes("shoe") || c.includes("formal")) return "shoe";
  if (n.includes("dupatta")) return "dupatta";
  if (c.includes("lawn") || c.includes("linen") || c.includes("silk") || c.includes("winter") || c.includes("embroidered")) return "fabric";
  if (c.includes("food")) return "petfood";
  if (c.includes("toy")) return "pettoy";
  if (c.includes("grooming")) return "bottle";
  if (c.includes("accessor")) return n.includes("harness") ? "harness" : "box";
  return "box";
}

/** Distinct tint per category, so a row of cards reads as a set. */
const TINTS: Record<string, string> = {
  Earbuds: "#6c63ff", Headphones: "#8b7fff", Handsfree: "#5a9bff", Accessories: "#7c8aa5",
  "Men's T-Shirts": "#f59e0b", "Women's T-Shirts": "#f472b6", Oversized: "#fbbf24", "Polo Shirts": "#34d399",
  "Casual Shoes": "#22c55e", "Joggers / Running": "#4ade80", Formal: "#64748b", "Sandals & Slides": "#2dd4bf",
  "Lawn / Summer": "#ec4899", Linen: "#d8b4a0", "Silk & Chiffon": "#c084fc", "Winter Fabric": "#818cf8", Embroidered: "#f0abfc",
  "Dog Food": "#f97316", "Cat Food": "#fb923c", "Toys & Enrichment": "#facc15", Grooming: "#38bdf8",
};

export function productImage(category: string, name: string): string {
  const tint = TINTS[category] ?? "#8888a0";
  const shape = SHAPES[shapeFor(category, name)](tint);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" width="84" height="84">` +
    `<rect width="84" height="84" rx="10" fill="${tint}" opacity=".12"/>` +
    shape +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
