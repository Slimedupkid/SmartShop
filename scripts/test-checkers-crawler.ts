import { CheckersCrawler } from '../src/modules/crawlers/adapters/CheckersCrawler';
import { CrawlerHttpClient } from '../src/modules/crawlers/infrastructure/CrawlerHttpClient';
import { env } from '../src/core/config/env';

async function runTest() {
  console.log('Starting live CheckersCrawler test...');
  
  const httpClient = new CrawlerHttpClient();
  const crawler = new CheckersCrawler(httpClient);

  try {
    // Fire the crawl execution
    const result = await crawler.crawl({
      storeBranchCode: env.CHECKERS_STORE_ID,
      searchTerm: 'milk' // <-- FIX: Added the missing searchTerm property
    });

    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();