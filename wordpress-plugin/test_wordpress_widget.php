<?php
// Direct test of the WordPress widget shortcode
echo "<html><head><title>WordPress Widget Test</title></head><body>";
echo "<h1>Testing WordPress Widget Shortcode</h1>";

// Simulate WordPress environment
define('ABSPATH', '/tmp/');
define('WPINC', 'wp-includes');

// Mock WordPress functions
function wp_enqueue_script($handle, $src = '', $deps = array(), $ver = false, $in_footer = false) {
    echo "<script src='$src'></script>\n";
}

function wp_enqueue_style($handle, $src = '', $deps = array(), $ver = false, $media = 'all') {
    echo "<link rel='stylesheet' href='$src'>\n";
}

function wp_create_nonce($action) {
    return 'test_nonce_123';
}

function admin_url($path) {
    return 'http://localhost:3007/wp-admin/' . $path;
}

function rest_url($path) {
    return 'http://localhost:3007/wp-json/' . $path;
}

function plugins_url($path, $plugin) {
    return 'http://localhost:3007/wp-content/plugins/heiwa-react-widget/' . $path;
}

function wp_generate_uuid4() {
    return 'test-uuid-' . rand(1000, 9999);
}

function esc_attr($text) {
    return htmlspecialchars($text, ENT_QUOTES);
}

function sanitize_key($key) {
    return preg_replace('/[^a-zA-Z0-9_\-]/', '', $key);
}

// Load and test the shortcode
require_once 'heiwa-react-widget/heiwa-react-widget.php';

// Test the shortcode
echo "<h2>Shortcode Output:</h2>";
echo "<div style='border: 2px solid #ccc; padding: 20px; margin: 20px 0;'>";
echo do_shortcode('[heiwa_booking]');
echo "</div>";

echo "</body></html>";
