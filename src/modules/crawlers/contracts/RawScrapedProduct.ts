export type ScrapedAvailability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
export type SupportedRetailer = 'CHECKERS' | 'WOOLWORTHS' | 'PNP' | 'MAKRO' | 'SPAR';

export interface RawScrapedProduct {
  retailer: SupportedRetailer;
  retailerProductId: string;
  storeBranchCode: string; // The branch context used during the scrape
  barcode?: string;
  name: string;
  brand?: string;
  size?: string;
  productUrl: string;
  imageUrl?: string;
  priceInCents: number;
  promotionalPriceInCents?: number;
  promotionDetails?: string;
  availability: ScrapedAvailability;
  scrapedAt: Date;
}