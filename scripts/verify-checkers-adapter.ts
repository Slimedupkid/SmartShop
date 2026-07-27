import assert from 'node:assert/strict';
import { CheckersCrawler } from '../src/modules/crawlers/adapters/CheckersCrawler';
import { CrawlerHttpClient } from '../src/modules/crawlers/infrastructure/CrawlerHttpClient';
import { syntheticCheckersResponse, syntheticMalformedResponse } from '../src/modules/crawlers/__tests__/__fixtures__/checkersSyntheticFixture';

// 1. Create a mocked HTTP client to completely bypass the live network
class MockHttpClient extends CrawlerHttpClient {
  public mockResponseData: unknown;

  // Override the request method to intercept the fetch call
  async request(url: string, options?: RequestInit): Promise<Response> {
    return {
      json: async () => this.mockResponseData,
      ok: true,
      status: 200,
    } as Response;
  }
}

async function runAdapterVerification() {
  console.log('🧪 Running CheckersCrawler adapter verification (Mocked Network)...\n');

  const mockClient = new MockHttpClient();
  const crawler = new CheckersCrawler(mockClient);
  const testBranch = 'TEST_BRANCH_001';

  try {
    // --- TEST 1: Happy Path (Valid Synthetic Data) ---
    mockClient.mockResponseData = syntheticCheckersResponse;
    const successResult = await crawler.crawl({ storeBranchCode: testBranch });

    assert.equal(successResult.success, true, 'Crawler should return success: true');
    assert.equal(successResult.data.length, 2, 'Crawler should return 2 products');
    assert.equal(successResult.errors.length, 0, 'Crawler should have no errors');
    assert.equal(successResult.metadata.itemsFound, 2, 'Metadata should reflect 2 items');
    assert.equal(successResult.data[0].retailerProductId, 'SYNTH-001', 'Data should be correctly parsed');

    console.log('✅ Adapter successfully orchestrated the HTTP client and parser (Happy Path)!');

    // --- TEST 2: Error Mapping (Malformed Data) ---
    mockClient.mockResponseData = syntheticMalformedResponse;
    const errorResult = await crawler.crawl({ storeBranchCode: testBranch });

    assert.equal(errorResult.success, false, 'Crawler should return success: false on malformed data');
    assert.equal(errorResult.data.length, 0, 'Crawler should return 0 products');
    assert.equal(errorResult.errors.length, 1, 'Crawler should return exactly 1 error');
    assert.equal(errorResult.errors[0].code, 'PARSER_ERROR', 'Crawler should map the error to PARSER_ERROR');
    
    console.log('✅ Adapter successfully caught and mapped parser exceptions to CrawlerResult!\n');
    console.log('🎉 All adapter orchestrations passed!');

  } catch (error) {
    console.error('\n🔥 Fatal error during verification:', error);
    process.exit(1);
  }
}

runAdapterVerification();