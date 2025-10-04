const puppeteer = require('puppeteer');

async function testCompleteBookingSubmission() {
  console.log('🧪 Testing Complete Booking Submission Flow...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox'],
    slowMo: 100 // Slow down for better visibility
  });
  
  const page = await browser.newPage();
  
  // Listen for all console messages and network requests
  page.on('console', msg => {
    console.log('🔍 Browser:', msg.text());
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('🌐 API Response:', response.url(), response.status());
    }
  });
  
  try {
    console.log('📄 Loading WordPress test page...');
    await page.goto('http://localhost:3007/?page_id=12', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for widgets to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎯 Clicking booking button...');
    await page.click('button[class*="orange"]');
    
    // Wait for modal to open
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Starting booking form submission...');
    
    // Step 1: Experience Selection
    console.log('Step 1: Selecting experience...');
    
    // Look for surf camp options
    const surfCampOptions = await page.$$('[data-testid*="surf"], [class*="surf"], button:has-text("Surf"), div:has-text("Surf")');
    if (surfCampOptions.length > 0) {
      await surfCampOptions[0].click();
      console.log('✅ Selected surf experience');
    } else {
      // Try clicking any selectable option
      const options = await page.$$('button:not([disabled]), [role="button"]:not([disabled])');
      if (options.length > 2) { // Skip close and nav buttons
        await options[2].click();
        console.log('✅ Selected first available option');
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to proceed to next step
    const nextButton = await page.$('button:has-text("Next"), button[class*="next"]');
    if (nextButton) {
      await nextButton.click();
      console.log('✅ Proceeded to next step');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Step 2: Fill guest details (if we reach this step)
    console.log('Step 2: Filling guest details...');
    
    // Look for name input
    const nameInput = await page.$('input[name*="name"], input[placeholder*="name"], input[type="text"]');
    if (nameInput) {
      await nameInput.type('John Doe');
      console.log('✅ Entered name');
    }
    
    // Look for email input
    const emailInput = await page.$('input[name*="email"], input[placeholder*="email"], input[type="email"]');
    if (emailInput) {
      await emailInput.type('john.doe@example.com');
      console.log('✅ Entered email');
    }
    
    // Look for phone input
    const phoneInput = await page.$('input[name*="phone"], input[placeholder*="phone"], input[type="tel"]');
    if (phoneInput) {
      await phoneInput.type('+1234567890');
      console.log('✅ Entered phone');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to proceed again
    const nextButton2 = await page.$('button:has-text("Next"), button[class*="next"]');
    if (nextButton2) {
      await nextButton2.click();
      console.log('✅ Proceeded to next step');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Final step: Try to submit
    console.log('Final Step: Attempting submission...');
    
    const submitButton = await page.$('button:has-text("Complete"), button:has-text("Submit"), button:has-text("Book")');
    if (submitButton) {
      console.log('🚀 Found submit button, submitting booking...');
      await submitButton.click();
      
      // Wait for submission response
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Check for success message
      const successCheck = await page.evaluate(() => {
        const successElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('success') || text.includes('confirmed') || text.includes('booking');
        });
        
        return {
          hasSuccessMessage: successElements.length > 0,
          successTexts: successElements.map(el => el.textContent?.trim()).slice(0, 3)
        };
      });
      
      console.log('🎉 Submission result:', successCheck);
      
      if (successCheck.hasSuccessMessage) {
        console.log('✅ BOOKING SUBMISSION SUCCESSFUL!');
      } else {
        console.log('⚠️ Submission completed but no clear success message found');
      }
      
    } else {
      console.log('⚠️ Submit button not found - may need to complete more steps');
    }
    
    // Get final form state
    const finalState = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, select, textarea');
      const buttons = document.querySelectorAll('button');
      
      return {
        totalInputs: inputs.length,
        filledInputs: Array.from(inputs).filter(input => input.value).length,
        totalButtons: buttons.length,
        currentStep: document.querySelector('[class*="step"], [data-step]')?.textContent || 'unknown'
      };
    });
    
    console.log('📊 Final form state:', finalState);
    
    // Take screenshot of final state
    await page.screenshot({ path: 'booking-submission-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
  } catch (error) {
    console.error('❌ Booking submission test failed:', error.message);
    await page.screenshot({ path: 'booking-submission-error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection...');
    // await browser.close();
  }
}

testCompleteBookingSubmission().catch(console.error);
