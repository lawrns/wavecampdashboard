// Simple test to check if booking widgets are working
const puppeteer = require('puppeteer');

async function testWidget() {
  console.log('🧪 Testing WordPress Booking Widget...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    console.log('🔍 Browser:', msg.text());
  });
  
  try {
    console.log('📄 Loading page...');
    await page.goto('http://localhost:3007/?page_id=12', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Wait a bit for widgets to initialize
    await page.waitForTimeout(3000);
    
    // Check for custom elements
    const customElements = await page.evaluate(() => {
      const widgets = document.querySelectorAll('heiwa-booking-widget');
      return {
        count: widgets.length,
        hasCustomElements: !!window.customElements,
        isRegistered: !!window.customElements?.get('heiwa-booking-widget')
      };
    });
    
    console.log('🎯 Custom Elements:', customElements);
    
    // Check for booking buttons
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      const bookingButtons = Array.from(allButtons).filter(btn => 
        btn.textContent.toLowerCase().includes('book') ||
        btn.textContent.toLowerCase().includes('surf') ||
        btn.className.toLowerCase().includes('book')
      );
      
      return {
        totalButtons: allButtons.length,
        bookingButtons: bookingButtons.length,
        buttonTexts: bookingButtons.map(btn => btn.textContent.trim())
      };
    });
    
    console.log('🔘 Buttons:', buttons);
    
    // Take a screenshot
    await page.screenshot({ path: 'widget-test.png', fullPage: true });
    console.log('📸 Screenshot saved as widget-test.png');
    
    if (buttons.bookingButtons > 0) {
      console.log('🎉 SUCCESS: Booking buttons found!');
    } else {
      console.log('❌ No booking buttons found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testWidget().catch(console.error);
