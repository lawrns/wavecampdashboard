// Quick check of widget status
const puppeteer = require('puppeteer');

async function checkStatus() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('🔍', msg.text()));
  
  await page.goto('http://localhost:3007/?page_id=12');
  await page.waitForTimeout(5000);
  
  const status = await page.evaluate(() => {
    return {
      customElements: document.querySelectorAll('heiwa-booking-widget').length,
      config: window.heiwaWidgetConfig,
      buttons: document.querySelectorAll('button').length,
      errors: document.querySelectorAll('.error, [class*="error"]').length
    };
  });
  
  console.log('📊 Status:', JSON.stringify(status, null, 2));
  
  await page.screenshot({ path: 'status-check.png' });
  await browser.close();
}

checkStatus().catch(console.error);
