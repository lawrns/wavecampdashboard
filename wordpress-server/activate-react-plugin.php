<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Activate React Widget Plugin</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Test the React widget plugin
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-react-widget/heiwa-react-widget.php';
    echo "<p>React plugin file exists: " . (file_exists($plugin_file) ? 'YES' : 'NO') . "</p>";
    
    if (file_exists($plugin_file)) {
        echo "<p>Including React plugin...</p>";
        include_once $plugin_file;
        echo "<p>✓ React plugin included</p>";
        
        // Initialize the plugin
        if (function_exists('heiwa_react_widget_init')) {
            echo "<p>Calling React plugin init...</p>";
            heiwa_react_widget_init();
            echo "<p>✓ React plugin initialized</p>";
        }
        
        echo "<p>Shortcode exists: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</p>";
        
        if (shortcode_exists('heiwa_booking')) {
            echo "<p>Testing shortcode...</p>";
            $output = do_shortcode('[heiwa_booking]');
            echo "<p>Shortcode output length: " . strlen($output) . " characters</p>";
            
            if (strlen($output) > 0) {
                echo "<h3>Shortcode Output Preview:</h3>";
                echo "<div style='border: 1px solid #ccc; padding: 10px; background: #f9f9f9; max-height: 200px; overflow: auto;'>";
                echo htmlspecialchars(substr($output, 0, 500)) . (strlen($output) > 500 ? '...' : '');
                echo "</div>";
            }
        }
        
        // Activate the plugin
        echo "<h2>Activating React Plugin</h2>";
        $active_plugins = get_option('active_plugins', array());
        if (!is_array($active_plugins)) {
            $active_plugins = array();
        }
        
        $plugin_path = 'heiwa-react-widget/heiwa-react-widget.php';
        if (!in_array($plugin_path, $active_plugins)) {
            $active_plugins[] = $plugin_path;
            update_option('active_plugins', $active_plugins);
            echo "<p>✓ React plugin activated</p>";
        } else {
            echo "<p>React plugin already active</p>";
        }
        
        echo "<h3>Final Status:</h3>";
        echo "<p>🎯 <strong>React Widget plugin is now active!</strong></p>";
        echo "<p>📋 Uses React build files if available, falls back to simple button</p>";
        echo "<p>🔗 Test at: <a href='http://localhost:3006/?page_id=10'>Test Booking Page</a></p>";
    }
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Activation complete</p>";
?>
