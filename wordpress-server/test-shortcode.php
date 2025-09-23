<?php
// Test the shortcode directly
require_once 'wp-load.php';

// Manually load the plugin
require_once 'wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php';

// Initialize the plugin instance
$plugin = Heiwa_Booking_Widget::get_instance();

// Manually call the init method (since plugins_loaded hook might not have fired)
$plugin->init();

// Clear any caches
wp_cache_flush();

// Test database connection
global $wpdb;
echo "<h2>Database Test:</h2>";
echo "<pre>DB Connected: " . ($wpdb->check_connection() ? 'YES' : 'NO') . "</pre>";

// Debug API configuration
$settings = get_option('heiwa_booking_settings', array());
echo "<h2>API Settings Debug:</h2>";
echo "<pre>get_option result: " . print_r($settings, true) . "</pre>";

// If get_option didn't work, try manual unserialization
if (empty($settings)) {
    $direct_result = $wpdb->get_var("SELECT option_value FROM {$wpdb->options} WHERE option_name = 'heiwa_booking_settings'");
    if ($direct_result) {
        $settings = unserialize($direct_result);
        echo "<pre>Manual unserialize worked: " . print_r($settings, true) . "</pre>";
        // Update the option to fix caching
        update_option('heiwa_booking_settings', $settings);
    }
}

echo "<pre>API Endpoint: '" . ($settings['api_endpoint'] ?? 'NOT SET') . "'</pre>";
echo "<pre>API Key: '" . ($settings['api_key'] ?? 'NOT SET') . "'</pre>";

// Try direct database query
$direct_result = $wpdb->get_var("SELECT option_value FROM {$wpdb->options} WHERE option_name = 'heiwa_booking_settings'");
echo "<pre>Direct DB query result: '" . $direct_result . "'</pre>";

// Test API connector
$api = new Heiwa_Booking_API_Connector();
echo "<pre>API Connector configured: " . ($api->is_configured() ? 'YES' : 'NO') . "</pre>";

// Test the shortcode
echo "<h1>Shortcode Test</h1>";
echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";

// Test rendering the shortcode
if (shortcode_exists('heiwa_booking')) {
    echo "<h2>Shortcode Output:</h2>";
    $output = do_shortcode('[heiwa_booking]');
    echo "<pre>Raw output: '" . htmlspecialchars($output) . "'</pre>";
    if (empty($output)) {
        echo "<p>Shortcode returned empty output</p>";
    } else {
        echo "<div style='border:1px solid #ccc; padding:10px;'>";
        echo $output;
        echo "</div>";
    }
} else {
    echo "<p>Shortcode not registered</p>";
}
?>
