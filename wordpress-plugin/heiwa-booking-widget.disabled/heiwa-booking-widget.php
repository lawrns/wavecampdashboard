<?php
/**
 * Plugin Name: Heiwa Booking Widget
 * Plugin URI: https://heiwahouse.com
 * Description: A lightweight booking widget that integrates with the Heiwa House booking system. Displays a collapsible booking interface for surf camps and accommodations.
 * Version: 1.0.0
 * Author: Heiwa House
 * Author URI: https://heiwahouse.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: heiwa-booking-widget
 * Domain Path: /languages
 * Requires at least: 5.0
 * Tested up to: 6.4
 * Requires PHP: 7.4
 * Network: false
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEIWA_BOOKING_VERSION', '1.0.8');
define('HEIWA_WIDGET_BUILD_ID', '20250912-05');
define('HEIWA_BOOKING_PLUGIN_FILE', __FILE__);
define('HEIWA_BOOKING_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_BOOKING_PLUGIN_URL', plugin_dir_url(__FILE__));
define('HEIWA_BOOKING_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main plugin class
 */
class Heiwa_Booking_Widget {

    /**
     * Plugin instance
     */
    private static $instance = null;

    /**
     * Get plugin instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
        $this->load_dependencies();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Plugin loaded
        add_action('plugins_loaded', array($this, 'init'));
        
        // Admin init
        add_action('admin_init', array($this, 'admin_init'));
        
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_frontend_assets'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
        
        // Add settings link to plugin page
        add_filter('plugin_action_links_' . HEIWA_BOOKING_PLUGIN_BASENAME, array($this, 'add_settings_link'));

        // Add cache control headers for widget assets
        add_action('wp_headers', array($this, 'add_cache_headers'));
    }

    /**
     * Load plugin dependencies
     */
    private function load_dependencies() {
        // Security, sanitization, and permissions utilities (load first)
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/security.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/sanitization.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/permissions.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/class-rate-limiter.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/settings.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/theming.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/api-client.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/error-handling.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/i18n.php';

        // Core classes
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/class-api-connector.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/class-widget.php';
        require_once HEIWA_BOOKING_PLUGIN_DIR . 'includes/class-shortcode.php';

        // Optional REST proxy class (check if exists)
        $rest_proxy_file = HEIWA_BOOKING_PLUGIN_DIR . 'includes/class-rest-proxy.php';
        if (file_exists($rest_proxy_file)) {
            require_once $rest_proxy_file;
        }

        // Admin classes
        if (is_admin()) {
            require_once HEIWA_BOOKING_PLUGIN_DIR . 'admin/class-settings.php';
            require_once HEIWA_BOOKING_PLUGIN_DIR . 'admin/settings-page.php';
        }
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Set default options - enable auto-injection by default for better UX
        $default_options = array(
            'api_endpoint' => '',
            'api_key' => '',
            'widget_position' => 'right',
            'trigger_text' => 'BOOK NOW',
            'primary_color' => '#ec681c',
            'auto_inject' => true, // Enable auto-injection by default
            'enabled_pages' => array(), // Empty array = show on all pages
        );
        
        add_option('heiwa_booking_settings', $default_options);
        
        // Create log table if needed
        $this->create_log_table();
        
        // Clear any cached data
        wp_cache_flush();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('heiwa_booking_cleanup');
        
        // Clear cached data
        wp_cache_flush();
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain for translations
        load_plugin_textdomain('heiwa-booking-widget', false, dirname(HEIWA_BOOKING_PLUGIN_BASENAME) . '/languages');
        
        // Initialize components
        new Heiwa_Booking_Widget_Shortcode();
        new Heiwa_Booking_API_Connector();

        // Initialize admin settings
        if (is_admin()) {
            new Heiwa_Booking_Settings();
        }

        // Initialize widget if settings are configured
        $settings = get_option('heiwa_booking_settings', array());
        if (!empty($settings['api_endpoint']) && !empty($settings['api_key'])) {
            new Heiwa_Booking_Widget_Display();
        }
    }

    /**
     * Admin initialization
     */
    public function admin_init() {
        // Admin initialization tasks can go here
    }

    /**
     * Add cache control headers for widget assets
     */
    public function add_cache_headers() {
        // Only add headers for widget asset requests
        if (isset($_SERVER['REQUEST_URI'])) {
            $uri = $_SERVER['REQUEST_URI'];
            if (strpos($uri, '/wp-content/plugins/heiwa-booking-widget/assets/') !== false) {
                header('Cache-Control: no-cache, no-store, must-revalidate');
                header('Pragma: no-cache');
                header('Expires: 0');
            }
        }
    }

