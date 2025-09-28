<?php
/**
 * Plugin Name: Heiwa Booking Widget
 * Plugin URI: https://heiwa-house.com
 * Description: WordPress plugin for the Heiwa House surf camp booking widget. Provides a custom web component that integrates seamlessly with WordPress sites.
 * Version: 1.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: heiwa-booking-widget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class HeiwaBookingWidget {

    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
    }

    /**
     * Enqueue the widget script and styles
     */
    public function enqueue_scripts() {
        $plugin_dir = plugin_dir_url(__FILE__);

        // Enqueue the bundled web component script
        wp_enqueue_script(
            'heiwa-widget-web',
            $plugin_dir . 'dist/heiwa-widget.web.js',
            array(),
            '1.0.0',
            true
        );

        // Localize script with configuration
        wp_localize_script('heiwa-widget-web', 'heiwaWidgetConfig', array(
            'apiEndpoint' => get_option('heiwa_api_endpoint', ''),
            'apiKey' => get_option('heiwa_api_key', ''),
            'pluginUrl' => $plugin_dir,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('wp_rest')
        ));
    }

    /**
     * Render the shortcode
     */
    public function render_shortcode($atts = array()) {
        $atts = shortcode_atts(array(
            'position' => 'right',
            'primary-color' => '#f97316',
            'trigger-text' => 'BOOK NOW'
        ), $atts);

        return sprintf(
            '<heiwa-booking-widget data-position="%s" data-primary-color="%s" data-trigger-text="%s"></heiwa-booking-widget>',
            esc_attr($atts['position']),
            esc_attr($atts['primary-color']),
            esc_attr($atts['trigger-text'])
        );
    }
}

// Initialize the plugin
new HeiwaBookingWidget();
