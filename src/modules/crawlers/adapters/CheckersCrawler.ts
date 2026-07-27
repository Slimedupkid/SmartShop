import { IRetailerCrawler, CrawlContext } from '../contracts/IRetailerCrawler';
import { CrawlerResult } from '../contracts/CrawlerResult';
import { SupportedRetailer } from '../contracts/RawScrapedProduct';
import { CrawlerHttpClient } from '../infrastructure/CrawlerHttpClient';
import { CrawlerException, CrawlerParserException } from '../infrastructure/CrawlerExceptions';
import { CheckersParser } from './CheckersParser';
import { env } from '../../../core/config/env';

export class CheckersCrawler implements IRetailerCrawler {
  public readonly retailer: SupportedRetailer = 'CHECKERS';
  private readonly baseUrl = 'https://www.checkers.co.za/api/catalogue/get-products-filter';
  private readonly parser: CheckersParser;

  constructor(private readonly httpClient: CrawlerHttpClient) {
    this.parser = new CheckersParser();
  }

  async crawl(context: CrawlContext): Promise<CrawlerResult> {
    const startTime = Date.now();
    
    try {
      const payload = this.buildObservedPayload();

      const response = await this.httpClient.request(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Cookie': env.CHECKERS_COOKIE,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Origin': 'https://www.checkers.co.za',
          'Referer': 'https://www.checkers.co.za/',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        body: JSON.stringify(payload)
      });

      const rawData: unknown = await response.json();
      
      // Delegate transformation to the verified parser
      const products = this.parser.parse(rawData, context.storeBranchCode);

      return {
        success: true,
        data: products,
        errors: [],
        metadata: {
          durationMs: Date.now() - startTime,
          itemsFound: products.length
        }
      };

    } catch (error: unknown) {
      const isCrawlerException = error instanceof CrawlerException;
      const isParserException = error instanceof CrawlerParserException;
      const message = error instanceof Error ? error.message : 'Unknown error occurred during Checkers crawl';
      
      return {
        success: false,
        data: [],
        errors: [{
          code: isParserException ? 'PARSER_ERROR' : (isCrawlerException ? (error as CrawlerException).code : 'NETWORK_ERROR'),
          message: message,
          retailer: this.retailer
        }],
        metadata: {
          durationMs: Date.now() - startTime,
          itemsFound: 0
        }
      };
    }
  }

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
}