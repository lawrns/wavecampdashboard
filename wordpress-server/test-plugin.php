<?php
// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Plugin Test</h1>";

// Try to load WordPress
try {
    require_once 'wp-load.php';
    echo "<p>✓ WordPress loaded successfully</p>";
} catch (Exception $e) {
    echo "<p>✗ WordPress load failed: " . $e->getMessage() . "</p>";
    exit;
}

echo "<p>Active plugins:</p>";
$active_plugins = get_option('active_plugins');
echo "<pre>" . print_r($active_plugins, true) . "</pre>";

echo "<p>Shortcode exists:</p>";
echo "<pre>" . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</pre>";

echo "<p>Plugin loaded:</p>";
echo "<pre>" . (class_exists('Heiwa_Booking_Widget') ? 'YES' : 'NO') . "</pre>";

// Try to manually include the plugin
echo "<p>Manual plugin load attempt:</p>";
try {
    $plugin_file = 'wp-content/plugins/heiwa-booking-widget/heiwa-booking-widget.php';
    if (file_exists($plugin_file)) {
        require_once $plugin_file;
        echo "<pre>✓ Plugin file included</pre>";
        echo "<pre>Plugin class exists: " . (class_exists('Heiwa_Booking_Widget') ? 'YES' : 'NO') . "</pre>";

        // Try to manually initialize the plugin
        if (class_exists('Heiwa_Booking_Widget')) {
            echo "<pre>Trying to initialize plugin...</pre>";
            $instance = Heiwa_Booking_Widget::get_instance();
            echo "<pre>✓ Plugin initialized</pre>";

            // Check if shortcode class exists
            echo "<pre>Shortcode class exists: " . (class_exists('Heiwa_Booking_Widget_Shortcode') ? 'YES' : 'NO') . "</pre>";

            // Try to manually instantiate shortcode class
            if (class_exists('Heiwa_Booking_Widget_Shortcode')) {
                echo "<pre>Instantiating shortcode class...</pre>";
                new Heiwa_Booking_Widget_Shortcode();
                echo "<pre>✓ Shortcode class instantiated</pre>";
                echo "<pre>Shortcode exists after manual instantiation: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</pre>";
            }

            echo "<pre>Shortcode exists after init: " . (shortcode_exists('heiwa_booking') ? 'YES' : 'NO') . "</pre>";
        }
    } else {
        echo "<pre>✗ Plugin file not found: $plugin_file</pre>";
    }
} catch (Exception $e) {
    echo "<pre>✗ Plugin load error: " . $e->getMessage() . "</pre>";
}
?>
