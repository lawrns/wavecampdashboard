<?php
echo "<h1>Plugin Load Test</h1>";

// Test 1: Load WordPress
try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
} catch (Exception $e) {
    echo "<p>✗ WordPress load failed: " . $e->getMessage() . "</p>";
    exit;
}

// Test 2: Check active plugins
$active_plugins = get_option('active_plugins', array());
if (is_array($active_plugins)) {
    echo "<p>Active plugins count: " . count($active_plugins) . "</p>";
    echo "<pre>Active plugins: " . print_r($active_plugins, true) . "</pre>";
} else {
    echo "<p>✗ Active plugins option is not an array: " . gettype($active_plugins) . "</p>";
}

// Test 3: Manually try to load the plugin
echo "<h2>Manual Plugin Load Test:</h2>";
$plugin_path = WP_PLUGIN_DIR . '/heiwa-booking-widget/heiwa-booking-widget.php';
echo "<p>Plugin path: $plugin_path</p>";
echo "<p>File exists: " . (file_exists($plugin_path) ? 'YES' : 'NO') . "</p>";

if (file_exists($plugin_path)) {
    try {
        require_once $plugin_path;
        echo "<p>✓ Plugin file included successfully</p>";

        // Test if classes exist after manual load
        echo "<p>API Connector class: " . (class_exists('Heiwa_Booking_API_Connector') ? 'YES' : 'NO') . "</p>";
        echo "<p>Shortcode class: " . (class_exists('Heiwa_Booking_Widget_Shortcode') ? 'YES' : 'NO') . "</p>";

        // Initialize the plugin
        if (class_exists('Heiwa_Booking_Widget')) {
            Heiwa_Booking_Widget::get_instance();
            echo "<p>✓ Plugin initialized</p>";
        }

        // Test shortcode class directly
        if (class_exists('Heiwa_Booking_Widget_Shortcode')) {
            echo "<p>Instantiating shortcode class...</p>";
            new Heiwa_Booking_Widget_Shortcode();
            echo "<p>✓ Shortcode class instantiated</p>";
            echo "<p>Shortcode exists after direct instantiation: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";
        }

        echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";

    } catch (Exception $e) {
        echo "<p>✗ Plugin load failed: " . $e->getMessage() . "</p>";
    }
}

// Test 4: Check settings
$settings = get_option('heiwa_booking_settings', array());
echo "<p>Settings loaded: " . (!empty($settings) ? 'YES' : 'NO') . "</p>";
?>
