import { 
  CrawlerException, 
  CrawlerAuthException, 
  CrawlerNetworkException, 
  CrawlerRateLimitException 
} from './CrawlerExceptions';

export interface CrawlerRetryStrategy {
  shouldRetry(response: Response | null, error: Error | null, attempt: number): boolean;
  calculateBackoff(attempt: number, response: Response | null): number;
}

export class DefaultRetryStrategy implements CrawlerRetryStrategy {
  constructor(private maxRetries: number = 3, private baseBackoffMs: number = 1000) {}

  shouldRetry(response: Response | null, error: Error | null, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;
    
    if (error && (error.name === 'TimeoutError' || error.name === 'AbortError' || error.name === 'TypeError')) {
      return true;
    }

    if (response && (response.status === 429 || response.status >= 500)) {
      return true;
    }

    return false;
  }

  calculateBackoff(attempt: number, response: Response | null): number {
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

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    let attempt = 1;

    while (true) {
      const timeoutSignal = AbortSignal.timeout(this.config.timeoutMs);
      const signal = options.signal 
        ? AbortSignal.any([options.signal, timeoutSignal]) 
        : timeoutSignal;
      
      let response: Response | null = null;
      let caughtError: Error | null = null;

      try {
        response = await fetch(url, { ...options, signal });
      } catch (error: any) {
        caughtError = error;
      }

      // 1. Success Path
      if (response && response.ok) {
        return response;
      }

      // 2. Fatal Authentication Path (Never Retry)
      if (response && (response.status === 401 || response.status === 403)) {
        throw new CrawlerAuthException(`Access denied (Status: ${response.status}). WAF blocked or cookie expired.`, response.status);
      }

      // 3. Retry Path
      if (this.config.retryStrategy.shouldRetry(response, caughtError, attempt)) {
        const backoffMs = this.config.retryStrategy.calculateBackoff(attempt, response);
        await this.delay(backoffMs);
        attempt++;
        continue;
      }

      // 4. Terminal Failure Path (Map to Typed Exceptions)
      if (caughtError) {
        if (caughtError instanceof CrawlerException) throw caughtError;
        throw new CrawlerNetworkException(caughtError.message || 'Unknown network failure');
      }

      if (response) {
        if (response.status === 429) {
          throw new CrawlerRateLimitException('Rate limit exhausted after retries', response.status);
        }
        if (response.status >= 500) {
          throw new CrawlerNetworkException(`Server error (Status: ${response.status})`, response.status);
        }
        throw new CrawlerNetworkException(`Client request invalid (Status: ${response.status})`, response.status);
      }

      throw new CrawlerNetworkException('Unexpected request failure');
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}