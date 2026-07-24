import { 
  CrawlerException, // Added the missing base class import
  CrawlerAuthException, 
  CrawlerNetworkException, 
  CrawlerRateLimitException 
} from './CrawlerExceptions';

export interface CrawlerHttpConfig {
  timeoutMs: number;
  maxRetries: number;
  baseBackoffMs: number;
}

const DEFAULT_CONFIG: CrawlerHttpConfig = {
  timeoutMs: 15000,
  maxRetries: 3,
  baseBackoffMs: 1000,
};

export class CrawlerHttpClient {
  private config: CrawlerHttpConfig;

  constructor(config?: Partial<CrawlerHttpConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Executes a generic HTTP request with automatic resilience.
   */
  async request<T>(url: string, options: RequestInit): Promise<T> {
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      // Modern Node/Web API: AbortSignal.timeout is cleaner than setTimeout
      const signal = AbortSignal.timeout(this.config.timeoutMs);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal,
          // Next.js specific: bypass Next.js data cache for real-time crawler data
          cache: 'no-store', 
        });

        if (response.ok) {
          return await response.json() as T;
        }

        this.handleErrorStatus(response.status, attempt);

      } catch (error: any) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
          if (attempt === this.config.maxRetries) {
            throw new CrawlerNetworkException(`Request timed out after ${this.config.timeoutMs}ms`);
          }
          await this.delay(this.calculateBackoff(attempt));
          continue;
        }

        // If it's already our typed exception, bubble it up immediately
        if (error instanceof CrawlerException) {
          throw error;
        }

        // Unhandled fetch crashes (e.g. DNS failure)
        if (attempt === this.config.maxRetries) {
          throw new CrawlerNetworkException(error.message || 'Unknown network failure');
        }
      }
      
      await this.delay(this.calculateBackoff(attempt));
    }

    throw new CrawlerNetworkException('Max retries exhausted');
  }

  private handleErrorStatus(status: number, attempt: number): void {
    if (status === 401 || status === 403) {
      // Never retry auth errors
      throw new CrawlerAuthException(`Access denied (Status: ${status}). Cookie may be expired.`, status);
    }

    if (status === 429) {
      if (attempt === this.config.maxRetries) {
        throw new CrawlerRateLimitException('Rate limit exhausted after retries', status);
      }
      return; // Handled by outer retry loop
    }

    if (status >= 500) {
      if (attempt === this.config.maxRetries) {
        throw new CrawlerNetworkException(`Server error (Status: ${status})`, status);
      }
      return; // Handled by outer retry loop
    }

    // Unhandled 4xx (e.g. 404, 400) should fail immediately, as retrying a bad request is pointless
    throw new CrawlerNetworkException(`Client request invalid (Status: ${status})`, status);
  }

  private calculateBackoff(attempt: number): number {
    return this.config.baseBackoffMs * Math.pow(2, attempt - 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}