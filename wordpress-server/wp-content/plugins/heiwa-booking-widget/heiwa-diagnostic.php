<?php
/**
 * Heiwa Booking Widget Diagnostic Tool
 * Run this file to check plugin configuration and identify issues
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/../../../');
    require_once ABSPATH . 'wp-load.php';
}

echo "<h1>Heiwa Booking Widget Diagnostic</h1>";
echo "<style>body { font-family: monospace; margin: 20px; } .error { color: red; } .success { color: green; } .warning { color: orange; }</style>";

// Check if plugin is active
echo "<h2>Plugin Status</h2>";
if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

if (is_plugin_active('heiwa-booking-widget/heiwa-booking-widget.php')) {
    echo "<p class='success'>✓ Plugin is active</p>";
} else {
    echo "<p class='error'>✗ Plugin is NOT active</p>";
}

// Check settings
echo "<h2>Plugin Settings</h2>";
$settings = get_option('heiwa_booking_settings', array());

$checks = [
    'api_endpoint' => ['label' => 'API Endpoint', 'required' => true],
    'api_key' => ['label' => 'API Key', 'required' => true, 'mask' => true],
    'auto_inject' => ['label' => 'Auto-inject Enabled', 'required' => false],
    'widget_position' => ['label' => 'Widget Position', 'required' => false],
    'enabled_pages' => ['label' => 'Enabled Pages', 'required' => false],
];

foreach ($checks as $key => $check) {
    $value = $settings[$key] ?? null;

    if ($check['required'] && empty($value)) {
        echo "<p class='error'>✗ {$check['label']}: NOT SET (Required for widget to work)</p>";
    } elseif ($check['mask'] ?? false) {
        $masked = substr($value, 0, 8) . str_repeat('*', max(0, strlen($value) - 8));
        echo "<p class='success'>✓ {$check['label']}: {$masked}</p>";
    } else {
        $display_value = is_array($value) ? implode(', ', $value) : $value;
        echo "<p class='success'>✓ {$check['label']}: {$display_value}</p>";
    }
}

// Check widget conditions
echo "<h2>Widget Display Conditions</h2>";

$api_configured = !empty($settings['api_endpoint']) && !empty($settings['api_key']);
$auto_inject = !empty($settings['auto_inject']);

echo "<p>API Configured: " . ($api_configured ? "<span class='success'>YES</span>" : "<span class='error'>NO</span>") . "</p>";
echo "<p>Auto-inject Enabled: " . ($auto_inject ? "<span class='success'>YES</span>" : "<span class='error'>NO</span>") . "</p>";

// Check current page type
echo "<h2>Current Page Context</h2>";
echo "<p>Page Type: " . (is_home() ? 'Home' : (is_front_page() ? 'Front Page' : (is_page() ? 'Page' : (is_single() ? 'Post' : 'Other')))) . "</p>";
echo "<p>Is Admin: " . (is_admin() ? "<span class='error'>YES (Widget won\'t show)</span>" : "<span class='success'>NO</span>") . "</p>";

// Check if widget should show
$enabled_pages = $settings['enabled_pages'] ?? array();
$current_page_allowed = false;

if (is_home() && in_array('home', $enabled_pages)) $current_page_allowed = true;
if (is_front_page() && in_array('front_page', $enabled_pages)) $current_page_allowed = true;
if (is_page() && in_array('pages', $enabled_pages)) $current_page_allowed = true;
if (is_single() && in_array('posts', $enabled_pages)) $current_page_allowed = true;
if (empty($enabled_pages)) $current_page_allowed = true; // Show on all if none specified

echo "<p>Current Page Allowed: " . ($current_page_allowed ? "<span class='success'>YES</span>" : "<span class='error'>NO</span>") . "</p>";

// Overall status
echo "<h2>Overall Status</h2>";
$can_show_widget = $api_configured && ($auto_inject || !$auto_inject) && $current_page_allowed && !is_admin();

if ($can_show_widget) {
    echo "<p class='success'>✓ Widget SHOULD be visible on this page</p>";
} else {
    echo "<p class='error'>✗ Widget will NOT be visible. Issues:</p>";
    echo "<ul>";
    if (!$api_configured) echo "<li>API not configured</li>";
    if (!$auto_inject) echo "<li>Auto-inject disabled (use shortcode instead)</li>";
    if (!$current_page_allowed) echo "<li>Current page type not enabled</li>";
    if (is_admin()) echo "<li>Currently in admin area</li>";
    echo "</ul>";
}

// Quick fix suggestions
echo "<h2>Quick Fix Actions</h2>";
echo "<p><strong>If widget is not showing:</strong></p>";
echo "<ol>";
echo "<li>Go to WordPress Admin → Settings → Heiwa Booking Widget</li>";
echo "<li>Set API Endpoint (e.g., https://your-heiwa-app.vercel.app/api)</li>";
echo "<li>Set API Key (from your Heiwa House admin)</li>";
echo "<li>Enable 'Auto-inject Widget' checkbox</li>";
echo "<li>Select page types where widget should appear</li>";
echo "<li>Test connection and save settings</li>";
echo "</ol>";

echo "<p><strong>Alternative:</strong> Use shortcode <code>[heiwa_booking]</code> on any page</p>";

// Test API connection if configured
if ($api_configured) {
    echo "<h2>API Connection Test</h2>";
    try {
        if (class_exists('Heiwa_Booking_API_Connector')) {
            $api = new Heiwa_Booking_API_Connector();
            $test_result = $api->test_connection();

            if (isset($test_result['success']) && $test_result['success']) {
                echo "<p class='success'>✓ API Connection: SUCCESS</p>";
            } else {
                echo "<p class='error'>✗ API Connection: FAILED - " . ($test_result['message'] ?? 'Unknown error') . "</p>";
            }
        } else {
            echo "<p class='error'>✗ API Class not found - plugin may not be loaded correctly</p>";
        }
    } catch (Exception $e) {
        echo "<p class='error'>✗ API Test Error: " . $e->getMessage() . "</p>";
    }
}
?>

