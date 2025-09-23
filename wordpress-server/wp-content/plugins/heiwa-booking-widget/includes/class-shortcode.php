<?php
/**
 * Shortcode Handler Class
 * Handles the [heiwa_booking] shortcode functionality
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_Widget_Shortcode {

    /**
     * Constructor
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register shortcode
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));

        // Add shortcode button to editor (optional)
        add_action('media_buttons', array($this, 'add_shortcode_button'));

        // Always enqueue assets to ensure shortcode works
        add_action('wp_enqueue_scripts', array($this, 'enqueue_react_assets'));
    }

    /**
     * Enqueue React widget assets
     */
    private function enqueue_react_assets() {
        $plugin_url = plugins_url('/', dirname(dirname(__FILE__)));

        // Enqueue React and ReactDOM
        wp_enqueue_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', array(), '18.0.0', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', array('react'), '18.0.0', true);

        // Enqueue widget styles
        wp_enqueue_style(
            'heiwa-widget-styles',
            $plugin_url . 'assets/build/widget-styles.css',
            array(),
            'react-widget-1757864064024'
        );

        // Enqueue widget script - use the WordPress-specific build
        wp_enqueue_script(
            'heiwa-widget-wordpress',
            $plugin_url . 'assets/build/widget-wordpress/page-4bb7bd29d238faf5.js',
            array('react', 'react-dom', 'jquery'),
            'react-widget-1757864064024',
            true
        );

        // Localize script with WordPress configuration
        wp_localize_script('heiwa-widget-wordpress', 'heiwaWidgetConfig', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_widget_nonce'),
            'restBase' => rest_url('heiwa/v1'),
            'pluginUrl' => $plugin_url,
            'buildId' => 'react-widget-1757864064024',
            'settings' => array(
                'apiEndpoint' => site_url('/api'),
                'apiKey' => 'heiwa_wp_test_key_2024_secure_deployment',
                'position' => 'right',
                'primaryColor' => '#f97316',
                'triggerText' => 'BOOK NOW'
            )
        ));
    }

    /**
     * Render the shortcode
     * 
     * @param array $atts Shortcode attributes
     * @param string $content Shortcode content
     * @return string HTML output
     */
    public function render_shortcode($atts, $content = '') {
        // Debug output
        error_log('Heiwa Booking Shortcode called with atts: ' . print_r($atts, true));

        // Parse shortcode attributes
        $atts = shortcode_atts(array(
            'position' => '', // Override widget position
            'trigger_text' => '', // Override trigger button text
            'primary_color' => '', // Override primary color
            'destinations' => '', // Comma-separated list of destination filters
            'level' => '', // Skill level filter
            'inline' => 'false', // Display inline instead of fixed position
            'id' => '', // Custom ID for multiple widgets
        ), $atts, 'heiwa_booking');

        // Get plugin settings
        $settings = get_option('heiwa_booking_settings', array());
        
        // Check if API is configured
        $api = new Heiwa_Booking_API_Connector();
        if (!$api->is_configured()) {
            if (current_user_can('manage_options')) {
                return '<div class="heiwa-booking-error">' . 
                       __('Heiwa Booking Widget: Please configure API settings.', 'heiwa-booking-widget') . 
                       ' <a href="' . admin_url('options-general.php?page=heiwa-booking-widget') . '">' . 
                       __('Configure now', 'heiwa-booking-widget') . '</a>' .
                       '</div>';
            }
            return ''; // Don't show anything to regular users
        }

        // Merge shortcode attributes with settings
        $widget_settings = array(
            'position' => !empty($atts['position']) ? $atts['position'] : ($settings['widget_position'] ?? 'right'),
            'trigger_text' => !empty($atts['trigger_text']) ? $atts['trigger_text'] : ($settings['trigger_text'] ?? 'BOOK NOW'),
            'primary_color' => !empty($atts['primary_color']) ? $atts['primary_color'] : ($settings['primary_color'] ?? '#2563eb'),
            'inline' => filter_var($atts['inline'], FILTER_VALIDATE_BOOLEAN),
            'destinations' => !empty($atts['destinations']) ? explode(',', $atts['destinations']) : array(),
            'level' => !empty($atts['level']) ? $atts['level'] : '',
            'id' => !empty($atts['id']) ? sanitize_key($atts['id']) : 'shortcode-' . wp_generate_uuid4(),
        );

        // Enqueue React widget assets
        $this->enqueue_react_assets();

        // Generate unique widget ID
        $widget_id = 'heiwa-widget-' . $widget_settings['id'];

        // Determine CSS classes
        $classes = array('heiwa-react-widget-container');
        if ($widget_settings['inline']) {
            $classes[] = 'heiwa-position-inline';
        } else {
            $classes[] = 'heiwa-position-' . sanitize_key($widget_settings['position']);
        }

        ob_start();
        ?>
        <!-- Heiwa React Booking Widget (Shortcode) -->
        <div
            id="<?php echo esc_attr($widget_id); ?>"
            class="<?php echo esc_attr(implode(' ', $classes)); ?>"
            data-widget-id="<?php echo esc_attr($widget_settings['id']); ?>"
            data-build-id="react-widget-1757864064024"
            data-position="<?php echo esc_attr($widget_settings['position']); ?>"
            data-primary-color="<?php echo esc_attr($widget_settings['primary_color']); ?>"
            data-trigger-text="<?php echo esc_attr($widget_settings['trigger_text']); ?>"
            data-inline="<?php echo esc_attr($widget_settings['inline'] ? 'true' : 'false'); ?>"
        >
            <!-- React widget will auto-initialize here -->
        </div>

        <style>
            #<?php echo esc_attr($widget_id); ?> {
                --heiwa-primary-color: <?php echo esc_attr($widget_settings['primary_color']); ?>;
                --heiwa-primary-hover: <?php echo esc_attr($this->adjust_brightness($widget_settings['primary_color'], -20)); ?>;
            }
        </style>
        <?php
        
        return ob_get_clean();
    }

    /**
     * Render widget content (shared between inline and popup versions)
     * 
     * @param array $settings Widget settings
     */
    private function render_widget_content($settings) {
        ?>
        <!-- Loading State -->
        <div class="heiwa-booking-loading">
            <div class="heiwa-spinner"></div>
            <p><?php _e('Loading surf camps...', 'heiwa-booking-widget'); ?></p>
        </div>

        <!-- Error State -->
        <div class="heiwa-booking-error" style="display: none;">
            <div class="heiwa-error-icon">⚠️</div>
            <h4><?php _e('Connection Error', 'heiwa-booking-widget'); ?></h4>
            <p class="heiwa-error-message"></p>
            <button class="heiwa-button heiwa-button-secondary heiwa-retry-button">
                <?php _e('Try Again', 'heiwa-booking-widget'); ?>
            </button>
        </div>

        <!-- Step 1: Destination Selection -->
        <div class="heiwa-booking-step heiwa-step-destinations">
            <h4><?php _e('Choose Your Destination', 'heiwa-booking-widget'); ?></h4>
            
            <?php if (!empty($settings['destinations'])): ?>
            <p class="heiwa-filtered-message">
                <?php printf(__('Showing destinations: %s', 'heiwa-booking-widget'), implode(', ', $settings['destinations'])); ?>
            </p>
            <?php endif; ?>
            
            <div class="heiwa-destinations-grid">
                <!-- Destinations will be loaded via AJAX -->
            </div>
        </div>

        <!-- Step 2: Date Selection -->
        <div class="heiwa-booking-step heiwa-step-dates" style="display: none;">
            <div class="heiwa-step-header">
                <button class="heiwa-back-button" data-step="destinations">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <?php _e('Back', 'heiwa-booking-widget'); ?>
                </button>
                <h4><?php _e('Select Dates', 'heiwa-booking-widget'); ?></h4>
            </div>
            <div class="heiwa-selected-camp">
                <!-- Selected camp info -->
            </div>
            <div class="heiwa-date-picker">
                <!-- Date picker will be rendered here -->
            </div>
            <div class="heiwa-availability-info">
                <!-- Availability and pricing info -->
            </div>
        </div>

        <!-- Step 3: Booking Form -->
        <div class="heiwa-booking-step heiwa-step-booking" style="display: none;">
            <div class="heiwa-step-header">
                <button class="heiwa-back-button" data-step="dates">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <?php _e('Back', 'heiwa-booking-widget'); ?>
                </button>
                <h4><?php _e('Booking Details', 'heiwa-booking-widget'); ?></h4>
            </div>
            
            <form class="heiwa-booking-form">
                <div class="heiwa-booking-summary">
                    <!-- Booking summary -->
                </div>
                
                <div class="heiwa-form-section">
                    <h5><?php _e('Participants', 'heiwa-booking-widget'); ?></h5>
                    <div class="heiwa-participants-controls">
                        <label><?php _e('Number of participants:', 'heiwa-booking-widget'); ?></label>
                        <div class="heiwa-counter">
                            <button type="button" class="heiwa-counter-btn" data-action="decrease">-</button>
                            <input type="number" class="heiwa-participant-count" value="1" min="1" max="8">
                            <button type="button" class="heiwa-counter-btn" data-action="increase">+</button>
                        </div>
                    </div>
                    <div class="heiwa-participants-list">
                        <!-- Participant forms will be generated here -->
                    </div>
                </div>

                <div class="heiwa-form-section">
                    <h5><?php _e('Additional Information', 'heiwa-booking-widget'); ?></h5>
                    <textarea 
                        name="special_requests" 
                        class="heiwa-special-requests"
                        placeholder="<?php _e('Any special requests or dietary requirements?', 'heiwa-booking-widget'); ?>"
                        rows="3"
                    ></textarea>
                </div>

                <div class="heiwa-form-actions">
                    <div class="heiwa-total-price">
                        <!-- Total price will be calculated here -->
                    </div>
                    <button type="submit" class="heiwa-button heiwa-button-primary" style="background-color: <?php echo esc_attr($settings['primary_color']); ?>;">
                        <?php _e('Complete Booking', 'heiwa-booking-widget'); ?>
                    </button>
                </div>
            </form>
        </div>

        <!-- Step 4: Confirmation -->
        <div class="heiwa-booking-step heiwa-step-confirmation" style="display: none;">
            <div class="heiwa-confirmation-content">
                <!-- Booking confirmation will be shown here -->
            </div>
        </div>
        <?php
    }

    /**
     * Add shortcode button to editor
     */
    public function add_shortcode_button() {
        if (!current_user_can('edit_posts') && !current_user_can('edit_pages')) {
            return;
        }

        echo '<button type="button" class="button" onclick="heiwaInsertShortcode();">';
        echo '<span class="dashicons dashicons-calendar-alt" style="vertical-align: middle;"></span> ';
        echo __('Heiwa Booking', 'heiwa-booking-widget');
        echo '</button>';

        ?>
        <script>
        function heiwaInsertShortcode() {
            var shortcode = '[heiwa_booking]';
            
            // For classic editor
            if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor && !tinyMCE.activeEditor.isHidden()) {
                tinyMCE.activeEditor.execCommand('mceInsertContent', false, shortcode);
            }
            // For text editor
            else if (typeof QTags !== 'undefined') {
                QTags.insertContent(shortcode);
            }
            // For Gutenberg (basic support)
            else {
                navigator.clipboard.writeText(shortcode).then(function() {
                    alert('<?php echo esc_js(__('Shortcode copied to clipboard: [heiwa_booking]', 'heiwa-booking-widget')); ?>');
                });
            }
        }
        </script>
        <?php
    }

    /**
     * Maybe enqueue assets when shortcode is used
     */
    public function maybe_enqueue_assets() {
        global $post, $heiwa_booking_shortcode_used;
        
        // Check if shortcode is used in post content
        $has_shortcode = false;
        
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'heiwa_booking')) {
            $has_shortcode = true;
        }
        
        // Also check if shortcode was used programmatically
        if (!empty($heiwa_booking_shortcode_used)) {
            $has_shortcode = true;
        }

        if ($has_shortcode) {
            // Enqueue the same assets as the main widget
            $this->enqueue_assets();
        }
    }

    /**
     * Enqueue widget assets
     */
    private function enqueue_assets() {
        // Enqueue modular CSS architecture (matching main plugin file)
        wp_enqueue_style(
            'heiwa-booking-base',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/base.css',
            array(),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-components',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/components.css',
            array('heiwa-booking-base'),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-layout',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/layout.css',
            array('heiwa-booking-base', 'heiwa-booking-components'),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-utilities',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/utilities.css',
            array('heiwa-booking-base', 'heiwa-booking-components', 'heiwa-booking-layout'),
            HEIWA_BOOKING_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'heiwa-booking-widget',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/js/widget.js',
            array('jquery'),
            HEIWA_BOOKING_VERSION,
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('heiwa-booking-widget', 'heiwa_booking_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_booking_nonce'),
            'api_endpoint' => get_option('heiwa_booking_settings')['api_endpoint'] ?? '',
            'api_key' => get_option('heiwa_booking_settings')['api_key'] ?? ''
        ));
    }

    /**
     * Adjust color brightness
     * 
     * @param string $hex Hex color code
     * @param int $percent Percentage to adjust (-100 to 100)
     * @return string Adjusted hex color
     */
    private function adjust_brightness($hex, $percent) {
        // Remove # if present
        $hex = ltrim($hex, '#');
        
        // Convert to RGB
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        // Adjust brightness
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
        // Convert back to hex
        return '#' . sprintf('%02x%02x%02x', $r, $g, $b);
    }
}
