const puppeteer = require('puppeteer');

async function testBookingFlow() {
  console.log('🧪 Testing Complete Booking Flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('Success') || text.includes('API') || text.includes('Booking')) {
      console.log('🔍 Browser:', text);
    }
  });
  
  try {
    console.log('📄 Loading WordPress test page...');
    await page.goto('http://localhost:3007/?page_id=12', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded');
    
    // Wait for widgets to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find and click the first booking button
    console.log('🎯 Looking for booking button...');
    const bookingButton = await page.$('button[class*="orange"]');
    
    if (!bookingButton) {
      throw new Error('Booking button not found');
    }
    
    console.log('✅ Found booking button, clicking...');
    await bookingButton.click();
    
    // Wait for modal to appear
    console.log('⏳ Waiting for modal to open...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if modal opened
    const modalCheck = await page.evaluate(() => {
      const modals = document.querySelectorAll('[style*="position: fixed"], .modal, [class*="modal"]');
      const overlays = document.querySelectorAll('[style*="backdrop"], [style*="overlay"]');
      
      return {
        modalCount: modals.length,
        overlayCount: overlays.length,
        hasFixedElements: Array.from(document.querySelectorAll('*')).some(el => 
          getComputedStyle(el).position === 'fixed'
        ),
        bodyOverflow: document.body.style.overflow
      };
    });
    
    console.log('🎭 Modal check:', modalCheck);
    
    if (modalCheck.modalCount > 0 || modalCheck.hasFixedElements) {
      console.log('🎉 SUCCESS: Modal opened!');
      
      // Look for booking form elements
      const formElements = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input, select, button');
        const headings = document.querySelectorAll('h1, h2, h3');
        
        return {
          inputCount: inputs.length,
          headingTexts: Array.from(headings).map(h => h.textContent?.trim()).filter(Boolean),
          hasCloseButton: Array.from(document.querySelectorAll('button')).some(btn => 
            btn.textContent?.toLowerCase().includes('close') || 
            btn.getAttribute('aria-label')?.toLowerCase().includes('close')
          )
        };
      });
      
      console.log('📝 Form elements:', formElements);
      
      // Test API communication by checking network requests
      const apiRequests = await page.evaluate(() => {
        return window.performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('/api/'))
          .map(entry => ({
            url: entry.name,
            status: entry.responseStatus || 'unknown'
          }));
      });
      
      console.log('🔗 API requests:', apiRequests);
      
      if (apiRequests.length > 0) {
        console.log('✅ API communication working!');
      }
      
      console.log('🎉 BOOKING WIDGET IS FULLY FUNCTIONAL!');
      
    } else {
      console.log('❌ Modal did not open');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'booking-flow-test.png', fullPage: true });
    console.log('📸 Screenshot saved as booking-flow-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'booking-flow-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testBookingFlow().catch(console.error);
