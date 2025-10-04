const puppeteer = require('puppeteer');

async function inspectBookingForm() {
  console.log('🔍 Inspecting Booking Form Structure...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true 
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3007/?page_id=12');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎯 Opening booking modal...');
    await page.click('button[class*="orange"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📋 Analyzing form structure...');
    
    const formAnalysis = await page.evaluate(() => {
      // Get all interactive elements
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent?.trim(),
        className: btn.className,
        disabled: btn.disabled,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }));
      
      const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(input => ({
        type: input.type || input.tagName,
        name: input.name,
        placeholder: input.placeholder,
        value: input.value,
        required: input.required
      }));
      
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
        level: h.tagName,
        text: h.textContent?.trim()
      }));
      
      // Look for step indicators
      const stepElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        const className = el.className?.toLowerCase() || '';
        return text.includes('step') || className.includes('step') || 
               text.includes('experience') || text.includes('surf');
      }).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 100),
        className: el.className
      }));
      
      // Look for clickable options
      const clickableOptions = Array.from(document.querySelectorAll('div[role="button"], [data-testid], [class*="option"], [class*="card"]')).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 50),
        className: el.className,
        role: el.getAttribute('role'),
        testId: el.getAttribute('data-testid')
      }));
      
      return {
        buttons: buttons.filter(b => b.visible),
        inputs,
        headings,
        stepElements: stepElements.slice(0, 10),
        clickableOptions: clickableOptions.slice(0, 10),
        modalVisible: document.querySelector('[style*="position: fixed"]') !== null
      };
    });
    
    console.log('📊 Form Analysis Results:');
    console.log('Modal Visible:', formAnalysis.modalVisible);
    console.log('Buttons:', JSON.stringify(formAnalysis.buttons, null, 2));
    console.log('Inputs:', JSON.stringify(formAnalysis.inputs, null, 2));
    console.log('Headings:', JSON.stringify(formAnalysis.headings, null, 2));
    console.log('Step Elements:', JSON.stringify(formAnalysis.stepElements, null, 2));
    console.log('Clickable Options:', JSON.stringify(formAnalysis.clickableOptions, null, 2));
    
    // Take screenshot for visual inspection
    await page.screenshot({ path: 'booking-form-inspection.png', fullPage: true });
    console.log('📸 Screenshot saved as booking-form-inspection.png');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection. Check the form structure!');
    
  } catch (error) {
    console.error('❌ Inspection failed:', error.message);
  }
  
  // Don't close browser for manual inspection
  // await browser.close();
}

inspectBookingForm().catch(console.error);
