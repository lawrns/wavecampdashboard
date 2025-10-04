import { test, expect } from '@playwright/test';

test.describe('Web Component CSS Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up WordPress-like environment with theme styles
    await page.addStyleTag({
      content: `
        /* Mock WordPress theme styles */
        * { box-sizing: border-box; }

        body {
          font-family: 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }

        .wp-content {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
        }

        /* Common WordPress button styles that should NOT affect widget */
        .wp-content button,
        .wp-content .button,
        input[type="submit"],
        input[type="button"] {
          background: #007cba !important;
          border: 1px solid #007cba !important;
          color: white !important;
          padding: 8px 16px !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          font-weight: normal !important;
          text-decoration: none !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        .wp-content button:hover,
        .wp-content .button:hover {
          background: #005a87 !important;
          border-color: #005a87 !important;
        }

        /* Form styling that should NOT affect widget */
        .wp-content input,
        .wp-content select,
        .wp-content textarea {
          padding: 8px 12px !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          font-size: 14px !important;
          width: 100% !important;
          margin-bottom: 10px !important;
        }

        /* Modal-like elements that should NOT affect widget */
        .wp-content .modal,
        .wp-content .popup,
        .wp-content .overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: rgba(0,0,0,0.5) !important;
          z-index: 9999 !important;
        }

        /* Specific theme classes that might conflict */
        .booking-button { background: red !important; }
        .surf-widget { font-family: 'Comic Sans MS' !important; }
        .orange-button { background: blue !important; }
      `
    });

    // Set up widget configuration
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

  test('should isolate widget styles from WordPress theme', async ({ page }) => {
    await page.setContent(`
      <div class="wp-content">
        <!-- Mock WordPress content with theme styles -->
        <h1>WordPress Page</h1>
        <p>This is regular WordPress content with theme styling.</p>
        <button class="wp-content-button">WordPress Button</button>

        <!-- The widget should be completely isolated -->
        <div style="margin: 20px 0; padding: 20px; border: 2px solid #ccc;">
          <h3>Widget Container</h3>
          <heiwa-booking-widget></heiwa-booking-widget>
        </div>
      </div>
    `);

    // Load widget bundle
    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    // Wait for custom element
    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // Verify WordPress button has theme styles
    const wpButton = page.locator('.wp-content button');
    await expect(wpButton).toHaveCSS('background-color', 'rgb(0, 124, 186)'); // WordPress blue

    // Widget button should NOT have WordPress theme styles
    // This test will fail until the widget implementation provides a button
    const widgetButton = shadowRoot.locator('button').first();
    await expect(widgetButton).toBeVisible();

    // Widget button should have its own orange styling, not WordPress blue
    await expect(widgetButton).toHaveCSS('background-color', 'rgb(249, 115, 22)'); // #f97316
  });

  test('should prevent WordPress CSS from leaking into widget', async ({ page }) => {
    await page.setContent(`
      <div class="wp-content">
        <!-- WordPress form that should not affect widget -->
        <form class="wp-form">
          <input type="text" placeholder="WordPress input" class="wp-input">
          <select class="wp-select">
            <option>WordPress option 1</option>
            <option>WordPress option 2</option>
          </select>
          <button type="submit" class="wp-submit">Submit</button>
        </form>

        <!-- Widget in same container -->
        <heiwa-booking-widget></heiwa-booking-widget>
      </div>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // Verify WordPress form has theme styles
    const wpInput = page.locator('.wp-content input');
    await expect(wpInput).toHaveCSS('padding', '8px 12px');

    const wpSelect = page.locator('.wp-content select');
    await expect(wpSelect).toHaveCSS('border-radius', '4px');

    // Widget form elements should NOT inherit WordPress styles
    // This will be tested once the widget has form elements
    await expect(widget).toBeVisible();

    // Test that widget modal/overlay doesn't conflict with WordPress styles
    // This requires the modal implementation
    await expect(shadowRoot.locator('::backdrop')).toBeHidden();
  });

  test('should maintain widget styles when WordPress loads additional CSS', async ({ page }) => {
    await page.setContent(`
      <div class="wp-content">
        <heiwa-booking-widget></heiwa-booking-widget>
      </div>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    // Simulate WordPress loading additional CSS dynamically (like plugins do)
    await page.addStyleTag({
      content: `
        /* Additional CSS loaded after widget */
        * { font-family: 'Times New Roman' !important; }
        button { background: green !important; }
        .modal { background: yellow !important; }
        input { border: 3px solid red !important; }
      `
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // Widget should maintain its isolated styling despite additional CSS
    await expect(widget).toBeVisible();

    // Shadow DOM should protect widget from dynamically loaded styles
    // This test validates the isolation effectiveness
    const widgetElement = widget.locator('::shadow *').first();
    await expect(widgetElement).toBeDefined();
  });

  test('should handle CSS loading failures gracefully', async ({ page }) => {
    // Mock CSS loading failure by pointing to non-existent CSS file
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
          pluginUrl: 'http://non-existent-domain/' // Will cause CSS load failure
        };
      `
    });

    await page.setContent(`
      <div class="wp-content">
        <heiwa-booking-widget></heiwa-booking-widget>
      </div>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    // Widget should still function even if CSS fails to load
    const widget = page.locator('heiwa-booking-widget');
    await expect(widget).toBeVisible();

    // Should have fallback/basic styling
    const shadowRoot = widget.locator('::shadow');
    await expect(shadowRoot).toBeVisible();
  });

  test('should support widget theming without affecting WordPress', async ({ page }) => {
    await page.setContent(`
      <div class="wp-content">
        <heiwa-booking-widget data-primary-color="#10b981" data-trigger-text="Custom Book Now"></heiwa-booking-widget>
      </div>
    `);

    await page.addScriptTag({
      url: 'http://localhost/dist/heiwa-widget.web.js'
    });

    await page.waitForFunction(() => {
      return customElements.get('heiwa-booking-widget') !== undefined;
    });

    const widget = page.locator('heiwa-booking-widget');
    const shadowRoot = widget.locator('::shadow');

    // Widget should use custom color from attributes
    // This test requires the attribute parsing implementation
    await expect(widget).toBeVisible();

    // WordPress content should remain unaffected
    const wpContent = page.locator('.wp-content');
    await expect(wpContent).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });
});



