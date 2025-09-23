<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Safe Plugin Activation Test</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Test loading the plugin file directly
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/heiwa-booking-widget.php';
    echo "<p>Plugin file exists: " . (file_exists($plugin_file) ? 'YES' : 'NO') . "</p>";
    
    if (file_exists($plugin_file)) {
        echo "<p>Including plugin file...</p>";
        include_once $plugin_file;
        echo "<p>✓ Plugin file included successfully</p>";
        
        echo "<p>Plugin class exists: " . (class_exists('Heiwa_Booking_Widget') ? 'YES' : 'NO') . "</p>";
        
        if (class_exists('Heiwa_Booking_Widget')) {
            echo "<p>Creating plugin instance...</p>";
            $plugin = Heiwa_Booking_Widget::get_instance();
            echo "<p>✓ Plugin instance created</p>";
            
            echo "<p>Calling plugin init...</p>";
            $plugin->init();
            echo "<p>✓ Plugin init completed</p>";
            
            echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";
            
            if (shortcode_exists('heiwa_booking')) {
                echo "<p>Testing shortcode...</p>";
                $output = do_shortcode('[heiwa_booking]');
                echo "<p>Shortcode output length: " . strlen($output) . " characters</p>";
                
                if (strlen($output) > 0) {
                    echo "<h3>Shortcode Output:</h3>";
                    echo "<div style='border: 1px solid #ccc; padding: 10px; background: #f9f9f9;'>";
                    echo htmlspecialchars($output);
                    echo "</div>";
                    
                    echo "<h3>Rendered Output:</h3>";
                    echo "<div style='border: 1px solid #ccc; padding: 10px;'>";
                    echo $output;
                    echo "</div>";
                } else {
                    echo "<p>Shortcode returned empty output</p>";
                }
            }
            
            // Now try to activate it in WordPress
            echo "<h2>WordPress Activation Test</h2>";
            $active_plugins = get_option('active_plugins', array());
            if (!is_array($active_plugins)) {
                $active_plugins = array();
            }
            
            $plugin_path = 'heiwa-booking-widget/heiwa-booking-widget.php';
            if (!in_array($plugin_path, $active_plugins)) {
                echo "<p>Adding plugin to active plugins list...</p>";
                $active_plugins[] = $plugin_path;
                update_option('active_plugins', $active_plugins);
                echo "<p>✓ Plugin activated in WordPress</p>";
            } else {
                echo "<p>Plugin already active in WordPress</p>";
            }
        }
    }
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p><pre>" . $e->getTraceAsString() . "</pre>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
    echo "<p>Stack trace:</p><pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<p>Test complete</p>";
?>
