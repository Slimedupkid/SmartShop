import { RawScrapedProduct } from './RawScrapedProduct';

export interface CrawlerError {
  code: 'NETWORK_ERROR' | 'PARSER_ERROR' | 'AUTH_ERROR' | 'RATE_LIMITED';
  message: string;
  retailer: string;
  context?: any;
}

export interface CrawlerResult {
  success: boolean;
  data: RawScrapedProduct[];
  errors: CrawlerError[];
  metadata: {
    durationMs: number;
    itemsFound: number;
  };
}