<?php
/**
 * Plugin Name: Heiwa Booking Widget (SAFE MODE)
 * Plugin URI: https://heiwahouse.com
 * Description: Ultra-safe minimal version for emergency recovery
 * Version: 1.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define minimal constants
define('HEIWA_BOOKING_VERSION', '1.0.0');
define('HEIWA_BOOKING_PLUGIN_FILE', __FILE__);
define('HEIWA_BOOKING_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_BOOKING_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Ultra-safe plugin class
 * This version loads absolutely minimal functionality
 */
class Heiwa_Booking_Widget_Safe {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        // Only add the most basic hooks
        $this->init_safe_hooks();
    }

    private function init_safe_hooks() {
        // Activation hook only
        register_activation_hook(__FILE__, array($this, 'activate_safe'));

        // Basic init - only load text domain
        add_action('plugins_loaded', array($this, 'init_safe'));

        // Admin menu only if admin
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu_safe'));
            add_action('admin_notices', array($this, 'admin_notice_safe'));
        }
    }

    public function activate_safe() {
        // Set minimal options only
        $safe_options = array(
            'version' => HEIWA_BOOKING_VERSION,
            'status' => 'safe_mode',
            'activated' => time()
        );

        add_option('heiwa_booking_safe', $safe_options);

        // Create emergency log
        $log_file = WP_CONTENT_DIR . '/heiwa-emergency-log.txt';
        $log_message = date('Y-m-d H:i:s') . " - Plugin activated in SAFE MODE\n";
        file_put_contents($log_file, $log_message, FILE_APPEND);
    }

    public function init_safe() {
        // Load text domain only
        load_plugin_textdomain('heiwa-booking-widget', false, dirname(plugin_basename(__FILE__)) . '/languages');

        // Log safe initialization
        if (WP_DEBUG) {
            error_log('Heiwa Booking Widget (Safe Mode) initialized successfully');
        }
    }

    public function add_admin_menu_safe() {
        add_options_page(
            'Heiwa Booking Widget (Safe Mode)',
            'Heiwa Widget (Safe)',
            'manage_options',
            'heiwa-booking-widget-safe',
            array($this, 'admin_page_safe')
        );
    }

    public function admin_notice_safe() {
        $screen = get_current_screen();
        if ($screen->id === 'plugins') {
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p><strong>Heiwa Booking Widget:</strong> Plugin activated in SAFE MODE. ';
            echo '<a href="' . admin_url('options-general.php?page=heiwa-booking-widget-safe') . '">Configure here</a></p>';
            echo '</div>';
        }
    }

    public function admin_page_safe() {
        ?>
        <div class="wrap">
            <h1>Heiwa Booking Widget (SAFE MODE)</h1>

            <div class="notice notice-success">
                <p><strong>✅ SAFE MODE ACTIVE</strong> - Your site is protected and the plugin loaded successfully!</p>
            </div>

            <h2>Recovery Steps</h2>
            <ol>
                <li><strong>Site is back online</strong> - The plugin loaded without crashing</li>
                <li><strong>Configure API settings</strong> - Add your API endpoint and key below</li>
                <li><strong>Test connection</strong> - Verify the API works</li>
                <li><strong>Enable full features</strong> - Gradually activate functionality</li>
            </ol>

            <h2>Current Status</h2>
            <?php
            $safe_options = get_option('heiwa_booking_safe', array());
            $settings = get_option('heiwa_booking_settings', array());

            echo '<p><strong>Plugin Status:</strong> ' . ($safe_options['status'] ?? 'Unknown') . '</p>';
            echo '<p><strong>Activated:</strong> ' . date('Y-m-d H:i:s', $safe_options['activated'] ?? 0) . '</p>';
            echo '<p><strong>Full Settings Exist:</strong> ' . (!empty($settings) ? 'Yes' : 'No') . '</p>';
            ?>

            <h2>Emergency Controls</h2>
            <p><a href="#" onclick="confirm('Are you sure you want to deactivate this plugin?') && location.href='<?php echo admin_url('plugins.php?action=deactivate&plugin=heiwa-booking-widget/heiwa-booking-widget-safe.php&_wpnonce=' . wp_create_nonce('deactivate-plugin_heiwa-booking-widget/heiwa-booking-widget-safe.php')); ?>'" class="button button-secondary">Deactivate Plugin</a></p>

            <p><a href="<?php echo admin_url('plugins.php'); ?>" class="button">View All Plugins</a></p>

            <h2>Next Steps</h2>
            <p>Once you're ready to enable full functionality:</p>
            <ol>
                <li>Download the full plugin package</li>
                <li>Delete this safe version first</li>
                <li>Upload and activate the full version</li>
                <li>Configure API settings</li>
            </ol>
        </div>
        <?php
    }
}

// Start the plugin
function heiwa_booking_widget_safe_init() {
    return Heiwa_Booking_Widget_Safe::get_instance();
}

// Initialize on plugins_loaded (safest hook)
add_action('plugins_loaded', 'heiwa_booking_widget_safe_init', 1); // Load first, priority 1
?>

