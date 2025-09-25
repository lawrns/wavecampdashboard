<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Configure Heiwa Booking API Settings</h1>";

try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded</p>";
    
    // Configure the API settings that the plugin expects
    $api_settings = array(
        'api_endpoint' => 'http://localhost:3005/api',
        'api_key' => 'heiwa_wp_test_key_2024_secure_deployment',
        'position' => 'right',
        'primary_color' => '#f97316',
        'trigger_text' => 'BOOK NOW',
        'enabled' => true,
        'debug_mode' => true
    );
    
    // Save the settings
    $result = update_option('heiwa_booking_settings', $api_settings);
    
    if ($result) {
        echo "<p>✓ API settings configured successfully</p>";
    } else {
        echo "<p>⚠️ Settings may have been already configured (no change needed)</p>";
    }
    
    // Verify the settings
    $saved_settings = get_option('heiwa_booking_settings', array());
    echo "<h3>Current Settings:</h3>";
    echo "<pre>" . print_r($saved_settings, true) . "</pre>";
    
    // Test the API connector
    echo "<h3>Testing API Connector:</h3>";
    
    // Include the API connector class
    $api_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/includes/class-api-connector.php';
    if (file_exists($api_file)) {
        include_once $api_file;
        
        if (class_exists('Heiwa_Booking_API_Connector')) {
            $api = new Heiwa_Booking_API_Connector();
            $is_configured = $api->is_configured();
            
            echo "<p>API Configured: " . ($is_configured ? 'YES ✓' : 'NO ✗') . "</p>";
            
            if ($is_configured) {
                echo "<p>✅ API is properly configured! The main plugin should now work.</p>";
            } else {
                echo "<p>❌ API configuration failed. Check the settings.</p>";
            }
        } else {
            echo "<p>❌ API Connector class not found</p>";
        }
    } else {
        echo "<p>❌ API Connector file not found: $api_file</p>";
    }
    
    // Now activate the main plugin and deactivate the minimal one
    echo "<h3>Switching to Main Plugin:</h3>";
    
    $active_plugins = get_option('active_plugins', array());
    if (!is_array($active_plugins)) {
        $active_plugins = array();
    }
    
    // Remove minimal plugin
    $minimal_plugin = 'heiwa-minimal/heiwa-minimal.php';
    $active_plugins = array_filter($active_plugins, function($plugin) use ($minimal_plugin) {
        return $plugin !== $minimal_plugin;
    });
    
    // Add main plugin
    $main_plugin = 'heiwa-booking-widget/heiwa-booking-widget.php';
    if (!in_array($main_plugin, $active_plugins)) {
        $active_plugins[] = $main_plugin;
    }
    
    // Update active plugins
    update_option('active_plugins', $active_plugins);
    
    echo "<p>✓ Switched to main Heiwa Booking Widget plugin</p>";
    echo "<p>✓ Deactivated minimal plugin</p>";
    
    echo "<h3>Final Status:</h3>";
    echo "<p>🎯 <strong>The main Heiwa Booking Widget plugin is now active and configured!</strong></p>";
    echo "<p>📋 You can now use <code>[heiwa_booking]</code> shortcode on any page</p>";
    echo "<p>🔗 Test it at: <a href='http://localhost:3006/?page_id=10'>Test Booking Page</a></p>";
    
} catch (Exception $e) {
    echo "<p>✗ Exception: " . $e->getMessage() . "</p>";
} catch (Error $e) {
    echo "<p>✗ Fatal Error: " . $e->getMessage() . "</p>";
}

echo "<p>Configuration complete</p>";
?>
