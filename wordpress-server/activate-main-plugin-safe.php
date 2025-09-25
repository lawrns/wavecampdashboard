<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Activate Main Plugin Safely</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // First, test if the plugin loads without errors
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/heiwa-booking-widget.php';
    
    if (file_exists($plugin_file)) {
        echo "<p>✓ Plugin file exists</p>";
        
        // Include the plugin file to test for errors
        ob_start();
        $error = null;
        try {
            include_once $plugin_file;
            echo "<p>✓ Plugin file loaded successfully</p>";
        } catch (Exception $e) {
            $error = $e->getMessage();
        } catch (Error $e) {
            $error = $e->getMessage();
        }
        $output = ob_get_clean();
        
        if ($error) {
            echo "<p>❌ Error loading plugin: $error</p>";
            exit;
        }
        
        // Initialize the plugin
        if (class_exists('Heiwa_Booking_Widget')) {
            $plugin = Heiwa_Booking_Widget::get_instance();
            $plugin->init();
            echo "<p>✓ Plugin initialized</p>";
        }
        
        // Now activate it in WordPress
        $active_plugins = get_option('active_plugins', array());
        if (!is_array($active_plugins)) {
            $active_plugins = array();
        }
        
        $plugin_path = 'heiwa-booking-widget/heiwa-booking-widget.php';
        if (!in_array($plugin_path, $active_plugins)) {
            $active_plugins[] = $plugin_path;
            update_option('active_plugins', $active_plugins);
            echo "<p>✓ Plugin activated in WordPress</p>";
        } else {
            echo "<p>Plugin already active</p>";
        }
        
        // Test the shortcode
        if (shortcode_exists('heiwa_booking')) {
            echo "<p>✓ Shortcode registered</p>";
            
            $output = do_shortcode('[heiwa_booking]');
            if (strlen($output) > 0 && strpos($output, 'heiwa-react-widget-container') !== false) {
                echo "<p>✅ Shortcode working correctly</p>";
            } else {
                echo "<p>⚠️ Shortcode output issue</p>";
            }
        } else {
            echo "<p>❌ Shortcode not registered</p>";
        }
        
        echo "<h3>Final Status:</h3>";
        echo "<p>🎯 <strong>Main plugin activated successfully!</strong></p>";
        echo "<p>📋 Shortcode: <code>[heiwa_booking]</code></p>";
        echo "<p>🔗 Test at: <a href='http://localhost:3006/?page_id=10'>Test Booking Page</a></p>";
        
    } else {
        echo "<p>❌ Plugin file not found</p>";
    }
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Activation complete</p>";
?>
