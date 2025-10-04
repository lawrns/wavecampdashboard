import { test, expect } from '@playwright/test';

test.describe('Web Component Widget Loading', () => {
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
  });

  test('should load widget with trigger button', async ({ page }) => {
    // Create a mock WordPress page with the shortcode
    await page.setContent(`
      <html>
        <body>
          <div id="wp-content">
            <p>WordPress page content</p>
            <heiwa-booking-widget></heiwa-booking-widget>
          </div>
        </body>
      </html>
    `);

    // Mock the widget bundle loading
    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    // Wait for custom element to be defined
    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    // Check that the widget element exists
    const widget = page.locator('heiwa-booking-widget');
    await expect(widget).toBeVisible();

    // The widget should fail to load initially since we haven't implemented it yet
    // This test should fail until the implementation is complete
    const shadowRoot = widget.locator('::shadow');
    await expect(shadowRoot).toBeVisible();

    // Check for trigger button (this will fail until implementation)
    const triggerButton = shadowRoot.locator('button').filter({ hasText: 'Book Your Surf Trip' });
    await expect(triggerButton).toBeVisible();
  });

  test('should have isolated CSS from WordPress theme', async ({ page }) => {
    await page.setContent(`
      <html>
        <head>
          <style>
            /* Mock WordPress theme styles that should not affect widget */
            .wp-content button { background: red !important; }
            .booking-widget { color: blue !important; }
          </style>
        </head>
        <body>
          <div class="wp-content">
            <heiwa-booking-widget></heiwa-booking-widget>
          </div>
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

    // Widget styles should not be affected by global WordPress styles
    // This test will need to be updated once the widget is implemented
    const triggerButton = shadowRoot.locator('button');
    await expect(triggerButton).toBeVisible();

    // Check that widget maintains its own styling (this will fail until implementation)
    await expect(triggerButton).toHaveCSS('background-color', 'rgb(249, 115, 22)'); // #f97316
  });

  test('should handle missing configuration gracefully', async ({ page }) => {
    // Remove the configuration
    await page.evaluate(() => {
      delete window.heiwaWidgetConfig;
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

    // Widget should handle missing config gracefully
    // This test will need to be updated based on error handling implementation
    await expect(widget).toBeVisible();
  });

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.setContent(`
      <html>
        <body>
          <heiwa-booking-widget></heiwa-booking-widget>
        </body>
      </html>
    `);

    // Start timing before loading the bundle
    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    // Wait for custom element to be ready
    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    // Wait for widget to be fully rendered
    const widget = page.locator('heiwa-booking-widget');
    await expect(widget).toBeVisible();

    const loadTime = Date.now() - startTime;

    // Should load within 100ms budget
    expect(loadTime).toBeLessThan(100);
  });
});



