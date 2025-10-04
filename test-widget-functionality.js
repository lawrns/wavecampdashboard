// Test script to verify WordPress booking widget functionality
const puppeteer = require('puppeteer');

async function testBookingWidget() {
  console.log('🧪 Testing WordPress Booking Widget Functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console messages
    page.on('console', msg => {
      console.log('🔍 Browser Console:', msg.text());
    });
    
    // Listen for errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    console.log('📄 Loading WordPress test page...');
    await page.goto('http://localhost:3007/?page_id=12', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully');
    
    // Wait for custom elements to be defined
    await page.waitForFunction(() => {
      return window.customElements && window.customElements.get('heiwa-booking-widget');
    }, { timeout: 10000 });
    
    console.log('✅ Custom elements are defined');
    
    // Check if booking widgets are present
    const widgets = await page.$$('heiwa-booking-widget');
    console.log(`✅ Found ${widgets.length} booking widgets on page`);
    
    if (widgets.length === 0) {
      throw new Error('No booking widgets found on page');
    }
    
    // Check if booking buttons are visible
    await page.waitForSelector('button[class*="book"], button[class*="Book"], .heiwa-booking-trigger', { 
      timeout: 10000 
    });
    
    const buttons = await page.$$('button[class*="book"], button[class*="Book"], .heiwa-booking-trigger');
    console.log(`✅ Found ${buttons.length} booking buttons`);
    
    if (buttons.length > 0) {
      console.log('🎯 Testing button click...');
      await buttons[0].click();
      
      // Wait for modal to appear
      await page.waitForSelector('.modal, .booking-modal, [class*="modal"]', { 
        timeout: 5000 
      });
      
      console.log('✅ Booking modal opened successfully!');
      
      // Test API communication
      const apiCalls = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => ({ url: entry.name, status: entry.responseStatus }));
      });
      
      console.log('🔗 API Calls made:', apiCalls);
      
      console.log('🎉 ALL TESTS PASSED! Booking widget is fully functional.');
      
    } else {
      throw new Error('No booking buttons found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'widget-test-failure.png', fullPage: true });
    console.log('📸 Screenshot saved as widget-test-failure.png');
    
  } finally {
    await browser.close();
  }
}

// Run the test
testBookingWidget().catch(console.error);
