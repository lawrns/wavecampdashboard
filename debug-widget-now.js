// Debug script to check widget functionality after fixes
// Run this in browser console on http://localhost:3007/?page_id=4

console.log('🔍 Debugging Heiwa Widget State...');

// Check if widget elements exist
const modal = document.querySelector('.heiwa-modal-overlay');
const nextButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Next')) || 
                   document.querySelector('button[class*="orange"]:not([class*="Back"])');
const experienceButtons = document.querySelectorAll('button[class*="border"]');
const webComponent = document.querySelector('heiwa-booking-widget');
const widgetContainer = document.querySelector('[id*="heiwa-widget"]');

console.log('Web component found:', !!webComponent);
console.log('Widget container found:', !!widgetContainer);
console.log('Modal found:', !!modal);
console.log('Next button found:', !!nextButton);
console.log('Experience buttons found:', experienceButtons.length);

// Check for widget config
console.log('Widget config:', window.heiwaWidgetConfig);

// Check for JavaScript errors
const errorsList = [];
window.addEventListener('error', (e) => {
    errorsList.push(e.message);
    console.log('JavaScript error:', e.message);
});

if (nextButton) {
    console.log('Next button disabled:', nextButton.disabled);
    console.log('Next button classes:', nextButton.className);
}

// Try to find the widget state from React
try {
    const widgetElement = document.querySelector('[id*="heiwa-widget"]');
    if (widgetElement) {
        const reactFiber = Object.keys(widgetElement).find(key => key.startsWith('__reactFiber'));
        if (reactFiber) {
            console.log('React fiber found - widget is mounted');
        }
    }
} catch (e) {
    console.log('Could not access React state:', e.message);
}

// Add click handler to track experience selection
experienceButtons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
        console.log(`Experience button ${i} clicked:`, btn.textContent?.trim());
        setTimeout(() => {
            const nextBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Next')) || 
                           document.querySelector('button[class*="orange"]:not([class*="Back"])');
            if (nextBtn) {
                console.log('Next button state after click - disabled:', nextBtn.disabled);
            }
        }, 100);
    });
});

console.log('🚀 Debug script ready. Try clicking an experience option.');

// Function to manually trigger widget
window.debugOpenWidget = function() {
    const triggerButton = document.querySelector('button[class*="orange"][class*="gradient"]');
    if (triggerButton) {
        triggerButton.click();
        console.log('Widget trigger clicked');
    } else {
        console.log('No trigger button found');
    }
};
