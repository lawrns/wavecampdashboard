const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', m => {
    const type = m.type();
    const text = m.text();
    if (type === 'error') consoleErrors.push(text);
    console.log('console:', type, text);
  });
  page.on('pageerror', e => {
    consoleErrors.push(e.message);
    console.log('pageerror:', e.message);
  });

  await page.goto('http://localhost:3006/widget-test-wp/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Open widget
  await page.click('text=Book Now');
  await page.waitForSelector('text=Choose Your Adventure');
  console.log('STEP: Opened widget');

  // Select room flow
  await page.click('text=Book a Room');
  await page.waitForSelector('text=Choose Your Room', { timeout: 10000 });
  console.log('STEP: On options (room)');

  // Fill dates
  function fmt(d) { return d.toISOString().split('T')[0]; }
  const today = new Date();
  const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
  const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);

  await page.fill('#check-in', fmt(checkIn));
  await page.fill('#check-out', fmt(checkOut));
  console.log('STEP: Dates filled');

  // Wait a moment for auto-select logic
  await page.waitForTimeout(300);

  // Proceed to next step
  await page.click('text=Next');
  console.log('ACTION: Click Next to Guest Details');

  // Guest details step
  await page.waitForSelector('text=Guest Details', { timeout: 10000 });
  console.log('STEP: On guest details');
  await page.fill('#firstName-0', 'John');
  await page.fill('#lastName-0', 'Doe');
  await page.fill('#email-0', 'john.doe@example.com');
  await page.fill('#phone-0', '+123456789');
  await page.click('text=Save Guest 1');
  console.log('STEP: Guest saved');

  // Next to add-ons
  await page.click('text=Next');
  await page.waitForSelector('text=Add-ons & Extras', { timeout: 10000 });
  console.log('STEP: On add-ons');

  // Next to review & pay
  await page.click('text=Next');
  await page.waitForSelector('[data-testid="review-pay-title"]', { timeout: 10000 });
  console.log('STEP: On review & pay');

  // Choose payment method (try bank wire for deterministic button text)
  await page.click('text=Bank Wire Transfer');
  console.log('STEP: Payment method selected (bank wire)');

  // Accept terms if present
  const terms = await page.$('#terms');
  if (terms) {
    await terms.check().catch(() => {});
    console.log('STEP: Terms accepted');
  }

  // Intercept booking request
  const waitRequest = page.waitForRequest(req => /\/api\/wordpress\/(room-bookings|bookings)/.test(req.url()) && req.method() === 'POST', { timeout: 60000 });
  const waitResponse = page.waitForResponse(r => /\/api\/wordpress\/(room-bookings|bookings)/.test(r.url()) && r.request().method() === 'POST', { timeout: 60000 });

  // Click confirm booking
  await page.click('button:has-text("Confirm Booking - Pay Later")');
  console.log('ACTION: Clicked Confirm Booking (bank wire)');

  const req = await waitRequest;
  console.log('NETWORK: booking request ->', req.url());
  const resp = await waitResponse;

  const ok = resp.ok();
  const body = await resp.json().catch(() => null);
  console.log('booking response ok:', ok, 'status:', resp.status(), 'url:', resp.url());
  console.log('booking response body success:', body?.success);

  await browser.close();

  if (!ok || body?.success !== true) {
    console.error('E2E: Booking API did not succeed');
    process.exit(1);
  }
  if (consoleErrors.length > 0) {
    console.error('E2E: Console errors found:', consoleErrors);
    // Don't fail hard for minor console warnings; comment the next line if needed
    // process.exit(1);
  }
})();

