<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Minimal Plugin Test</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Test loading the minimal plugin
    $plugin_file = WP_PLUGIN_DIR . '/heiwa-minimal/heiwa-minimal.php';
    echo "<p>Minimal plugin file exists: " . (file_exists($plugin_file) ? 'YES' : 'NO') . "</p>";
    
    if (file_exists($plugin_file)) {
        echo "<p>Including minimal plugin...</p>";
        include_once $plugin_file;
        echo "<p>✓ Minimal plugin included</p>";
        
        echo "<p>Minimal class exists: " . (class_exists('Heiwa_Minimal_Shortcode') ? 'YES' : 'NO') . "</p>";
        
        // Initialize the plugin
        if (function_exists('heiwa_minimal_init')) {
            echo "<p>Calling minimal init...</p>";
            heiwa_minimal_init();
            echo "<p>✓ Minimal plugin initialized</p>";
        }
        
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
            }
        }
        
        // Activate the minimal plugin
        echo "<h2>Activating Minimal Plugin</h2>";
        $active_plugins = get_option('active_plugins', array());
        if (!is_array($active_plugins)) {
            $active_plugins = array();
        }
        
        $plugin_path = 'heiwa-minimal/heiwa-minimal.php';
        if (!in_array($plugin_path, $active_plugins)) {
            $active_plugins[] = $plugin_path;
            update_option('active_plugins', $active_plugins);
            echo "<p>✓ Minimal plugin activated</p>";
        } else {
            echo "<p>Minimal plugin already active</p>";
        }
    }
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Test complete</p>";
?>
