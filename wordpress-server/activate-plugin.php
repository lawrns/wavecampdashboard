<?php
// Script to manually activate the Heiwa Booking Widget plugin
require_once 'wp-load.php';

echo "<h1>Plugin Activation Test</h1>";

// Get current active plugins
$active_plugins = get_option('active_plugins', array());
echo "<h2>Current Active Plugins:</h2>";
echo "<pre>" . print_r($active_plugins, true) . "</pre>";

// Check if our plugin is in the list
$plugin_path = 'heiwa-booking-widget/heiwa-booking-widget.php';
$is_active = in_array($plugin_path, $active_plugins);

echo "<p>Heiwa Booking Widget is active: " . ($is_active ? 'YES' : 'NO') . "</p>";

if (!$is_active) {
    echo "<h2>Activating Plugin...</h2>";
    
    // Add plugin to active plugins list
    $active_plugins[] = $plugin_path;
    update_option('active_plugins', $active_plugins);
    
    echo "<p>Plugin added to active plugins list</p>";
    
    // Manually trigger activation hook
    $plugin_file = WP_PLUGIN_DIR . '/' . $plugin_path;
    if (file_exists($plugin_file)) {
        include_once $plugin_file;
        
        // Get plugin instance and activate
        if (class_exists('Heiwa_Booking_Widget')) {
            $plugin = Heiwa_Booking_Widget::get_instance();
            $plugin->activate();
            echo "<p>Plugin activation method called</p>";
        }
    }
    
    // Verify activation
    $active_plugins = get_option('active_plugins', array());
    $is_now_active = in_array($plugin_path, $active_plugins);
    echo "<p>Plugin is now active: " . ($is_now_active ? 'YES' : 'NO') . "</p>";
} else {
    echo "<p>Plugin is already active</p>";
}

// Test shortcode registration
echo "<h2>Shortcode Test:</h2>";
echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";

// If shortcode doesn't exist, try to manually initialize
if (!shortcode_exists('heiwa_booking')) {
    echo "<p>Manually initializing plugin...</p>";
    
    if (class_exists('Heiwa_Booking_Widget')) {
        $plugin = Heiwa_Booking_Widget::get_instance();
        $plugin->init();
        echo "<p>Plugin init() called manually</p>";
        echo "<p>Shortcode exists after manual init: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";
    }
}

echo "<h2>Final Test:</h2>";
if (shortcode_exists('heiwa_booking')) {
    $output = do_shortcode('[heiwa_booking]');
    echo "<p>Shortcode output length: " . strlen($output) . " characters</p>";
    echo "<div style='border: 1px solid #ccc; padding: 10px;'>";
    echo $output;
    echo "</div>";
} else {
    echo "<p>Shortcode still not available</p>";
}
?>
