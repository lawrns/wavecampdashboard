<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Simple WordPress Test</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Check active plugins
    $active_plugins = get_option('active_plugins', array());
    if (is_array($active_plugins)) {
        echo "<p>Active plugins count: " . count($active_plugins) . "</p>";
    } else {
        echo "<p>Active plugins option returned: " . gettype($active_plugins) . "</p>";
        $active_plugins = array(); // Set to empty array for safety
    }
    
    // Check if our plugin file exists
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/heiwa-booking-widget.php';
    echo "<p>Plugin file exists: " . (file_exists($plugin_file) ? 'YES' : 'NO') . "</p>";
    
    // Try to include the plugin file directly
    if (file_exists($plugin_file)) {
        echo "<p>Including plugin file...</p>";
        include_once $plugin_file;
        echo "<p>✓ Plugin file included</p>";
        
        // Check if class exists
        echo "<p>Plugin class exists: " . (class_exists('Heiwa_Booking_Widget') ? 'YES' : 'NO') . "</p>";
        
        if (class_exists('Heiwa_Booking_Widget')) {
            echo "<p>Creating plugin instance...</p>";
            $plugin = Heiwa_Booking_Widget::get_instance();
            echo "<p>✓ Plugin instance created</p>";
            
            echo "<p>Calling plugin init...</p>";
            $plugin->init();
            echo "<p>✓ Plugin init called</p>";
            
            echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";

            // Manually activate the plugin
            echo "<p>Manually activating plugin...</p>";
            $active_plugins = is_array($active_plugins) ? $active_plugins : array();
            $plugin_path = 'heiwa-booking-widget/heiwa-booking-widget.php';

            if (!in_array($plugin_path, $active_plugins)) {
                $active_plugins[] = $plugin_path;
                update_option('active_plugins', $active_plugins);
                echo "<p>✓ Plugin added to active plugins list</p>";
            } else {
                echo "<p>Plugin already in active plugins list</p>";
            }
        }
    }

} catch (Exception $e) {
    echo "<p>✗ Error: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Test complete</p>";
?>
