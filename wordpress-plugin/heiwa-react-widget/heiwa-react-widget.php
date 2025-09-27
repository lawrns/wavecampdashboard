<?php
/**
 * Plugin Name: Heiwa Booking Widget
 * Plugin URI: https://heiwahouse.com
 * Description: React-powered booking widget as a Web Component with Shadow DOM isolation
 * Version: 2.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEIWA_REACT_VERSION', '2.0.0');
define('HEIWA_REACT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_REACT_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * React Widget Shortcode Class
 */
class Heiwa_React_Widget_Shortcode {
    
    public function __construct() {
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        error_log('Heiwa React Widget: Shortcode class initialized');
    }
    
    public function enqueue_assets() {
        $asset_url  = HEIWA_REACT_PLUGIN_URL . 'assets/build/';
        $asset_path = HEIWA_REACT_PLUGIN_DIR . 'assets/build/';
        $bundle_handle = 'heiwa-booking-widget-web';
        $bundle_file   = 'heiwa-widget.web.js';

        // Ensure React and ReactDOM are available globally for the web component
        if (!wp_script_is('heiwa-react', 'registered')) {
            wp_register_script(
                'heiwa-react',
                'https://unpkg.com/react@18/umd/react.production.min.js',
                array(),
                '18.2.0',
                true
            );
        }

        if (!wp_script_is('heiwa-react-dom', 'registered')) {
            wp_register_script(
                'heiwa-react-dom',
                'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
                array('heiwa-react'),
                '18.2.0',
                true
            );
        }

        wp_enqueue_script('heiwa-react');
        wp_enqueue_script('heiwa-react-dom');

        // Enqueue the web component bundle
        $bundle_version = '2.0.0';
        if (file_exists($asset_path . $bundle_file)) {
            $bundle_version = filemtime($asset_path . $bundle_file);
        }

        wp_enqueue_script(
            $bundle_handle,
            $asset_url . $bundle_file,
            array('heiwa-react-dom'),
            $bundle_version,
            true
        );

        error_log('Heiwa Booking Widget: Web component assets enqueued');
    }


    public function render_shortcode($atts, $content = '') {
        error_log('Heiwa Booking Widget: Web component shortcode called');

        // Parse shortcode attributes (for future customization)
        $atts = shortcode_atts(array(
            'id' => 'wp-shortcode-' . wp_generate_uuid4(),
        ), $atts, 'heiwa_booking');

        // Generate unique widget ID for the web component
        $widget_id = 'heiwa-widget-' . sanitize_key($atts['id']);

        // Return the web component - it will be automatically initialized when the script loads
        $output = '<heiwa-booking-widget id="' . esc_attr($widget_id) . '"></heiwa-booking-widget>';

        error_log('Heiwa Booking Widget: Web component shortcode output: ' . $output);
        return $output;
    }
}

/**
 * Initialize the React widget plugin
 */
function heiwa_react_widget_init() {
    error_log('Heiwa React Widget: Plugin initializing');
    new Heiwa_React_Widget_Shortcode();
    error_log('Heiwa React Widget: Plugin initialized');
}

// Hook into WordPress
add_action('plugins_loaded', 'heiwa_react_widget_init');

error_log('Heiwa React Widget: Plugin file loaded');
?>
