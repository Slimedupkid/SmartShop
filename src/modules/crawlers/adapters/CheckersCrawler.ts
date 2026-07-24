import { IRetailerCrawler, CrawlContext } from '../contracts/IRetailerCrawler';
import { CrawlerResult } from '../contracts/CrawlerResult';
import { RawScrapedProduct, SupportedRetailer } from '../contracts/RawScrapedProduct';
import { CrawlerHttpClient } from '../infrastructure/CrawlerHttpClient';
import { CrawlerException } from '../infrastructure/CrawlerExceptions';
import { env } from '../../../core/config/env';

export class CheckersCrawler implements IRetailerCrawler {
  public readonly retailer: SupportedRetailer = 'CHECKERS';
  private readonly baseUrl = 'https://www.checkers.co.za/api/catalogue/get-products-filter';

  constructor(private readonly httpClient: CrawlerHttpClient) {}

  async crawl(context: CrawlContext): Promise<CrawlerResult> {
    const startTime = Date.now();
    
    try {
      // 1. Construct the exactly verified payload
      const payload = this.buildObservedPayload();

      // 2. Execute via our generic infrastructure client
      const response = await this.httpClient.request(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': env.CHECKERS_COOKIE,
        },
        body: JSON.stringify(payload)
      });

      const rawData = await response.json();
      
      // 3. Parse fields based strictly on observed DevTools data
      const products = this.parseResponse(rawData, context.storeBranchCode);

      return {
        success: true,
        data: products,
        errors: [],
        metadata: {
          durationMs: Date.now() - startTime,
          itemsFound: products.length
        }
      };

    } catch (error: any) {
      // Map custom parser errors
      if (error.name === 'ParserError') {
        return {
          success: false,
          data: [],
          errors: [{ code: 'PARSER_ERROR', message: error.message, retailer: this.retailer }],
          metadata: { durationMs: Date.now() - startTime, itemsFound: 0 }
        };
      }

      // Map infrastructure network/auth errors
      const isCrawlerException = error instanceof CrawlerException;
      return {
        success: false,
        data: [],
        errors: [{
          code: isCrawlerException ? (error.code as any) : 'NETWORK_ERROR',
          message: error.message || 'Unknown network error occurred',
          retailer: this.retailer
        }],
        metadata: {
          durationMs: Date.now() - startTime,
          itemsFound: 0
        }
      };
    }
  }

  /**
   * EXACT payload captured from DevTools Network Tab.
   * Dynamic search logic is explicitly deferred until we capture a real search request.
   */
  private buildObservedPayload() {
    return {
      storeContexts: [],
      filterData: {
        filter: {
          showAllDisplayVariants: false,
          showNotRangedProducts: false
        },
        forYouBonusBuyIds: [],
        isCarousel: true,
        storeContexts: [],
        url: "/api/v3/products/product-list-page"
      }
    };
  }

  /**
   * Maps only fields explicitly observed in the DevTools Preview Tab.
   */
  private parseResponse(rawData: any, storeBranchCode: string): RawScrapedProduct[] {
    if (!rawData || !Array.isArray(rawData.products)) {
      throw { name: 'ParserError', message: 'Response missing expected "products" array' };
    }

    return rawData.products.map((item: any) => {
      // Observed field: 'discountedPrice' (e.g., 179.99). Fallback to 0 if missing.
      const priceInCents = item.discountedPrice ? Math.round(item.discountedPrice * 100) : 0;

      return {
        retailer: this.retailer,
        retailerProductId: item.id || item.articleNumber || 'UNKNOWN',
        storeBranchCode: storeBranchCode,
        barcode: item.barcodes && item.barcodes.length > 0 ? item.barcodes[0] : undefined,
        name: item.displayName || 'Unknown Product',
        brand: undefined, // UNVERIFIED
        productUrl: '',   // UNVERIFIED: deferred until URL pattern is proven
        priceInCents: priceInCents,
        availability: item.active ? 'IN_STOCK' : 'OUT_OF_STOCK', // Observed 'active' boolean
        scrapedAt: new Date()
      };
    });
  }
}