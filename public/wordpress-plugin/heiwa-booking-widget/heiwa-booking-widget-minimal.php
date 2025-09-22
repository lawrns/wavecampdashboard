<?php
/**
 * Plugin Name: Heiwa Booking Widget (Minimal)
 * Plugin URI: https://heiwahouse.com
 * Description: Minimal version for testing plugin activation
 * Version: 1.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
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
 * Main plugin class - Minimal version
 */
class Heiwa_Booking_Widget_Minimal {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        // Activation hook
        register_activation_hook(__FILE__, array($this, 'activate'));

        // Basic init
        add_action('plugins_loaded', array($this, 'init'));

        // Add admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }

    public function activate() {
        $default_options = array(
            'api_endpoint' => '',
            'api_key' => '',
            'auto_inject' => true,
            'enabled_pages' => array(),
        );

        add_option('heiwa_booking_settings', $default_options);
    }

    public function init() {
        // Load text domain
        load_plugin_textdomain('heiwa-booking-widget', false, dirname(HEIWA_BOOKING_PLUGIN_BASENAME) . '/languages');

        // Check if API is configured
        $settings = get_option('heiwa_booking_settings', array());
        if (!empty($settings['api_endpoint']) && !empty($settings['api_key'])) {
            // Initialize basic widget
            add_action('wp_footer', array($this, 'render_minimal_widget'));
        }
    }

    public function add_admin_menu() {
        add_options_page(
            'Heiwa Booking Widget',
            'Heiwa Booking',
            'manage_options',
            'heiwa-booking-widget',
            array($this, 'admin_page')
        );
    }

    public function admin_page() {
        ?>
        <div class="wrap">
            <h1>Heiwa Booking Widget Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('heiwa_booking_settings');
                do_settings_sections('heiwa_booking_settings');
                submit_button();
                ?>
            </form>

            <h2>Current Settings</h2>
            <pre><?php print_r(get_option('heiwa_booking_settings', array())); ?></pre>
        </div>
        <?php
    }

    public function render_minimal_widget() {
        ?>
        <!-- Minimal Heiwa Booking Widget -->
        <div id="heiwa-booking-widget" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
            <button style="background: #ec681c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                BOOK NOW (Minimal)
            </button>
        </div>
        <?php
    }
}

// Start the plugin
function heiwa_booking_widget_minimal_init() {
    return Heiwa_Booking_Widget_Minimal::get_instance();
}

// Initialize on plugins_loaded
add_action('plugins_loaded', 'heiwa_booking_widget_minimal_init');
?>

