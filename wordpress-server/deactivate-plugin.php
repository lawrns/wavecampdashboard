<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Plugin Deactivation</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Get active plugins
    $active_plugins = get_option('active_plugins', array());
    if (!is_array($active_plugins)) {
        $active_plugins = array();
    }
    
    echo "<p>Current active plugins:</p>";
    echo "<pre>" . print_r($active_plugins, true) . "</pre>";
    
    // Remove our plugin
    $plugin_path = 'heiwa-booking-widget/heiwa-booking-widget.php';
    $key = array_search($plugin_path, $active_plugins);
    
    if ($key !== false) {
        unset($active_plugins[$key]);
        $active_plugins = array_values($active_plugins); // Re-index array
        update_option('active_plugins', $active_plugins);
        echo "<p>✓ Plugin deactivated</p>";
    } else {
        echo "<p>Plugin was not active</p>";
    }
    
    // Verify deactivation
    $active_plugins = get_option('active_plugins', array());
    echo "<p>Active plugins after deactivation:</p>";
    echo "<pre>" . print_r($active_plugins, true) . "</pre>";
    
} catch (Exception $e) {
    echo "<p>✗ Error: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Deactivation complete</p>";
?>
