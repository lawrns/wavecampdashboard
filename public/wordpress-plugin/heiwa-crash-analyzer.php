<?php
/**
 * Heiwa Booking Widget - Crash Analysis Tool
 * Run this to identify what caused the site crash
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/../../../');
    require_once ABSPATH . 'wp-load.php';
}

echo "<h1>Heiwa Booking Widget - Crash Analysis</h1>";
echo "<style>body { font-family: monospace; margin: 20px; } .error { color: red; } .success { color: green; } .warning { color: orange; }</style>";

// Check PHP version
echo "<h2>PHP Environment</h2>";
echo "<p>PHP Version: " . PHP_VERSION . "</p>";
echo "<p>Memory Limit: " . ini_get('memory_limit') . "</p>";
echo "<p>Max Execution Time: " . ini_get('max_execution_time') . "</p>";

// Check plugin status
echo "<h2>Plugin Status</h2>";
if (!function_exists('is_plugin_active')) {
    require_once ABSPATH . 'wp-admin/includes/plugin.php';
}

$plugin_active = is_plugin_active('heiwa-booking-widget/heiwa-booking-widget.php');
echo "<p>Heiwa Plugin Active: " . ($plugin_active ? "<span class='error'>YES (This may be the problem!)</span>" : "<span class='success'>NO</span>") . "</p>";

// Check error logs
echo "<h2>Error Analysis</h2>";

// Check WordPress debug log
$debug_log = WP_CONTENT_DIR . '/debug.log';
if (file_exists($debug_log)) {
    echo "<p>WordPress Debug Log Found:</p>";
    $log_content = file_get_contents($debug_log);
    $log_lines = explode("\n", $log_content);
    $recent_errors = array_slice($log_lines, -20); // Last 20 lines

    echo "<details><summary>View Recent Errors</summary><pre>";
    foreach ($recent_errors as $line) {
        if (strpos($line, 'Heiwa') !== false || strpos($line, 'Fatal') !== false || strpos($line, 'Error') !== false) {
            echo htmlspecialchars($line) . "\n";
        }
    }
    echo "</pre></details>";
} else {
    echo "<p class='warning'>No WordPress debug log found. Enable WP_DEBUG to get detailed error information.</p>";
}

// Check plugin files
echo "<h2>Plugin File Analysis</h2>";
$plugin_dir = WP_PLUGIN_DIR . '/heiwa-booking-widget/';
if (is_dir($plugin_dir)) {
    echo "<p>Plugin Directory Exists: <span class='success'>YES</span></p>";

    // Check for main plugin file
    $main_file = $plugin_dir . 'heiwa-booking-widget.php';
    if (file_exists($main_file)) {
        echo "<p>Main Plugin File: <span class='success'>EXISTS</span></p>";

        // Check file syntax
        $syntax_check = php_check_syntax($main_file);
        echo "<p>File Syntax: " . ($syntax_check ? "<span class='success'>VALID</span>" : "<span class='error'>INVALID</span>") . "</p>";
    } else {
        echo "<p class='error'>Main Plugin File: MISSING</p>";
    }

    // Check includes directory
    $includes_dir = $plugin_dir . 'includes/';
    if (is_dir($includes_dir)) {
        echo "<p>Includes Directory: <span class='success'>EXISTS</span></p>";

        $missing_files = [];
        $expected_files = [
            'class-api-connector.php',
            'class-widget.php',
            'class-shortcode.php',
            'security.php',
            'settings.php'
        ];

        foreach ($expected_files as $file) {
            if (!file_exists($includes_dir . $file)) {
                $missing_files[] = $file;
            }
        }

        if (!empty($missing_files)) {
            echo "<p class='error'>Missing Include Files: " . implode(', ', $missing_files) . "</p>";
        } else {
            echo "<p>All Expected Include Files: <span class='success'>PRESENT</span></p>";
        }
    } else {
        echo "<p class='error'>Includes Directory: MISSING</p>";
    }
} else {
    echo "<p class='error'>Plugin Directory: NOT FOUND</p>";
}

// Check database
echo "<h2>Database Analysis</h2>";
global $wpdb;
$options_table = $wpdb->prefix . 'options';

$heiwa_options = $wpdb->get_var($wpdb->prepare(
    "SELECT COUNT(*) FROM $options_table WHERE option_name LIKE %s",
    'heiwa_%'
));

echo "<p>Heiwa Database Options: $heiwa_options</p>";

if ($heiwa_options > 0) {
    echo "<p class='warning'>Heiwa options found in database. Consider cleaning up if needed.</p>";
}

// Memory analysis
echo "<h2>Memory Analysis</h2>";
echo "<p>Current Memory Usage: " . memory_get_usage(true) . " bytes</p>";
echo "<p>Peak Memory Usage: " . memory_get_peak_usage(true) . " bytes</p>";

// Recommendations
echo "<h2>Recommendations</h2>";
echo "<ol>";
echo "<li><strong>IMMEDIATE:</strong> Deactivate the plugin if site is still down</li>";
echo "<li><strong>Check PHP error logs</strong> for specific error messages</li>";
echo "<li><strong>Increase PHP memory limit</strong> if it's less than 256MB</li>";
echo "<li><strong>Enable WP_DEBUG</strong> to get detailed error information</li>";
echo "<li><strong>Check for plugin conflicts</strong> by deactivating other plugins temporarily</li>";
echo "<li><strong>Test on a staging site</strong> before activating on production</li>";
echo "</ol>";

// Next steps
echo "<h2>Next Steps</h2>";
echo "<p>1. Get your site back online first</p>";
echo "<p>2. Identify the specific error that caused the crash</p>";
echo "<p>3. Test the safe recovery version</p>";
echo "<p>4. Gradually enable functionality</p>";

echo "<h2>Emergency Actions</h2>";
echo "<p><a href='" . wp_nonce_url(admin_url('plugins.php?action=deactivate&plugin=heiwa-booking-widget/heiwa-booking-widget.php'), 'deactivate-plugin_heiwa-booking-widget/heiwa-booking-widget.php') . "' class='button button-primary' onclick='return confirm(\"Are you sure you want to deactivate this plugin?\")'>Deactivate Plugin</a></p>";

function php_check_syntax($file) {
    $output = shell_exec("php -l " . escapeshellarg($file) . " 2>&1");
    return strpos($output, 'No syntax errors detected') !== false;
}
?>

