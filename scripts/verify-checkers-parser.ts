import assert from 'node:assert/strict';
import { CheckersParser } from '../src/modules/crawlers/adapters/CheckersParser';
import { syntheticCheckersResponse, syntheticMalformedResponse } from '../src/modules/crawlers/__tests__/__fixtures__/checkersSyntheticFixture';
import { CrawlerParserException } from '../src/modules/crawlers/infrastructure/CrawlerExceptions';

function runParserVerification() {
  console.log('🧪 Running CheckersParser verification...\n');

  const parser = new CheckersParser();
  const testBranch = 'TEST_BRANCH_001';

  // 1. Verify Happy Path Parsing
  const results = parser.parse(syntheticCheckersResponse, testBranch);

  assert.equal(results.length, 2, 'Should parse exactly 2 products from fixture');

  // Product 1 Assertions (Discounted price, active stock, barcode, brand)
  assert.equal(results[0].retailer, 'CHECKERS');
  assert.equal(results[0].retailerProductId, 'SYNTH-001');
  assert.equal(results[0].priceInCents, 2999, 'Discounted price 29.99 should convert to 2999 cents');
  assert.equal(results[0].availability, 'IN_STOCK');
  assert.equal(results[0].barcode, '6000000000001');
  assert.equal(results[0].brand, 'Synthetic Farms');

  // Product 2 Assertions (Regular price, out of stock, empty optional fields)
  assert.equal(results[1].retailerProductId, 'SYNTH-002');
  assert.equal(results[1].priceInCents, 5500, 'Regular price 55.00 should convert to 5500 cents');
  assert.equal(results[1].availability, 'OUT_OF_STOCK');
  assert.equal(results[1].barcode, undefined);
  assert.equal(results[1].brand, undefined);

  console.log('✅ Happy path parsing verified successfully!');

  // 2. Verify Malformed Response Handling
  assert.throws(
    () => parser.parse(syntheticMalformedResponse, testBranch),
    (err: unknown) => err instanceof CrawlerParserException && err.message.includes('missing expected "products" array'),
    'Should throw CrawlerParserException on malformed object'
  );

  assert.throws(
    () => parser.parse(null, testBranch),
    (err: unknown) => err instanceof CrawlerParserException,
    'Should throw CrawlerParserException when raw response is null'
  );

  console.log('✅ Edge-case exception handling verified successfully!\n');
  console.log('🎉 All parser assertions passed!');
}

runParserVerification();