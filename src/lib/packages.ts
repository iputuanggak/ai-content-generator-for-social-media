export interface CreditPackage {
  slug: string;
  credits: number;
  priceCents: number;
  priceLabel: string;
  perCreditLabel: string;
  priceEnvVar: string;
}

export const PACKAGES: CreditPackage[] = [
  {
    slug: "starter",
    credits: 100,
    priceCents: 500,
    priceLabel: "$5",
    perCreditLabel: "$0.050 / credit",
    priceEnvVar: "STRIPE_PRICE_STARTER",
  },
  {
    slug: "growth",
    credits: 500,
    priceCents: 2000,
    priceLabel: "$20",
    perCreditLabel: "$0.040 / credit",
    priceEnvVar: "STRIPE_PRICE_GROWTH",
  },
  {
    slug: "pro",
    credits: 2000,
    priceCents: 6000,
    priceLabel: "$60",
    perCreditLabel: "$0.030 / credit",
    priceEnvVar: "STRIPE_PRICE_PRO",
  },
];

export function getPackage(slug: string): CreditPackage | undefined {
  return PACKAGES.find((p) => p.slug === slug);
}

export function getStripePriceId(pkg: CreditPackage): string | undefined {
  return process.env[pkg.priceEnvVar];
}
