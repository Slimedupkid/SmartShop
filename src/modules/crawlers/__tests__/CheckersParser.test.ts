import { CheckersParser } from '../adapters/CheckersParser';
import { checkersMockResponse, malformedMockResponse } from './__fixtures__/checkersMock';
import { CrawlerParserException } from '../infrastructure/CrawlerExceptions';

describe('CheckersParser', () => {
  let parser: CheckersParser;
  const mockStoreCode = 'STORE_123';

  beforeEach(() => {
    parser = new CheckersParser();
  });

  it('should successfully parse valid product data', () => {
    const results = parser.parse(checkersMockResponse, mockStoreCode);

    expect(results).toHaveLength(2);
    
    // Test Product 1: Full data (uses discounted price)
    expect(results[0]).toMatchObject({
      retailer: 'CHECKERS',
      retailerProductId: '10111222',
      storeBranchCode: mockStoreCode,
      barcode: '6001234567890',
      name: 'Checkers House Brand Full Cream Milk 2L',
      brand: 'House Brand',
      priceInCents: 2499, // 24.99 * 100
      availability: 'IN_STOCK',
      productUrl: 'https://www.checkers.co.za/p/10111222'
    });

    // Test Product 2: Missing optional data (uses regular price, out of stock)
    expect(results[1]).toMatchObject({
      retailerProductId: '10111333',
      barcode: undefined,
      brand: undefined,
      priceInCents: 1500, // 15.00 * 100
      availability: 'OUT_OF_STOCK'
    });
  });

  it('should throw CrawlerParserException if products array is missing', () => {
    expect(() => {
      parser.parse(malformedMockResponse, mockStoreCode);
    }).toThrow(CrawlerParserException);
    
    expect(() => {
      parser.parse(malformedMockResponse, mockStoreCode);
    }).toThrow('Response missing expected "products" array');
  });

  it('should throw CrawlerParserException if response is null or not an object', () => {
    expect(() => parser.parse(null, mockStoreCode)).toThrow(CrawlerParserException);
    expect(() => parser.parse('string_response', mockStoreCode)).toThrow(CrawlerParserException);
  });
});