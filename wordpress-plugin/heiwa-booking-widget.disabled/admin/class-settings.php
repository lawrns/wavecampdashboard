<?php
/**
 * Admin Settings Class
 * Handles the WordPress admin settings page
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_Settings {

    /**
     * Settings page slug
     */
    const SETTINGS_PAGE = 'heiwa-booking-widget';

    /**
     * Settings group
     */
    const SETTINGS_GROUP = 'heiwa_booking_settings';

    /**
     * API connector instance
     */
    private $api;

    /**
     * Constructor
     */
    public function __construct() {
        $this->api = new Heiwa_Booking_API_Connector();
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Add settings page
        add_action('admin_menu', array($this, 'add_settings_page'));
        
        // Register settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // AJAX handlers for admin functionality
        add_action('wp_ajax_heiwa_test_connection', array($this, 'ajax_test_connection'));
    }

    /**
     * Add settings page to WordPress admin menu
     */
    public function add_settings_page() {
        add_options_page(
            __('Heiwa Booking Widget', 'heiwa-booking-widget'),
            __('Heiwa Booking', 'heiwa-booking-widget'),
            'manage_options',
            self::SETTINGS_PAGE,
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting(
            self::SETTINGS_GROUP,
            'heiwa_booking_settings',
            array(
                'sanitize_callback' => array($this, 'sanitize_settings'),
                'default' => array(
                    'api_endpoint' => '',
                    'api_key' => '',
                    'widget_position' => 'right',
                    'trigger_text' => 'BOOK NOW',
                    'primary_color' => '#2563eb',
                    'auto_inject' => false,
                    'enabled_pages' => array(),
                )
            )
        );

        // API Configuration Section
        add_settings_section(
            'heiwa_api_section',
            __('API Configuration', 'heiwa-booking-widget'),
            array($this, 'render_api_section_description'),
            self::SETTINGS_PAGE
        );

        add_settings_field(
            'api_endpoint',
            __('Heiwa API Endpoint', 'heiwa-booking-widget'),
            array($this, 'render_api_endpoint_field'),
            self::SETTINGS_PAGE,
            'heiwa_api_section'
        );

        add_settings_field(
            'api_key',
            __('API Key', 'heiwa-booking-widget'),
            array($this, 'render_api_key_field'),
            self::SETTINGS_PAGE,
            'heiwa_api_section'
        );

        // Widget Appearance Section
        add_settings_section(
            'heiwa_appearance_section',
            __('Widget Appearance', 'heiwa-booking-widget'),
            array($this, 'render_appearance_section_description'),
            self::SETTINGS_PAGE
        );

        add_settings_field(
            'widget_position',
            __('Widget Position', 'heiwa-booking-widget'),
            array($this, 'render_widget_position_field'),
            self::SETTINGS_PAGE,
            'heiwa_appearance_section'
        );

        add_settings_field(
            'trigger_text',
            __('Trigger Button Text', 'heiwa-booking-widget'),
            array($this, 'render_trigger_text_field'),
            self::SETTINGS_PAGE,
            'heiwa_appearance_section'
        );

        add_settings_field(
            'primary_color',
            __('Primary Color', 'heiwa-booking-widget'),
            array($this, 'render_primary_color_field'),
            self::SETTINGS_PAGE,
            'heiwa_appearance_section'
        );

        // Display Settings Section
        add_settings_section(
            'heiwa_display_section',
            __('Display Settings', 'heiwa-booking-widget'),
            array($this, 'render_display_section_description'),
            self::SETTINGS_PAGE
        );

        add_settings_field(
            'auto_inject',
            __('Auto-inject Widget', 'heiwa-booking-widget'),
            array($this, 'render_auto_inject_field'),
            self::SETTINGS_PAGE,
            'heiwa_display_section'
        );

        add_settings_field(
            'enabled_pages',
            __('Show Widget On', 'heiwa-booking-widget'),
            array($this, 'render_enabled_pages_field'),
            self::SETTINGS_PAGE,
            'heiwa_display_section'
        );
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        // Check user capabilities
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = get_option('heiwa_booking_settings', array());
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php
            // Show admin notices
            if (isset($_GET['settings-updated'])) {
                add_settings_error('heiwa_booking_messages', 'heiwa_booking_message', __('Settings saved.', 'heiwa-booking-widget'), 'updated');
            }
            settings_errors('heiwa_booking_messages');
            ?>

            <div class="heiwa-admin-container">
                <div class="heiwa-admin-main">
                    <form action="options.php" method="post">
                        <?php
                        settings_fields(self::SETTINGS_GROUP);
                        do_settings_sections(self::SETTINGS_PAGE);
                        ?>
                        
                        <div class="heiwa-connection-test">
                            <button type="button" id="heiwa-test-connection" class="button button-secondary">
                                <?php _e('Test Connection', 'heiwa-booking-widget'); ?>
                            </button>
                            <div id="heiwa-connection-result" class="heiwa-connection-result"></div>
                        </div>

                        <?php submit_button(); ?>
                    </form>
                </div>

                <div class="heiwa-admin-sidebar">
                    <div class="heiwa-admin-card">
                        <h3><?php _e('Quick Setup', 'heiwa-booking-widget'); ?></h3>
                        <ol>
                            <li><?php _e('Enter your Heiwa API endpoint URL', 'heiwa-booking-widget'); ?></li>
                            <li><?php _e('Add your API key (get this from your Heiwa admin)', 'heiwa-booking-widget'); ?></li>
                            <li><?php _e('Test the connection', 'heiwa-booking-widget'); ?></li>
                            <li><?php _e('Configure widget appearance', 'heiwa-booking-widget'); ?></li>
                            <li><?php _e('Choose where to display the widget', 'heiwa-booking-widget'); ?></li>
                        </ol>
                    </div>

                    <div class="heiwa-admin-card">
                        <h3><?php _e('Usage', 'heiwa-booking-widget'); ?></h3>
                        <p><?php _e('Use the shortcode to display the widget on specific pages:', 'heiwa-booking-widget'); ?></p>
                        <code>[heiwa_booking]</code>
                        
                        <p><?php _e('Or use the PHP function in your theme:', 'heiwa-booking-widget'); ?></p>
                        <code>&lt;?php heiwa_booking_widget(); ?&gt;</code>
                    </div>

                    <div class="heiwa-admin-card">
                        <h3><?php _e('Support', 'heiwa-booking-widget'); ?></h3>
                        <p><?php _e('Need help? Contact Heiwa House support:', 'heiwa-booking-widget'); ?></p>
                        <p>
                            <a href="mailto:support@heiwahouse.com" class="button button-secondary">
                                <?php _e('Get Support', 'heiwa-booking-widget'); ?>
                            </a>
                        </p>
                    </div>

                    <?php if ($this->api->is_configured()): ?>
                    <div class="heiwa-admin-card heiwa-status-card">
                        <h3><?php _e('Connection Status', 'heiwa-booking-widget'); ?></h3>
                        <div class="heiwa-status-indicator heiwa-status-connected">
                            <span class="dashicons dashicons-yes-alt"></span>
                            <?php _e('Connected', 'heiwa-booking-widget'); ?>
                        </div>
                        <p>
                            <strong><?php _e('API Endpoint:', 'heiwa-booking-widget'); ?></strong><br>
                            <code><?php echo esc_html($this->api->get_api_endpoint()); ?></code>
                        </p>
                        <p>
                            <strong><?php _e('API Key:', 'heiwa-booking-widget'); ?></strong><br>
                            <code><?php echo esc_html($this->api->get_masked_api_key()); ?></code>
                        </p>
                    </div>
                    <?php else: ?>
                    <div class="heiwa-admin-card heiwa-status-card">
                        <h3><?php _e('Connection Status', 'heiwa-booking-widget'); ?></h3>
                        <div class="heiwa-status-indicator heiwa-status-disconnected">
                            <span class="dashicons dashicons-warning"></span>
                            <?php _e('Not Connected', 'heiwa-booking-widget'); ?>
                        </div>
                        <p><?php _e('Please configure your API settings to connect to Heiwa House.', 'heiwa-booking-widget'); ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render API section description
     */
    public function render_api_section_description() {
        echo '<p>' . __('Configure the connection to your Heiwa House booking system.', 'heiwa-booking-widget') . '</p>';
    }

    /**
     * Render API endpoint field
     */
    public function render_api_endpoint_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['api_endpoint'] ?? '';
        ?>
        <input 
            type="url" 
            id="api_endpoint" 
            name="heiwa_booking_settings[api_endpoint]" 
            value="<?php echo esc_attr($value); ?>"
            class="regular-text"
            placeholder="https://your-heiwa-app.vercel.app/api"
        />
        <p class="description">
            <?php _e('The base URL of your Heiwa House API (without trailing slash)', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render API key field
     */
    public function render_api_key_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['api_key'] ?? '';
        ?>
        <input 
            type="password" 
            id="api_key" 
            name="heiwa_booking_settings[api_key]" 
            value="<?php echo esc_attr($value); ?>"
            class="regular-text"
            placeholder="heiwa_wp_your_api_key_here"
        />
        <p class="description">
            <?php _e('Your WordPress API key from the Heiwa House admin dashboard', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render appearance section description
     */
    public function render_appearance_section_description() {
        echo '<p>' . __('Customize how the booking widget looks and behaves.', 'heiwa-booking-widget') . '</p>';
    }

    /**
     * Render widget position field
     */
    public function render_widget_position_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['widget_position'] ?? 'right';
        ?>
        <select id="widget_position" name="heiwa_booking_settings[widget_position]">
            <option value="right" <?php selected($value, 'right'); ?>><?php _e('Right Side', 'heiwa-booking-widget'); ?></option>
            <option value="left" <?php selected($value, 'left'); ?>><?php _e('Left Side', 'heiwa-booking-widget'); ?></option>
            <option value="bottom" <?php selected($value, 'bottom'); ?>><?php _e('Bottom', 'heiwa-booking-widget'); ?></option>
        </select>
        <p class="description">
            <?php _e('Where the booking widget should appear on the page', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render trigger text field
     */
    public function render_trigger_text_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['trigger_text'] ?? 'BOOK NOW';
        ?>
        <input 
            type="text" 
            id="trigger_text" 
            name="heiwa_booking_settings[trigger_text]" 
            value="<?php echo esc_attr($value); ?>"
            class="regular-text"
        />
        <p class="description">
            <?php _e('Text displayed on the widget trigger button', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render primary color field
     */
    public function render_primary_color_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['primary_color'] ?? '#2563eb';
        ?>
        <input 
            type="color" 
            id="primary_color" 
            name="heiwa_booking_settings[primary_color]" 
            value="<?php echo esc_attr($value); ?>"
        />
        <p class="description">
            <?php _e('Primary color for buttons and highlights', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render display section description
     */
    public function render_display_section_description() {
        echo '<p>' . __('Control where and how the booking widget is displayed.', 'heiwa-booking-widget') . '</p>';
    }

    /**
     * Render auto-inject field
     */
    public function render_auto_inject_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $value = $settings['auto_inject'] ?? false;
        ?>
        <label for="auto_inject">
            <input 
                type="checkbox" 
                id="auto_inject" 
                name="heiwa_booking_settings[auto_inject]" 
                value="1"
                <?php checked($value, true); ?>
            />
            <?php _e('Automatically show widget on selected pages', 'heiwa-booking-widget'); ?>
        </label>
        <p class="description">
            <?php _e('If disabled, use shortcode [heiwa_booking] to display the widget manually', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Render enabled pages field
     */
    public function render_enabled_pages_field() {
        $settings = get_option('heiwa_booking_settings', array());
        $enabled_pages = $settings['enabled_pages'] ?? array();
        
        $page_options = array(
            'front_page' => __('Front Page', 'heiwa-booking-widget'),
            'home' => __('Blog Home', 'heiwa-booking-widget'),
            'pages' => __('All Pages', 'heiwa-booking-widget'),
            'posts' => __('All Posts', 'heiwa-booking-widget'),
        );
        ?>
        <fieldset>
            <?php foreach ($page_options as $key => $label): ?>
            <label for="enabled_pages_<?php echo esc_attr($key); ?>">
                <input 
                    type="checkbox" 
                    id="enabled_pages_<?php echo esc_attr($key); ?>" 
                    name="heiwa_booking_settings[enabled_pages][]" 
                    value="<?php echo esc_attr($key); ?>"
                    <?php checked(in_array($key, $enabled_pages)); ?>
                />
                <?php echo esc_html($label); ?>
            </label><br>
            <?php endforeach; ?>
        </fieldset>
        <p class="description">
            <?php _e('Select where the widget should appear automatically (only if auto-inject is enabled)', 'heiwa-booking-widget'); ?>
        </p>
        <?php
    }

    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $sanitized = array();
        
        $sanitized['api_endpoint'] = esc_url_raw(rtrim($input['api_endpoint'] ?? '', '/'));
        $sanitized['api_key'] = sanitize_text_field($input['api_key'] ?? '');
        $sanitized['widget_position'] = in_array($input['widget_position'] ?? '', array('right', 'left', 'bottom')) ? $input['widget_position'] : 'right';
        $sanitized['trigger_text'] = sanitize_text_field($input['trigger_text'] ?? 'BOOK NOW');
        $sanitized['primary_color'] = sanitize_hex_color($input['primary_color'] ?? '#2563eb');
        $sanitized['auto_inject'] = !empty($input['auto_inject']);
        $enabled_pages = $input['enabled_pages'] ?? array();
        $sanitized['enabled_pages'] = is_array($enabled_pages) ? array_map('sanitize_text_field', $enabled_pages) : array();

        return $sanitized;
    }

    /**
     * AJAX handler for testing API connection
     */
    public function ajax_test_connection() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_admin_nonce')) {
            wp_die('Security check failed');
        }

        // Check user capabilities
        if (!current_user_can('manage_options')) {
            wp_die('Insufficient permissions');
        }

        $response = $this->api->test_connection();
        
        wp_send_json($response);
    }
}
