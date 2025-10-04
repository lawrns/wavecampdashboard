<?php
/**
 * Plugin Name: Heiwa Booking Widget (Web Component)
 * Plugin URI: https://heiwa.house
 * Description: Embeddable booking widget for surf camps using Web Components with Shadow DOM isolation.
 * Version: 2.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: heiwa-booking-widget
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEIWA_WIDGET_VERSION', '2.0.0');
define('HEIWA_WIDGET_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_WIDGET_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HEIWA_WIDGET_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class Heiwa_Booking_Widget_Plugin {

    /**
     * Constructor
     */
    public function __construct() {
            $this->init_hooks();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        add_action('plugins_loaded', array($this, 'load_textdomain'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
        add_action('admin_notices', array($this, 'admin_notices'));
        add_filter('plugin_action_links_' . HEIWA_WIDGET_PLUGIN_BASENAME, array($this, 'plugin_action_links'));
    }

    /**
     * Load plugin textdomain for internationalization
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'heiwa-booking-widget',
            false,
            dirname(HEIWA_WIDGET_PLUGIN_BASENAME) . '/languages/'
        );
    }

    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_scripts() {
        // Only enqueue on pages that might have the shortcode
        if (!$this->should_enqueue_widget()) {
            return;
        }

        $this->enqueue_widget_bundle();
        $this->localize_widget_config();
    }

    /**
     * Check if widget should be enqueued on current page
     */
    private function should_enqueue_widget() {
        global $post;

        // Always enqueue in admin for testing
        if (is_admin()) {
            return true;
        }

        // Check if shortcode exists in post content
        if (is_singular() && isset($post->post_content)) {
            if (has_shortcode($post->post_content, 'heiwa_booking')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enqueue the Web Component bundle
     */
    private function enqueue_widget_bundle() {
        $script_handle = 'heiwa-widget-web-component';
        $script_path = 'dist/heiwa-widget.web.js';
        $script_url = HEIWA_WIDGET_PLUGIN_URL . $script_path;
        $script_file = HEIWA_WIDGET_PLUGIN_DIR . $script_path;

        // Check if built file exists
        if (!file_exists($script_file)) {
            error_log('Heiwa Widget: Built bundle not found at ' . $script_file);
            return;
        }

        // Get file modification time for cache busting
        $version = filemtime($script_file);

        wp_enqueue_script(
            $script_handle,
            $script_url,
            array(), // No dependencies - Web Component is self-contained
            $version,
            true // Load in footer
        );
    }

    /**
     * Localize widget configuration
     */
    private function localize_widget_config() {
        $config = array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_widget_nonce'),
            'restBase' => rest_url('heiwa/v1'),
            'pluginUrl' => HEIWA_WIDGET_PLUGIN_URL,
            'buildId' => 'react-widget-webc-' . time(),
            'version' => HEIWA_WIDGET_VERSION,
            'locale' => get_locale(),
            'isRtl' => is_rtl(),
            'settings' => $this->get_widget_settings(),
        );

        // Make config available to JavaScript
        wp_localize_script('heiwa-widget-web-component', 'heiwaWidgetConfig', $config);

        // Also inject as inline script for redundancy
        wp_add_inline_script(
            'heiwa-widget-web-component',
            'window.heiwaWidgetConfig = ' . wp_json_encode($config) . ';',
            'before'
        );
    }

    /**
     * Get widget settings from WordPress options
     */
    private function get_widget_settings() {
        return array(
            'apiEndpoint' => $this->get_api_endpoint(),
            'apiKey' => $this->get_api_key(),
            'position' => get_option('heiwa_widget_position', 'right'),
            'primaryColor' => get_option('heiwa_widget_primary_color', '#f97316'),
            'triggerText' => get_option('heiwa_widget_trigger_text', __('Book Your Surf Trip', 'heiwa-booking-widget')),
            'maxGuests' => intval(get_option('heiwa_widget_max_guests', 10)),
            'enabled' => get_option('heiwa_widget_enabled', true),
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
            'useWebComponent' => get_option('heiwa_widget_use_web_component', true), // Feature flag
        );
    }

    /**
     * Get API endpoint with fallbacks
     */
    private function get_api_endpoint() {
        // Environment variable override
        $env_endpoint = getenv('HEIWA_ADMIN_API_BASE');
        if ($env_endpoint) {
            return $env_endpoint;
        }

        // Constant override
        if (defined('HEIWA_ADMIN_API_BASE')) {
            return HEIWA_ADMIN_API_BASE;
        }

        // Option fallback
        $option_endpoint = get_option('heiwa_api_endpoint');
        if ($option_endpoint) {
            return $option_endpoint;
        }

        // Development default
        return 'http://localhost:3005/api';
    }

    /**
     * Get API key with security considerations
     */
    private function get_api_key() {
        // Environment variable (most secure)
        $env_key = getenv('HEIWA_ADMIN_API_KEY');
        if ($env_key) {
            return $env_key;
        }

        // Constant override
        if (defined('HEIWA_ADMIN_API_KEY')) {
            return HEIWA_ADMIN_API_KEY;
        }

        // Option fallback (least secure - should be avoided in production)
        $option_key = get_option('heiwa_api_key');
        if ($option_key) {
            return $option_key;
        }

        // Development default (should not be used in production)
        return 'heiwa_wp_test_key_2024_secure_deployment';
    }

    /**
     * Add admin notices for configuration and updates
     */
    public function admin_notices() {
        // Check if API is configured
        $api_endpoint = $this->get_api_endpoint();
        $api_key = $this->get_api_key();

        if (empty($api_endpoint) || empty($api_key) || $api_endpoint === 'http://localhost:3005/api') {
            ?>
            <div class="notice notice-warning is-dismissible">
                <p>
                    <strong><?php _e('Heiwa Booking Widget:', 'heiwa-booking-widget'); ?></strong>
                    <?php _e('Please configure your API settings to enable the booking widget.', 'heiwa-booking-widget'); ?>
                    <a href="<?php echo admin_url('admin.php?page=heiwa-booking-widget-settings'); ?>">
                        <?php _e('Configure now', 'heiwa-booking-widget'); ?>
                    </a>
                </p>
            </div>
            <?php
        }

        // Check for updates (simplified version)
        $this->check_for_updates_notice();
    }

    /**
     * Check for updates and show notice if available
     */
    private function check_for_updates_notice() {
        // In a real implementation, this would check a remote API
        // For now, we'll show a generic update notice periodically
        $last_update_check = get_option('heiwa_widget_last_update_check', 0);
        $current_time = current_time('timestamp');

        // Check for updates once per day
        if (($current_time - $last_update_check) > DAY_IN_SECONDS) {
            update_option('heiwa_widget_last_update_check', $current_time);

            // Simulate update check (replace with real API call)
            $latest_version = $this->check_latest_version();

            if (version_compare($latest_version, HEIWA_WIDGET_VERSION, '>')) {
                ?>
                <div class="notice notice-info is-dismissible">
                    <p>
                        <strong><?php _e('Heiwa Booking Widget Update Available', 'heiwa-booking-widget'); ?></strong><br>
                        <?php printf(
                            __('Version %s is available. You are running version %s.', 'heiwa-booking-widget'),
                            $latest_version,
                            HEIWA_WIDGET_VERSION
                        ); ?>
                        <a href="https://github.com/heiwa/heiwa-booking-widget/releases" target="_blank">
                            <?php _e('View changelog', 'heiwa-booking-widget'); ?>
                        </a>
                    </p>
                </div>
                <?php
            }
        }
    }

    /**
     * Check latest version from remote API
     */
    private function check_latest_version() {
        // In production, this would make an API call to check for updates
        // For demo purposes, return current version + 0.1
        $parts = explode('.', HEIWA_WIDGET_VERSION);
        $parts[count($parts) - 1] = strval(intval($parts[count($parts) - 1]) + 1);
        return implode('.', $parts);
    }

    /**
     * Add action links to plugin list
     */
    public function plugin_action_links($links) {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            admin_url('admin.php?page=heiwa-booking-widget-settings'),
            __('Settings', 'heiwa-booking-widget')
        );

        $docs_link = sprintf(
            '<a href="%s" target="_blank">%s</a>',
            'https://github.com/heiwa/heiwa-booking-widget#readme',
            __('Docs', 'heiwa-booking-widget')
        );

        array_unshift($links, $settings_link, $docs_link);
        return $links;
    }

    /**
     * Render the shortcode
     */
    public function render_shortcode($atts = array()) {
        // Sanitize and validate attributes
        $atts = shortcode_atts(array(
            'position' => 'right',
            'trigger_text' => __('Book Your Surf Trip', 'heiwa-booking-widget'),
            'primary_color' => '#f97316',
            'max_guests' => 10,
            'id' => 'wp-shortcode-' . wp_generate_uuid4(),
        ), $atts, 'heiwa_booking');

        // Sanitize attributes
        $atts['position'] = sanitize_text_field($atts['position']);
        $atts['trigger_text'] = sanitize_text_field($atts['trigger_text']);
        $atts['primary_color'] = sanitize_hex_color($atts['primary_color']) ?: '#f97316';
        $atts['max_guests'] = intval($atts['max_guests']);
        $atts['id'] = sanitize_html_class($atts['id']);

        // Validate position
        $valid_positions = array('right', 'left', 'center');
        if (!in_array($atts['position'], $valid_positions)) {
            $atts['position'] = 'right';
        }

        // Validate max guests
        if ($atts['max_guests'] < 1 || $atts['max_guests'] > 20) {
            $atts['max_guests'] = 10;
        }

        // Check feature flag for Web Component usage
        $use_web_component = get_option('heiwa_widget_use_web_component', true);

        if ($use_web_component) {
            return $this->render_web_component($atts);
        } else {
            return $this->render_fallback($atts);
        }
    }

    /**
     * Render the Web Component version
     */
    private function render_web_component($atts) {
        // Build data attributes for the Web Component
        $data_attributes = array(
            'data-position' => $atts['position'],
            'data-primary-color' => $atts['primary_color'],
            'data-trigger-text' => $atts['trigger_text'],
            'data-max-guests' => $atts['max_guests'],
            'data-id' => $atts['id'],
        );

        // Build the HTML output
        $attributes_string = '';
        foreach ($data_attributes as $key => $value) {
            $attributes_string .= sprintf(' %s="%s"', $key, esc_attr($value));
        }

        $output = '<div class="heiwa-booking-widget-container">';
        $output .= sprintf('<heiwa-booking-widget%s></heiwa-booking-widget>', $attributes_string);
        $output .= '</div>';

        return $output;
    }

    /**
     * Render fallback version (simple link/button)
     */
    private function render_fallback($atts) {
        $api_endpoint = $this->get_api_endpoint();

        // Create a simple fallback that links to external booking page
        $booking_url = add_query_arg(array(
            'camp' => 'default', // Could be made configurable
            'source' => 'wordpress-fallback',
            'position' => $atts['position'],
        ), $api_endpoint . '/book');

        $output = '<div class="heiwa-booking-widget-fallback" style="text-align: center; padding: 20px;">';
        $output .= sprintf(
            '<a href="%s" class="heiwa-booking-button" style="background-color: %s; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">%s</a>',
            esc_url($booking_url),
            esc_attr($atts['primary_color']),
            esc_html($atts['trigger_text'])
        );
        $output .= '<p style="margin-top: 10px; font-size: 12px; color: #666;">';
        $output .= __('Booking powered by Heiwa House', 'heiwa-booking-widget');
        $output .= '</p>';
        $output .= '</div>';

        return $output;
    }
}

// Initialize the plugin
new Heiwa_Booking_Widget_Plugin();

/**
 * Activation hook
 */
register_activation_hook(__FILE__, 'heiwa_booking_widget_activate');

function heiwa_booking_widget_activate() {
    // Set default options
    add_option('heiwa_widget_enabled', true);
    add_option('heiwa_widget_position', 'right');
    add_option('heiwa_widget_primary_color', '#f97316');
    add_option('heiwa_widget_trigger_text', 'Book Your Surf Trip');
    add_option('heiwa_widget_max_guests', 10);
}

/**
 * Deactivation hook
 */
register_deactivation_hook(__FILE__, 'heiwa_booking_widget_deactivate');

function heiwa_booking_widget_deactivate() {
    // Clean up if needed
}

/**
 * Uninstall hook
 */
register_uninstall_hook(__FILE__, 'heiwa_booking_widget_uninstall');

function heiwa_booking_widget_uninstall() {
    // Remove all options
    delete_option('heiwa_api_endpoint');
    delete_option('heiwa_api_key');
    delete_option('heiwa_widget_enabled');
    delete_option('heiwa_widget_position');
    delete_option('heiwa_widget_primary_color');
    delete_option('heiwa_widget_trigger_text');
    delete_option('heiwa_widget_max_guests');
}