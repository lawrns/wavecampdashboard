const puppeteer = require('puppeteer');

async function debugButtons() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3007/?page_id=12');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const buttonInfo = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    const allElements = document.querySelectorAll('*');
    
    const buttonDetails = Array.from(buttons).map((btn, i) => ({
      index: i,
      text: btn.textContent.trim(),
      className: btn.className,
      id: btn.id,
      visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
      parent: btn.parentElement?.tagName
    }));
    
    // Look for any element with booking-related text
    const bookingElements = Array.from(allElements).filter(el => {
      const text = el.textContent?.toLowerCase() || '';
      return text.includes('book') || text.includes('surf') || text.includes('trip');
    }).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 50),
      className: el.className
    }));
    
    return {
      totalButtons: buttons.length,
      buttonDetails,
      bookingElements: bookingElements.slice(0, 10) // Limit output
    };
  });
  
  console.log('🔘 Button Details:', JSON.stringify(buttonInfo, null, 2));
  
  await page.screenshot({ path: 'button-debug.png', fullPage: true });
  await browser.close();
}

debugButtons().catch(console.error);
