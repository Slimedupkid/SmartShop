import { 
  CrawlerException, 
  CrawlerAuthException, 
  CrawlerNetworkException, 
  CrawlerRateLimitException 
} from './CrawlerExceptions';

/**
 * Strategy interface for determining if and how long to wait before retrying.
 */
export interface CrawlerRetryStrategy {
  shouldRetry(response: Response | null, error: Error | null, attempt: number): boolean;
  calculateBackoff(attempt: number, response: Response | null): number;
}

/**
 * A sensible default exponential backoff strategy.
 */
export class DefaultRetryStrategy implements CrawlerRetryStrategy {
  constructor(private maxRetries: number = 3, private baseBackoffMs: number = 1000) {}

  shouldRetry(response: Response | null, error: Error | null, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;
    
    // Retry on network crashes (fetch throws)
    if (error && (error.name === 'TimeoutError' || error.name === 'AbortError' || error.name === 'TypeError')) {
      return true;
    }

    if (response) {
      // Retry on Rate Limits or Server Errors
      if (response.status === 429 || response.status >= 500) return true;
    }

    return false;
  }

  calculateBackoff(attempt: number, response: Response | null): number {
    // Respect Retry-After header if provided by a WAF
    if (response?.headers.has('retry-after')) {
      const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
      if (!isNaN(retryAfter) && retryAfter > 0) return retryAfter * 1000;
    }
    return this.baseBackoffMs * Math.pow(2, attempt - 1);
  }
}

export interface CrawlerHttpConfig {
  timeoutMs: number;
  retryStrategy: CrawlerRetryStrategy;
}

export class CrawlerHttpClient {
  private config: CrawlerHttpConfig;

  constructor(config?: Partial<CrawlerHttpConfig>) {
    this.config = {
      timeoutMs: 15000,
      retryStrategy: new DefaultRetryStrategy(),
      ...config
    };
  }

  /**
   * Executes a resilient HTTP request, returning the native Response.
   * Caller is responsible for parsing (e.g., res.json() or res.text()).
   */
  async request(url: string, options: RequestInit = {}): Promise<Response> {
    let attempt = 1;

    while (true) {
      // Combine external caller aborts with our internal timeout
      const timeoutSignal = AbortSignal.timeout(this.config.timeoutMs);
      const signal = options.signal 
        ? AbortSignal.any([options.signal, timeoutSignal]) 
        : timeoutSignal;
      
      let response: Response | null = null;
      let caughtError: Error | null = null;

      try {
        response = await fetch(url, { ...options, signal });

        if (response.ok) {
          return response;
        }

        this.validateStatus(response);

      } catch (error: any) {
        caughtError = error;
        
        // Bubble up our typed exceptions immediately without retrying if they are fatal (like Auth)
        if (error instanceof CrawlerAuthException) {
          throw error;
        }
      }

      if (this.config.retryStrategy.shouldRetry(response, caughtError, attempt)) {
        const backoffMs = this.config.retryStrategy.calculateBackoff(attempt, response);
        await this.delay(backoffMs);
        attempt++;
        continue;
      }

      // If we exhaust retries or shouldn't retry, throw the final error
      if (caughtError) {
        if (caughtError instanceof CrawlerException) throw caughtError;
        throw new CrawlerNetworkException(caughtError.message || 'Unknown network failure');
      }

      if (response) {
        throw new CrawlerNetworkException(`Unhandled HTTP status ${response.status}`, response.status);
      }
    }
  }

  /**
   * Translates fatal HTTP statuses into typed domain exceptions.
   */
  private validateStatus(response: Response): void {
    if (response.status === 401 || response.status === 403) {
      throw new CrawlerAuthException(`Access denied (Status: ${response.status}). WAF blocked or cookie expired.`, response.status);
    }
    if (response.status === 429) {
      throw new CrawlerRateLimitException('Rate limit exhausted', response.status);
    }
    if (response.status >= 500) {
      throw new CrawlerNetworkException(`Server error (Status: ${response.status})`, response.status);
    }
    throw new CrawlerNetworkException(`Client request invalid (Status: ${response.status})`, response.status);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}