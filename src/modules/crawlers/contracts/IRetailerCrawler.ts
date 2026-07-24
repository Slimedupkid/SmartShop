import { CrawlerResult } from './CrawlerResult';

export interface CrawlContext {
  storeBranchCode: string;
  searchTerm?: string;
  categoryId?: string;
}

export interface IRetailerCrawler {
  /**
   * The unique identifier for this retailer adapter.
   */
  readonly retailer: string;

  /**
   * Executes a scrape based on the provided context without throwing exceptions.
   * Internal failures must be caught and returned within the CrawlerResult.
   */
  crawl(context: CrawlContext): Promise<CrawlerResult>;
}