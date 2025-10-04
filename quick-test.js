const puppeteer = require('puppeteer');

async function quickTest() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Success') || text.includes('Widget') || text.includes('Button')) {
      console.log('🔍', text);
    }
  });
  
  await page.goto('http://localhost:3007/?page_id=12');
  
  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await page.evaluate(() => {
    const widgets = document.querySelectorAll('heiwa-booking-widget');
    const buttons = document.querySelectorAll('button');
    const bookingButtons = Array.from(buttons).filter(btn => 
      btn.textContent.toLowerCase().includes('book') ||
      btn.textContent.toLowerCase().includes('surf')
    );
    
    return {
      widgets: widgets.length,
      totalButtons: buttons.length,
      bookingButtons: bookingButtons.length,
      buttonTexts: bookingButtons.map(btn => btn.textContent.trim()),
      hasErrors: document.querySelector('.error, [class*="error"]') !== null
    };
  });
  
  console.log('📊 Results:', result);
  
  if (result.bookingButtons > 0) {
    console.log('🎉 SUCCESS: Found booking buttons!');
    
    // Try clicking the first button
    try {
      await page.click('button');
      console.log('✅ Button clicked successfully');
      
      // Wait for modal
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const modalCheck = await page.evaluate(() => {
        const modals = document.querySelectorAll('.modal, [class*="modal"], [class*="overlay"]');
        return {
          modalCount: modals.length,
          hasModal: modals.length > 0
        };
      });
      
      console.log('🎭 Modal check:', modalCheck);
      
    } catch (e) {
      console.log('❌ Click failed:', e.message);
    }
  }
  
  await page.screenshot({ path: 'final-test.png', fullPage: true });
  await browser.close();
}

quickTest().catch(console.error);
