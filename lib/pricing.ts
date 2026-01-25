// lib/pricing.ts

// Prix fixes (en euros) pour 1 à 20 photos
const FIXED_PRICES: Record<number, number> = {
  1: 8,
  2: 16,
  3: 20,
  4: 28,
  5: 30,
  6: 38,
  7: 46,
  8: 50,
  9: 58,
  10: 60,
  11: 68,
  12: 76,
  13: 80,
  14: 88,
  15: 90,
  16: 98,
  17: 106,
  18: 110,
  19: 118,
  20: 120,
};

// Packs disponibles = on autorise à combiner ces “tailles” avec leur prix
// Ici on prend tous les prix 1..20 comme packs possibles,
// ce qui garantit toujours le meilleur prix (même si tes offres changent).
const PACK_SIZES = Object.keys(FIXED_PRICES).map(Number).sort((a, b) => a - b);

export function calculateTotalPrice(photoCount: number): number {
  if (photoCount <= 0) return 0;

  // Si <= 20 : prix direct
  if (photoCount <= 20) return FIXED_PRICES[photoCount];

  // Sinon : on fait un "min cost" (DP) avec les packs
  // dp[n] = prix minimum pour n photos
  const dp: number[] = new Array(photoCount + 1).fill(Infinity);
  dp[0] = 0;

  for (let n = 1; n <= photoCount; n++) {
    for (const size of PACK_SIZES) {
      if (size <= n) {
        dp[n] = Math.min(dp[n], dp[n - size] + FIXED_PRICES[size]);
      }
    }
  }

  return dp[photoCount];
}

export function calculateTotalPriceCents(photoCount: number): number {
  return Math.round(calculateTotalPrice(photoCount) * 100);
}
