/**
 * Generic HTTP client for crawler infrastructure.
 * Handles timeouts, retries, and normalizes fetch responses.
 * Strictly decoupled from any specific retailer logic.
 */

export interface HttpClientOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

export class CrawlerHttpClient {
  /**
   * Executes a POST request with automatic retries and timeout handling.
   */
  static async post<T>(url: string, body: any, options?: HttpClientOptions): Promise<T> {
    const retries = options?.retries ?? 3;
    const timeoutMs = options?.timeoutMs ?? 15000; // 15 second default timeout

    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options?.headers,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          return await response.json() as T;
        }

        // Handle specific failure modes
        if (response.status === 401 || response.status === 403) {
          throw new Error(`AUTH_ERROR: Access denied. Cookie/Token may be expired. Status: ${response.status}`);
        }

        if (response.status === 429) {
          if (attempt === retries) throw new Error(`RATE_LIMITED: Max retries reached.`);
          // Exponential backoff: 2s, 4s, 8s...
          const backoff = Math.pow(2, attempt) * 1000;
          await this.delay(backoff);
          continue; 
        }

        if (response.status >= 500) {
          if (attempt === retries) throw new Error(`NETWORK_ERROR: Server error. Status: ${response.status}`);
          await this.delay(2000); // Wait 2s for server hiccups
          continue;
        }

        // Unhandled 4xx errors
        throw new Error(`NETWORK_ERROR: Unexpected status ${response.status}`);

      } catch (error: any) {
        clearTimeout(timeoutId);

        // AbortController throws an 'AbortError' name when timeout hits
        if (error.name === 'AbortError') {
          if (attempt === retries) throw new Error(`NETWORK_ERROR: Request timed out after ${timeoutMs}ms`);
          continue; // Retry on timeout
        }

        // If it's our custom auth error, throw immediately, don't retry
        if (error.message.includes('AUTH_ERROR')) {
          throw error;
        }

        if (attempt === retries) throw error;
      }
    }

    throw new Error('NETWORK_ERROR: Unknown request failure');
  }

  private static delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}