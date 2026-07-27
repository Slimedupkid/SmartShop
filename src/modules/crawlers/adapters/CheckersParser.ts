import { RawScrapedProduct, SupportedRetailer } from '../contracts/RawScrapedProduct';
import { CrawlerParserException } from '../infrastructure/CrawlerExceptions';

export class CheckersParser {
  private readonly retailer: SupportedRetailer = 'CHECKERS';

  /**
   * Transforms raw JSON from the Checkers API into our domain-neutral contract.
   */
  parse(rawData: unknown, storeBranchCode: string): RawScrapedProduct[] {
    if (!rawData || typeof rawData !== 'object') {
      throw new CrawlerParserException('Response is not a valid JSON object');
    }

    const data = rawData as Record<string, unknown>;

    if (!Array.isArray(data.products)) {
      throw new CrawlerParserException('Response missing expected "products" array');
    }

    return data.products.map((item: unknown) => {
      if (!item || typeof item !== 'object') {
        throw new CrawlerParserException('Product item is not a valid object');
      }

      const product = item as Record<string, unknown>;

      // Price: Use discountedPrice if available, otherwise fallback to price
      const discountedPrice = typeof product.discountedPrice === 'number' ? product.discountedPrice : 0;
      const regularPrice = typeof product.price === 'number' ? product.price : 0;
      const finalPrice = discountedPrice > 0 ? discountedPrice : regularPrice;
      const priceInCents = Math.round(finalPrice * 100);

      // Identifiers
      const id = typeof product.id === 'string' ? product.id : 
                 (typeof product.articleNumber === 'string' ? product.articleNumber : 'UNKNOWN');
                 
      const barcodes = Array.isArray(product.barcodes) && typeof product.barcodes[0] === 'string' 
                       ? product.barcodes[0] : undefined;
                       
      // Metadata
      const displayName = typeof product.displayName === 'string' ? product.displayName : 'Unknown Product';
      const active = typeof product.active === 'boolean' ? product.active : false;
      const brand = typeof product.brand === 'string' ? product.brand : undefined;

      return {
        retailer: this.retailer,
        retailerProductId: id,
        storeBranchCode: storeBranchCode,
        barcode: barcodes,
        name: displayName,
        brand: brand,
        productUrl: id !== 'UNKNOWN' ? `https://www.checkers.co.za/p/${id}` : '',
        priceInCents: priceInCents,
        availability: active ? 'IN_STOCK' : 'OUT_OF_STOCK',
        scrapedAt: new Date()
      };
    });
  }
}