import { CrawlerHttpClient } from '../src/modules/crawlers/infrastructure/CrawlerHttpClient';
import { CheckersCrawler } from '../src/modules/crawlers/adapters/CheckersCrawler';
import { env } from '../src/core/config/env';

async function runTest() {
  console.log('🚀 Starting Checkers Crawler Integration Test...\n');

  try {
    const httpClient = new CrawlerHttpClient();
    const crawler = new CheckersCrawler(httpClient);

    console.log(`📡 Sending request to Checkers API using branch context: ${env.CHECKERS_STORE_ID}`);
    
    // Fire the crawl execution
    const result = await crawler.crawl({
      storeBranchCode: env.CHECKERS_STORE_ID
    });

    // 1. Print Metadata & Status
    console.log('\n--- Crawl Result ---');
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️ Duration: ${result.metadata.durationMs}ms`);
    console.log(`📦 Items Found: ${result.metadata.itemsFound}`);

    // 2. Print Errors (if any)
    if (result.errors.length > 0) {
      console.log('\n❌ Crawler Errors:');
      console.dir(result.errors, { depth: null });
    }

    // 3. Print First Product OR Raw response instructions
    if (result.data.length > 0) {
      console.log('\n🛒 First Product Result (Mapped):');
      console.dir(result.data[0], { depth: null });
      console.log('\n🎉 Phase 3 integration successful! Proceed to Phase 4 (Parser).');
    } else if (!result.success) {
      console.log('\n⚠️ Check the errors above. If authentication failed, update your CHECKERS_COOKIE in .env.local.');
      console.log('⚠️ If parsing failed, the API payload/response shape may differ from our assumption. Capture the new payload in DevTools.');
    }

  } catch (error) {
    console.error('\n🔥 Fatal error executing test script:', error);
  }
}

runTest();