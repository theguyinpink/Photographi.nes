// lib/pricing.ts

export function calculateTotalPrice(photoCount: number): number {
  if (photoCount <= 0) return 0;

  switch (photoCount) {
    case 1:
      return 8;
    case 2:
      return 16;
    case 3:
      return 20;
    case 4:
      return 28; // pack 3 + 1
    case 5:
      return 30;
    case 6:
      return 38;
    case 7:
      return 48;
    case 8:
      return 56;
    case 9:
      return 58;
    case 10:
      return 60;
    default:
      return photoCount * 8;
  }
}

export function calculateTotalPriceCents(photoCount: number): number {
  return calculateTotalPrice(photoCount) * 100;
}
