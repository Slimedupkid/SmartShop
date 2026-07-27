import { NextRequest, NextResponse } from 'next/server';
import { CrawlerHttpClient } from '../../../../modules/crawlers/infrastructure/CrawlerHttpClient';
import { CheckersCrawler } from '../../../../modules/crawlers/adapters/CheckersCrawler';
import { CrawlerService } from '../../../../modules/crawlers/services/CrawlerService';
import { env } from '../../../../core/config/env';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const storeBranchCode = searchParams.get('storeBranchCode') || env.CHECKERS_STORE_ID;

    // Instantiate infrastructure and adapters
    const httpClient = new CrawlerHttpClient();
    const checkersCrawler = new CheckersCrawler(httpClient);

    // Instantiate application service with injected crawlers
    const crawlerService = new CrawlerService([checkersCrawler]);

    // Execute multi-crawler search
    const result = await crawlerService.searchAll({
      storeBranchCode: storeBranchCode,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 207, // 207 Multi-Status if partial errors exist
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';

    return NextResponse.json(
      {
        success: false,
        data: [],
        errors: [
          {
            code: 'NETWORK_ERROR',
            message: message,
            retailer: 'CHECKERS',
          },
        ],
        metadata: {
          durationMs: 0,
          itemsFound: 0,
        },
      },
      { status: 500 }
    );
  }
}