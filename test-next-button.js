// Enhanced debug script for testing the Next button functionality
console.log('🔍 Testing Next Button Functionality...');

// Step 1: Find and click "Book a Room" option
function testBookingFlow() {
    console.log('Step 1: Looking for experience options...');
    
    // Wait a moment for React to render
    setTimeout(() => {
        const experienceButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
            btn.textContent?.includes('Book a Room') || btn.textContent?.includes('All-Inclusive Surf Week')
        );
        
        console.log('Found experience buttons:', experienceButtons.length);
        
        if (experienceButtons.length > 0) {
            const bookRoomButton = experienceButtons.find(btn => btn.textContent?.includes('Book a Room'));
            if (bookRoomButton) {
                console.log('Step 2: Clicking "Book a Room" option...');
                bookRoomButton.click();
                
                // Wait for state to update, then check for Next button
                setTimeout(() => {
                    console.log('Step 3: Looking for Next button...');
                    const nextButton = Array.from(document.querySelectorAll('button')).find(btn => 
                        btn.textContent?.includes('Next')
                    );
                    
                    if (nextButton) {
                        console.log('✅ Next button found!');
                        console.log('Next button disabled:', nextButton.disabled);
                        console.log('Next button text:', nextButton.textContent);
                        
                        if (!nextButton.disabled) {
                            console.log('🎉 SUCCESS: Next button is enabled and ready to click!');
                            console.log('You can now click the Next button to proceed.');
                        } else {
                            console.log('❌ Next button is still disabled. Checking state...');
                            // Check if there's a React state issue
                        }
                    } else {
                        console.log('❌ Next button not found after selection');
                        // List all buttons to debug
                        const allButtons = Array.from(document.querySelectorAll('button'));
                        console.log('All buttons found:', allButtons.map(btn => btn.textContent?.trim()));
                    }
                }, 1000);
            }
        } else {
            console.log('❌ No experience buttons found. Widget may not be fully loaded.');
        }
    }, 500);
}

// Auto-run the test
console.log('🚀 Starting booking flow test in 2 seconds...');
setTimeout(testBookingFlow, 2000);

// Manual trigger function
window.testNextButton = testBookingFlow;
