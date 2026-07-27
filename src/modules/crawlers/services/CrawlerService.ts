import { IRetailerCrawler, CrawlContext } from '../contracts/IRetailerCrawler';
import { CrawlerResult } from '../contracts/CrawlerResult';

export class CrawlerService {
  /**
   * @param crawlers - An array of crawler implementations injected at runtime.
   * This ensures the service knows nothing about Checkers, HTTP, or Parsers.
   */
  constructor(private readonly crawlers: IRetailerCrawler[]) {}

  /**
   * Executes a search across all injected crawlers concurrently and aggregates the results.
   */
  async searchAll(context: CrawlContext): Promise<CrawlerResult> {
    const startTime = Date.now();

    // Execute all crawlers concurrently. 
    // We do not wrap this in try/catch because the IRetailerCrawler contract 
    // strictly guarantees that crawlers swallow their own errors and return them in the CrawlerResult.
    const crawlPromises = this.crawlers.map(crawler => crawler.crawl(context));
    const results = await Promise.all(crawlPromises);

    const unifiedResult: CrawlerResult = {
      success: true,
      data: [],
      errors: [],
      metadata: {
        durationMs: 0,
        itemsFound: 0
      }
    };

    // Aggregate data, errors, and metadata from all crawler responses
    for (const result of results) {
      unifiedResult.data.push(...result.data);
      unifiedResult.errors.push(...result.errors);
      unifiedResult.metadata.itemsFound += result.metadata.itemsFound;
      
      // If any individual crawler failed, we mark the aggregate success as false, 
      // but still return any partial data successfully scraped by other crawlers.
      if (!result.success) {
        unifiedResult.success = false;
      }
    }

    unifiedResult.metadata.durationMs = Date.now() - startTime;
    return unifiedResult;
  }
}