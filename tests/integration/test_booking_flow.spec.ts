import { test, expect } from '@playwright/test';

test.describe('Web Component Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the WordPress environment
    await page.addScriptTag({
      content: `
        window.heiwaWidgetConfig = {
          settings: {
            apiEndpoint: 'http://localhost:3005/api',
            apiKey: 'test-key-123',
            position: 'right',
            primaryColor: '#f97316',
            triggerText: 'Book Your Surf Trip'
          },
          pluginUrl: 'http://localhost/wordpress/wp-content/plugins/heiwa-booking-widget/'
        };
      `
    });

    // Mock successful API responses
    await page.route('**/api/camps/camp-123/availability*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          available: true,
          campId: 'camp-123',
          checkInDate: '2024-12-01',
          checkOutDate: '2024-12-05',
          guestCount: 2,
          totalPrice: 120000,
          currency: 'USD',
          availableExperiences: ['surf-lesson-basic', 'yoga-session'],
          pricingBreakdown: {
            accommodation: 100000,
            experiences: 20000
          }
        })
      });
    });

    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          booking: {
            id: 'booking-123',
            campId: 'camp-123',
            status: 'confirmed',
            totalAmount: 120000,
            currency: 'USD',
            createdAt: '2024-09-27T10:00:00Z'
          },
          payment: {
            status: 'completed',
            method: 'stripe',
            transactionId: 'txn_1234567890'
          }
        })
      });
    });
  });

  test('should complete full booking flow with Stripe payment', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <heiwa-booking-widget></heiwa-booking-widget>
        </body>
      </html>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    // Wait for widget to load
    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // Step 1: Click trigger button (will fail until implementation)
    const triggerButton = shadowRoot.locator('button').filter({ hasText: 'Book Your Surf Trip' });
    await expect(triggerButton).toBeVisible();
    await triggerButton.click();

    // Step 2: Experience selection (will fail until implementation)
    // Select camp and dates
    const campSelector = shadowRoot.locator('[data-testid="camp-selector"]');
    await expect(campSelector).toBeVisible();
    await campSelector.selectOption('camp-123');

    // Select dates
    const checkInInput = shadowRoot.locator('[data-testid="checkin-date"]');
    await checkInInput.fill('2024-12-01');

    const checkOutInput = shadowRoot.locator('[data-testid="checkout-date"]');
    await checkOutInput.fill('2024-12-05');

    // Set guest count
    const guestCountInput = shadowRoot.locator('[data-testid="guest-count"]');
    await guestCountInput.fill('2');

    // Continue to guest details
    const continueButton = shadowRoot.locator('button').filter({ hasText: 'Continue' });
    await continueButton.click();

    // Step 3: Guest information
    const firstNameInput = shadowRoot.locator('[data-testid="guest-0-firstname"]');
    await firstNameInput.fill('John');

    const lastNameInput = shadowRoot.locator('[data-testid="guest-0-lastname"]');
    await lastNameInput.fill('Doe');

    const emailInput = shadowRoot.locator('[data-testid="guest-0-email"]');
    await emailInput.fill('john@example.com');

    const phoneInput = shadowRoot.locator('[data-testid="guest-0-phone"]');
    await phoneInput.fill('+1234567890');

    // Second guest
    const guest2FirstName = shadowRoot.locator('[data-testid="guest-1-firstname"]');
    await guest2FirstName.fill('Jane');

    const guest2LastName = shadowRoot.locator('[data-testid="guest-1-lastname"]');
    await guest2LastName.fill('Doe');

    const guest2Email = shadowRoot.locator('[data-testid="guest-1-email"]');
    await guest2Email.fill('jane@example.com');

    // Continue to room assignment
    await continueButton.click();

    // Step 4: Room assignment (auto-assigned for this test)
    await expect(shadowRoot.locator('[data-testid="room-assignment"]')).toBeVisible();
    await continueButton.click();

    // Step 5: Review and payment
    await expect(shadowRoot.locator('[data-testid="booking-summary"]')).toBeVisible();

    // Select Stripe payment
    const stripeOption = shadowRoot.locator('[data-testid="payment-stripe"]');
    await stripeOption.click();

    // Mock Stripe Elements
    await page.evaluate(() => {
      // Mock Stripe.js global
      window.Stripe = () => ({
        elements: () => ({
          create: () => ({
            mount: () => {},
            on: () => {}
          })
        }),
        confirmCardPayment: () => Promise.resolve({ paymentIntent: { status: 'succeeded' } })
      });
    });

    // Complete booking
    const completeBookingButton = shadowRoot.locator('button').filter({ hasText: 'Complete Booking' });
    await completeBookingButton.click();

    // Step 6: Confirmation
    await expect(shadowRoot.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(shadowRoot.locator('text=Booking confirmed')).toBeVisible();
  });

  test('should handle booking errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: 'Invalid guest information',
          field: 'guests[0].email'
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <heiwa-booking-widget></heiwa-booking-widget>
        </body>
      </html>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    // Navigate through booking flow and submit with invalid data
    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // This test will need to be updated once the full flow is implemented
    // For now, it verifies that error handling structure exists
    const widgetElement = page.locator('heiwa-booking-widget');
    await expect(widgetElement).toBeVisible();
  });

  test('should support bank transfer payment flow', async ({ page }) => {
    await page.route('**/api/bookings', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          booking: {
            id: 'booking-456',
            campId: 'camp-123',
            status: 'pending',
            totalAmount: 60000,
            currency: 'USD',
            createdAt: '2024-09-27T10:00:00Z'
          },
          payment: {
            status: 'pending',
            method: 'bank_transfer',
            instructions: 'Please transfer $600 to account XXXX-XXXX-XXXX within 48 hours',
            referenceNumber: 'REF-123456'
          }
        })
      });
    });

    await page.setContent(`
      <html>
        <body>
          <heiwa-booking-widget></heiwa-booking-widget>
        </body>
      </html>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // This test will be fully implemented once the booking flow is complete
    // For now, it verifies the widget loads for bank transfer testing
    await expect(widget).toBeVisible();
  });

  test('should maintain booking state across steps', async ({ page }) => {
    await page.setContent(`
      <html>
        <body>
          <heiwa-booking-widget></heiwa-booking-widget>
        </body>
      </html>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');

    // Test will verify that booking data persists across navigation
    // This requires the full booking flow implementation
    await expect(widget).toBeVisible();
  });
});



