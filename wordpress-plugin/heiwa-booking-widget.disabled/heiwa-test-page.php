<?php
/**
 * Heiwa Booking Widget Test Page
 * Create a WordPress page with this content to test the widget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/../../../');
    require_once ABSPATH . 'wp-load.php';
}

get_header();
?>

<div class="container">
    <h1>Heiwa Booking Widget Test Page</h1>

    <div class="test-section">
        <h2>Widget Status</h2>
        <?php
        if (function_exists('is_plugin_active') && is_plugin_active('heiwa-booking-widget/heiwa-booking-widget.php')) {
            echo '<p style="color: green;">✓ Plugin is active</p>';
        } else {
            echo '<p style="color: red;">✗ Plugin is NOT active</p>';
        }

        $settings = get_option('heiwa_booking_settings', array());
        if (!empty($settings['api_endpoint']) && !empty($settings['api_key'])) {
            echo '<p style="color: green;">✓ API is configured</p>';
        } else {
            echo '<p style="color: red;">✗ API is NOT configured - go to Settings → Heiwa Booking Widget</p>';
        }

        if (!empty($settings['auto_inject'])) {
            echo '<p style="color: green;">✓ Auto-injection is enabled</p>';
        } else {
            echo '<p style="color: orange;">⚠ Auto-injection is disabled - use shortcode instead</p>';
        }
        ?>
    </div>

    <div class="test-section">
        <h2>Shortcode Test</h2>
        <p>If the widget doesn't appear automatically, try using the shortcode:</p>
        <code style="background: #f0f0f0; padding: 10px; display: block;">[heiwa_booking]</code>

        <div style="border: 2px dashed #ccc; padding: 20px; margin: 20px 0;">
            <h3>Shortcode Output:</h3>
            <?php echo do_shortcode('[heiwa_booking inline="true"]'); ?>
        </div>
    </div>

    <div class="test-section">
        <h2>Debug Information</h2>
        <details>
            <summary>Click to view current settings</summary>
            <pre><?php print_r($settings); ?></pre>
        </details>

        <details>
            <summary>Click to view server information</summary>
            <ul>
                <li>WordPress Version: <?php echo get_bloginfo('version'); ?></li>
                <li>PHP Version: <?php echo PHP_VERSION; ?></li>
                <li>Plugin Directory: <?php echo plugin_dir_path(__FILE__); ?></li>
                <li>Plugin URL: <?php echo plugin_dir_url(__FILE__); ?></li>
            </ul>
        </details>
    </div>

    <div class="test-section">
        <h2>Next Steps</h2>
        <ol>
            <li>Make sure the plugin is activated in WordPress Admin → Plugins</li>
            <li>Configure API settings in WordPress Admin → Settings → Heiwa Booking Widget</li>
            <li>Test the connection using the "Test Connection" button</li>
            <li>Visit the front-end of your site - the widget should appear</li>
            <li>If not, try adding the shortcode <code>[heiwa_booking]</code> to any page</li>
        </ol>
    </div>
</div>

<style>
.container { max-width: 800px; margin: 0 auto; padding: 20px; }
.test-section { margin: 30px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
.test-section h2 { margin-top: 0; color: #333; }
details { margin: 10px 0; }
pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
</style>

<?php
get_footer();
?>
