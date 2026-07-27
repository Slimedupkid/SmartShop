import assert from 'node:assert/strict';
import { CrawlerService } from '../src/modules/crawlers/services/CrawlerService';
import { IRetailerCrawler, CrawlContext } from '../src/modules/crawlers/contracts/IRetailerCrawler';
import { CrawlerResult } from '../src/modules/crawlers/contracts/CrawlerResult';

// Stub crawlers for orchestration testing
class MockSuccessCrawler implements IRetailerCrawler {
  retailer = 'CHECKERS' as const;
  async crawl(context: CrawlContext): Promise<CrawlerResult> {
    return {
      success: true,
      data: [{ retailer: this.retailer, retailerProductId: '1', storeBranchCode: context.storeBranchCode, name: 'Apple', priceInCents: 100, availability: 'IN_STOCK', scrapedAt: new Date(), productUrl: '' }],
      errors: [],
      metadata: { durationMs: 10, itemsFound: 1 }
    };
  }
}

class MockFailingCrawler implements IRetailerCrawler {
  retailer = 'CHECKERS' as const; // Reusing string for mock simplicity
  async crawl(context: CrawlContext): Promise<CrawlerResult> {
    return {
      success: false,
      data: [],
      errors: [{ code: 'NETWORK_ERROR', message: 'Timeout', retailer: this.retailer }],
      metadata: { durationMs: 50, itemsFound: 0 }
    };
  }
}

async function runServiceVerification() {
  console.log('🧪 Running CrawlerService orchestration verification...\n');

  const successCrawler = new MockSuccessCrawler();
  const failCrawler = new MockFailingCrawler();
  
  // Inject both crawlers into the service
  const service = new CrawlerService([successCrawler, failCrawler]);

  const result = await service.searchAll({ storeBranchCode: 'TEST' });

  // Assertions
  assert.equal(result.success, false, 'Overall success should be false if one crawler fails');
  assert.equal(result.data.length, 1, 'Service should still aggregate data from successful crawlers');
  assert.equal(result.errors.length, 1, 'Service should aggregate errors from failed crawlers');
  assert.equal(result.metadata.itemsFound, 1, 'Metadata count should aggregate correctly');

  console.log('✅ Service successfully executed concurrently and aggregated partial results!');
  console.log('🎉 Application orchestration layer is verified!');
}

runServiceVerification();