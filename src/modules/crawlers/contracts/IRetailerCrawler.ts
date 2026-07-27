import { CrawlerResult } from './CrawlerResult';

export interface CrawlContext {
  storeBranchCode: string;
  searchTerm: string; // <-- Added to support the new search payload
}

export interface IRetailerCrawler {
  readonly retailer: string;
  crawl(context: CrawlContext): Promise<CrawlerResult>;
}