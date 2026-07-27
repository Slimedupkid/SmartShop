import { chromium } from 'playwright';

async function runSpike() {
  console.log('🚀 Starting Checkers Playwright Spike...\n');
  
  // 1. Launch a visible browser so you can watch if Cloudflare blocks it
  const browser = await chromium.launch({ headless: false }); 
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1️⃣ Navigating to checkers.co.za...');
    await page.goto('https://www.checkers.co.za', { waitUntil: 'networkidle' });
    
    // Wait for 3 seconds to let any background anti-bot scripts run and cookies to settle
    await page.waitForTimeout(3000); 

    console.log('\n2️⃣ Extracting Session Data...');
    const cookies = await context.cookies();
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const localStorageData = await page.evaluate(() => JSON.stringify(window.localStorage));
    const sessionStorageData = await page.evaluate(() => JSON.stringify(window.sessionStorage));
    const userAgent = await page.evaluate(() => navigator.userAgent);

    console.log(`   - Extracted ${cookies.length} cookies.`);
    console.log(`   - LocalStorage size: ${localStorageData.length} bytes`);
    console.log(`   - User-Agent: ${userAgent}`);
    
    const payload = {
      storeContexts: [],
      filterData: { 
        filter: { showAllDisplayVariants: false, showNotRangedProducts: false }, 
        forYouBonusBuyIds: [], 
        isCarousel: true, 
        storeContexts: [], 
        url: "/api/v3/products/product-list-page" 
      }
    };

    console.log('\n3️⃣ Testing In-Browser Fetch (Targeting Checkers API)...');
    const inBrowserResult = await page.evaluate(async (bodyPayload) => {
      try {
        const response = await fetch('/api/catalogue/get-products-filter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        const text = await response.text();
        return { status: response.status, snippet: text.substring(0, 100) };
      } catch (e) {
        return { status: 'ERROR', message: (e as Error).message };
      }
    }, payload);
    
    console.log(`   - Browser Request Status: ${inBrowserResult.status}`);
    console.log(`   - Browser Response Snippet: ${inBrowserResult.snippet}`);

    console.log('\n4️⃣ Testing Node.js Fetch (Targeting Checkers API)...');
    const nodeResponse = await fetch('https://www.checkers.co.za/api/catalogue/get-products-filter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieString,
        'User-Agent': userAgent,
        'Origin': 'https://www.checkers.co.za',
        'Referer': 'https://www.checkers.co.za/'
      },
      body: JSON.stringify(payload)
    });
    
    const nodeText = await nodeResponse.text();
    console.log(`   - Node Request Status: ${nodeResponse.status}`);
    console.log(`   - Node Response Snippet: ${nodeText.substring(0, 100)}`);

  } catch (error) {
    console.error('\n🔥 Spike failed critically:', error);
  } finally {
    console.log('\n🛑 Closing browser...');
    await browser.close();
  }
}

runSpike();