const puppeteer = require('puppeteer');

async function debugNextButtonIssue() {
  console.log('🐛 DEBUGGING NEXT BUTTON ISSUE IN WORDPRESS WIDGET');
  console.log('='.repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox'],
    slowMo: 200 // Slow down for better observation
  });
  
  const page = await browser.newPage();
  
  // Listen for all console messages
  page.on('console', msg => {
    console.log('🔍 Browser Console:', msg.text());
  });
  
  // Listen for errors
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    console.log('\n📄 Loading WordPress page...');
    await page.goto('http://localhost:3007/?page_id=12', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for widgets to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🎯 STEP 1: Opening booking modal...');
    
    // Click the first booking button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return (text.includes('book') || text.includes('surf')) && btn.offsetWidth > 0;
      });
      
      if (buttons.length > 0) {
        console.log('🎯 Clicking booking button:', buttons[0].textContent);
        buttons[0].click();
        return true;
      }
      return false;
    });
    
    // Wait for modal to open
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📋 STEP 2: Analyzing first screen...');
    
    const firstScreenAnalysis = await page.evaluate(() => {
      // Look for experience options
      const experienceOptions = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return (text.includes('surf') || text.includes('week') || text.includes('experience')) && 
               el.offsetWidth > 0 && el.offsetHeight > 0 &&
               (el.tagName === 'BUTTON' || el.tagName === 'DIV' || el.getAttribute('role') === 'button');
      });
      
      // Look for next button
      const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('next') && btn.offsetWidth > 0;
      });
      
      return {
        experienceOptions: experienceOptions.map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          className: el.className,
          clickable: el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'
        })),
        nextButtons: nextButtons.map(btn => ({
          text: btn.textContent?.trim(),
          disabled: btn.disabled,
          className: btn.className
        })),
        modalVisible: !!document.querySelector('[style*="position: fixed"]')
      };
    });
    
    console.log('📊 First Screen Analysis:');
    console.log('  - Modal Visible:', firstScreenAnalysis.modalVisible);
    console.log('  - Experience Options:', firstScreenAnalysis.experienceOptions.length);
    console.log('  - Next Buttons:', firstScreenAnalysis.nextButtons.length);
    
    firstScreenAnalysis.experienceOptions.forEach((option, i) => {
      console.log(`    Option ${i + 1}: ${option.text} (${option.tag}, clickable: ${option.clickable})`);
    });
    
    firstScreenAnalysis.nextButtons.forEach((btn, i) => {
      console.log(`    Next Button ${i + 1}: "${btn.text}" (disabled: ${btn.disabled})`);
    });
    
    if (firstScreenAnalysis.nextButtons.length === 0) {
      console.log('❌ No Next button found on first screen');
      await page.screenshot({ path: 'debug-no-next-button.png', fullPage: true });
      return;
    }
    
    console.log('\n🎯 STEP 3: Selecting an experience option...');
    
    // Try to select an experience option (look for the specific experience cards)
    const optionSelected = await page.evaluate(() => {
      // Look for experience selection buttons specifically
      const experienceButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return (text.includes('book a room') || text.includes('all-inclusive surf week')) &&
               btn.offsetWidth > 0 && btn.offsetHeight > 0;
      });

      if (experienceButtons.length > 0) {
        console.log('🎯 Selecting experience option:', experienceButtons[0].textContent?.trim().substring(0, 50));
        experienceButtons[0].click();
        return { success: true, optionText: experienceButtons[0].textContent?.trim().substring(0, 50) };
      }

      // Fallback: look for any button with surf-related content
      const fallbackOptions = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return (text.includes('surf') || text.includes('room')) &&
               btn.offsetWidth > 0 && btn.offsetHeight > 0 &&
               !text.includes('book your surf trip'); // Exclude the trigger button
      });

      if (fallbackOptions.length > 0) {
        console.log('🎯 Selecting fallback option:', fallbackOptions[0].textContent?.trim().substring(0, 50));
        fallbackOptions[0].click();
        return { success: true, optionText: fallbackOptions[0].textContent?.trim().substring(0, 50) };
      }

      return { success: false };
    });
    
    if (!optionSelected.success) {
      console.log('❌ Could not find or select experience option');
      await page.screenshot({ path: 'debug-no-options.png', fullPage: true });
      return;
    }
    
    console.log('✅ Selected option:', optionSelected.optionText);
    
    // Wait for state change
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🔍 STEP 4: Checking Next button state after selection...');
    
    const nextButtonState = await page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('next') && btn.offsetWidth > 0;
      });
      
      return nextButtons.map(btn => ({
        text: btn.textContent?.trim(),
        disabled: btn.disabled,
        className: btn.className,
        style: btn.style.cssText,
        clickable: !btn.disabled && btn.offsetWidth > 0
      }));
    });
    
    console.log('🔘 Next Button State After Selection:');
    nextButtonState.forEach((btn, i) => {
      console.log(`  Button ${i + 1}: "${btn.text}"`);
      console.log(`    - Disabled: ${btn.disabled}`);
      console.log(`    - Clickable: ${btn.clickable}`);
      console.log(`    - Class: ${btn.className}`);
    });
    
    if (nextButtonState.length === 0) {
      console.log('❌ Next button disappeared after selection');
      await page.screenshot({ path: 'debug-next-button-gone.png', fullPage: true });
      return;
    }
    
    const enabledNextButton = nextButtonState.find(btn => btn.clickable);
    if (!enabledNextButton) {
      console.log('❌ Next button is still disabled after selection');
      await page.screenshot({ path: 'debug-next-button-disabled.png', fullPage: true });
      return;
    }
    
    console.log('\n🚀 STEP 5: Attempting to click Next button...');
    
    const nextClickResult = await page.evaluate(() => {
      const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => {
        const text = btn.textContent?.toLowerCase() || '';
        return text.includes('next') && btn.offsetWidth > 0 && !btn.disabled;
      });
      
      if (nextButtons.length > 0) {
        console.log('🎯 Clicking Next button');
        nextButtons[0].click();
        return { success: true, buttonText: nextButtons[0].textContent?.trim() };
      }
      
      return { success: false };
    });
    
    if (!nextClickResult.success) {
      console.log('❌ Failed to click Next button');
      await page.screenshot({ path: 'debug-next-click-failed.png', fullPage: true });
      return;
    }
    
    console.log('✅ Next button clicked:', nextClickResult.buttonText);
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📋 STEP 6: Checking if we moved to next step...');
    
    const secondScreenCheck = await page.evaluate(() => {
      // Look for different content that indicates we're on step 2
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.textContent?.trim());
      const stepIndicators = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('step') && el.offsetWidth > 0;
      }).map(el => el.textContent?.trim());
      
      // Look for different form elements
      const inputs = document.querySelectorAll('input, select, textarea').length;
      
      return {
        headings,
        stepIndicators,
        inputCount: inputs,
        currentContent: document.querySelector('[class*="modal"], [style*="position: fixed"]')?.textContent?.substring(0, 200)
      };
    });
    
    console.log('📊 Second Screen Check:');
    console.log('  - Headings:', secondScreenCheck.headings);
    console.log('  - Step Indicators:', secondScreenCheck.stepIndicators);
    console.log('  - Input Count:', secondScreenCheck.inputCount);
    console.log('  - Current Content Preview:', secondScreenCheck.currentContent);
    
    // Take final screenshot
    await page.screenshot({ path: 'debug-after-next-click.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-after-next-click.png');
    
    console.log('\n🎉 DEBUGGING COMPLETE');
    console.log('Check the screenshots and console output to identify the issue');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
  
  // Keep browser open for manual inspection
  console.log('\n🔍 Browser kept open for manual inspection...');
}

debugNextButtonIssue().catch(console.error);
