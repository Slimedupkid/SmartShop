export class CrawlerException extends Error {
  constructor(public readonly code: string, message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'CrawlerException';
  }
}

export class CrawlerAuthException extends CrawlerException {
  constructor(message: string = 'Authentication failed or cookie expired', statusCode?: number) {
    super('AUTH_ERROR', message, statusCode);
    this.name = 'CrawlerAuthException';
  }
}

export class CrawlerRateLimitException extends CrawlerException {
  constructor(message: string = 'Rate limit exceeded', statusCode?: number) {
    super('RATE_LIMITED', message, statusCode);
    this.name = 'CrawlerRateLimitException';
  }
}

export class CrawlerNetworkException extends CrawlerException {
  constructor(message: string, statusCode?: number) {
    super('NETWORK_ERROR', message, statusCode);
    this.name = 'CrawlerNetworkException';
  }
}