    /**
     * Enqueue frontend assets
     */
    public function enqueue_frontend_assets() {
        $settings = get_option('heiwa_booking_settings', array());
        
        // Only load if widget is configured
        if (empty($settings['api_endpoint']) || empty($settings['api_key'])) {
            return;
        }

        // Don't enqueue if shortcode is being used (it loads assets directly)
        global $heiwa_booking_shortcode_used;
        if (!empty($heiwa_booking_shortcode_used)) {
            return;
        }

        // Enqueue widget styles - modular CSS architecture
        wp_enqueue_style(
            'heiwa-booking-base',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/base.css',
            array(),
            HEIWA_WIDGET_BUILD_ID
        );

        wp_enqueue_style(
            'heiwa-booking-components',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/components.css',
            array('heiwa-booking-base'),
            HEIWA_WIDGET_BUILD_ID
        );

        wp_enqueue_style(
            'heiwa-booking-layout',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/layout.css',
            array('heiwa-booking-base', 'heiwa-booking-components'),
            HEIWA_WIDGET_BUILD_ID
        );

        wp_enqueue_style(
            'heiwa-booking-utilities',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/utilities.css',
            array('heiwa-booking-base', 'heiwa-booking-components', 'heiwa-booking-layout'),
            HEIWA_WIDGET_BUILD_ID
        );

        // Note: Modular CSS architecture is now complete with the 4 files above
        // No additional widget.css needed - utilities.css is the final layer

        // Enqueue widget script
        wp_enqueue_script(
            'heiwa-booking-widget',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/js/widget.js',
            array('jquery'),
            HEIWA_WIDGET_BUILD_ID,
            true
        );

        // Localize script with settings
        wp_localize_script('heiwa-booking-widget', 'heiwaBooking', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_booking_nonce'),
            'settings' => array(
                'position' => $settings['widget_position'],
                'triggerText' => $settings['trigger_text'],
                'primaryColor' => $settings['primary_color'],
            ),
            'strings' => array(
                'loading' => __('Loading...', 'heiwa-booking-widget'),
                'error' => __('An error occurred. Please try again.', 'heiwa-booking-widget'),
                'close' => __('Close', 'heiwa-booking-widget'),
            )
        ));

        // Expose REST API base and build ID for the front-end widget (no API key exposed)
        wp_localize_script('heiwa-booking-widget', 'heiwa_booking_ajax', array(
            'rest_base' => esc_url_raw(rest_url('heiwa/v1')),
            'nonce' => wp_create_nonce('wp_rest'),
            'build_id' => HEIWA_WIDGET_BUILD_ID,
        ));
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook_suffix) {
        // Only load on plugin settings page
        if ($hook_suffix !== 'settings_page_heiwa-booking-widget') {
            return;
        }

        wp_enqueue_style(
            'heiwa-booking-admin',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_script(
            'heiwa-booking-admin',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            HEIWA_BOOKING_VERSION,
            true
        );

        wp_localize_script('heiwa-booking-admin', 'heiwaBookingAdmin', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_booking_admin_nonce'),
            'strings' => array(
                'testing' => __('Testing connection...', 'heiwa-booking-widget'),
                'success' => __('Connection successful!', 'heiwa-booking-widget'),
                'error' => __('Connection failed. Please check your settings.', 'heiwa-booking-widget'),
            )
        ));
    }

    /**
     * Add settings link to plugin actions
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="' . admin_url('options-general.php?page=heiwa-booking-widget') . '">' . __('Settings', 'heiwa-booking-widget') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Create log table for debugging
     */
    private function create_log_table() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_booking_logs';
        
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE $table_name (
            id mediumint(9) NOT NULL AUTO_INCREMENT,
            timestamp datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
            level varchar(20) NOT NULL,
            message text NOT NULL,
            context text,
            PRIMARY KEY (id),
            KEY timestamp (timestamp),
            KEY level (level)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    /**
     * Log messages for debugging
     */
    public static function log($level, $message, $context = array()) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        global $wpdb;
        $table_name = $wpdb->prefix . 'heiwa_booking_logs';
        
        $wpdb->insert(
            $table_name,
            array(
                'level' => $level,
                'message' => $message,
                'context' => json_encode($context)
            ),
            array('%s', '%s', '%s')
        );
    }
}

/**
 * Initialize the plugin
 */
function heiwa_booking_widget_init() {
    return Heiwa_Booking_Widget::get_instance();
}

// Start the plugin
heiwa_booking_widget_init();

/**
 * Helper function for external theme integration
 */
function heiwa_booking_widget($args = array()) {
    if (class_exists('Heiwa_Booking_Widget_Display')) {
        $widget = new Heiwa_Booking_Widget_Display();
        $widget->display($args);
    }
}
