<?php
/**
 * Widget Display Class
 * Handles the frontend widget display and functionality
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_Widget_Display {

    /**
     * API connector instance
     */
    private $api;

    /**
     * Widget settings
     */
    private $settings;

    /**
     * Constructor
     */
    public function __construct() {
        $this->api = new Heiwa_Booking_API_Connector();
        $this->settings = get_option('heiwa_booking_settings', array());
        
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Add widget to footer
        add_action('wp_footer', array($this, 'render_widget'));
        
        // AJAX handlers for widget functionality
        add_action('wp_ajax_heiwa_get_camps', array($this, 'ajax_get_camps'));
        add_action('wp_ajax_nopriv_heiwa_get_camps', array($this, 'ajax_get_camps'));
        
        add_action('wp_ajax_heiwa_check_availability', array($this, 'ajax_check_availability'));
        add_action('wp_ajax_nopriv_heiwa_check_availability', array($this, 'ajax_check_availability'));
        
        add_action('wp_ajax_heiwa_create_booking', array($this, 'ajax_create_booking'));
        add_action('wp_ajax_nopriv_heiwa_create_booking', array($this, 'ajax_create_booking'));
    }

    /**
     * Render the booking widget
     */
    public function render_widget() {
        // Don't show widget if not properly configured
        if (!$this->api->is_configured()) {
            return;
        }

        // Don't show on admin pages
        if (is_admin()) {
            return;
        }

        // Check if widget should be shown on current page
        if (!$this->should_show_widget()) {
            return;
        }

        $position = $this->settings['widget_position'] ?? 'right';
        $trigger_text = $this->settings['trigger_text'] ?? 'BOOK NOW';
        $primary_color = $this->settings['primary_color'] ?? '#ec681c';

        ?>
        <!-- Heiwa Booking Widget -->
        <div id="heiwa-booking-widget" class="heiwa-booking-widget heiwa-position-<?php echo esc_attr($position); ?>" data-position="<?php echo esc_attr($position); ?>">
            <!-- Trigger Button -->
            <button id="heiwa-booking-trigger" class="heiwa-booking-trigger" style="background-color: <?php echo esc_attr($primary_color); ?>;">
                <svg class="heiwa-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" stroke-width="2"/>
                    <path d="M16 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M8 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 10H21" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 14H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span><?php echo esc_html($trigger_text); ?></span>
            </button>

            <!-- Widget Panel -->
            <div id="heiwa-booking-panel" class="heiwa-booking-panel">
                <!-- Panel Header -->
                <div class="heiwa-booking-header">
                    <h3><?php _e('Book Your Surf Adventure', 'heiwa-booking-widget'); ?></h3>
                    <button id="heiwa-booking-close" class="heiwa-booking-close">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>

                <!-- Panel Content -->
                <div class="heiwa-booking-content">
                    <!-- Loading State -->
                    <div id="heiwa-booking-loading" class="heiwa-booking-loading">
                        <div class="heiwa-spinner"></div>
                        <p><?php _e('Loading surf camps...', 'heiwa-booking-widget'); ?></p>
                    </div>

                    <!-- Error State -->
                    <div id="heiwa-booking-error" class="heiwa-booking-error" style="display: none;">
                        <div class="heiwa-error-icon">⚠️</div>
                        <h4><?php _e('Connection Error', 'heiwa-booking-widget'); ?></h4>
                        <p id="heiwa-error-message"></p>
                        <button id="heiwa-retry-button" class="heiwa-button heiwa-button-secondary">
                            <?php _e('Try Again', 'heiwa-booking-widget'); ?>
                        </button>
                    </div>

                    <!-- Step 1: Destination Selection -->
                    <div id="heiwa-step-destinations" class="heiwa-booking-step">
                        <h4><?php _e('Choose Your Destination', 'heiwa-booking-widget'); ?></h4>
                        <div id="heiwa-destinations-grid" class="heiwa-destinations-grid">
                            <!-- Destinations will be loaded via AJAX -->
                        </div>
                    </div>

                    <!-- Step 2: Date Selection -->
                    <div id="heiwa-step-dates" class="heiwa-booking-step" style="display: none;">
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
                        <div id="heiwa-selected-camp" class="heiwa-selected-camp">
                            <!-- Selected camp info -->
                        </div>
                        <div id="heiwa-date-picker" class="heiwa-date-picker">
                            <!-- Date picker will be rendered here -->
                        </div>
                        <div id="heiwa-availability-info" class="heiwa-availability-info">
                            <!-- Availability and pricing info -->
                        </div>
                    </div>

                    <!-- Step 3: Booking Form -->
                    <div id="heiwa-step-booking" class="heiwa-booking-step" style="display: none;">
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
                        
                        <form id="heiwa-booking-form" class="heiwa-booking-form">
                            <div id="heiwa-booking-summary" class="heiwa-booking-summary">
                                <!-- Booking summary -->
                            </div>
                            
                            <div class="heiwa-form-section">
                                <h5><?php _e('Participants', 'heiwa-booking-widget'); ?></h5>
                                <div class="heiwa-participants-controls">
                                    <label for="heiwa-participant-count"><?php _e('Number of participants:', 'heiwa-booking-widget'); ?></label>
                                    <div class="heiwa-counter">
                                        <button type="button" class="heiwa-counter-btn" data-action="decrease">-</button>
                                        <input type="number" id="heiwa-participant-count" name="participant_count" value="1" min="1" max="8">
                                        <button type="button" class="heiwa-counter-btn" data-action="increase">+</button>
                                    </div>
                                </div>
                                <div id="heiwa-participants-list" class="heiwa-participants-list">
                                    <!-- Participant forms will be generated here -->
                                </div>
                            </div>

                            <div class="heiwa-form-section">
                                <h5><?php _e('Additional Information', 'heiwa-booking-widget'); ?></h5>
                                <textarea 
                                    name="special_requests" 
                                    id="heiwa-special-requests"
                                    placeholder="<?php _e('Any special requests or dietary requirements?', 'heiwa-booking-widget'); ?>"
                                    rows="3"
                                ></textarea>
                            </div>

                            <div class="heiwa-form-actions">
                                <div id="heiwa-total-price" class="heiwa-total-price">
                                    <!-- Total price will be calculated here -->
                                </div>
                                <button type="submit" class="heiwa-button heiwa-button-primary" style="background-color: <?php echo esc_attr($primary_color); ?>;">
                                    <?php _e('Complete Booking', 'heiwa-booking-widget'); ?>
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Step 4: Confirmation -->
                    <div id="heiwa-step-confirmation" class="heiwa-booking-step" style="display: none;">
                        <div class="heiwa-confirmation-content">
                            <!-- Booking confirmation will be shown here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Overlay -->
            <div id="heiwa-booking-overlay" class="heiwa-booking-overlay"></div>
        </div>

        <style>
            :root {
                --heiwa-primary-color: <?php echo esc_attr($primary_color); ?>;
                --heiwa-primary-hover: <?php echo esc_attr($this->adjust_brightness($primary_color, -20)); ?>;
            }
        </style>
        <?php
    }

    /**
     * Check if widget should be shown on current page
     */
    private function should_show_widget() {
        // If auto-inject is disabled, only show via shortcode
        if (empty($this->settings['auto_inject'])) {
            return false;
        }

        // Check enabled pages
        $enabled_pages = $this->settings['enabled_pages'] ?? array();
        
        if (empty($enabled_pages)) {
            return true; // Show on all pages if none specified
        }

        // Check current page type
        if (is_home() && in_array('home', $enabled_pages)) {
            return true;
        }
        
        if (is_front_page() && in_array('front_page', $enabled_pages)) {
            return true;
        }
        
        if (is_page() && in_array('pages', $enabled_pages)) {
            return true;
        }
        
        if (is_single() && in_array('posts', $enabled_pages)) {
            return true;
        }

        return false;
    }

    /**
     * AJAX handler to get surf camps
     */
    public function ajax_get_camps() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_nonce')) {
            wp_die('Security check failed');
        }

        $filters = array();
        
        if (!empty($_POST['location'])) {
            $filters['location'] = sanitize_text_field($_POST['location']);
        }
        
        if (!empty($_POST['level'])) {
            $filters['level'] = sanitize_text_field($_POST['level']);
        }

        $response = $this->api->get_surf_camps($filters);
        
        wp_send_json($response);
    }

    /**
     * AJAX handler to check availability
     */
    public function ajax_check_availability() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_nonce')) {
            wp_die('Security check failed');
        }

        $camp_id = sanitize_text_field($_POST['camp_id'] ?? '');
        $start_date = sanitize_text_field($_POST['start_date'] ?? '');
        $end_date = sanitize_text_field($_POST['end_date'] ?? '');
        $participants = intval($_POST['participants'] ?? 1);

        if (empty($camp_id) || empty($start_date) || empty($end_date)) {
            wp_send_json(array(
                'success' => false,
                'error' => 'missing_parameters',
                'message' => 'Required parameters missing'
            ));
        }

        $response = $this->api->check_availability($camp_id, $start_date, $end_date, $participants);
        
        wp_send_json($response);
    }

    /**
     * AJAX handler to create booking
     */
    public function ajax_create_booking() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_nonce')) {
            wp_die('Security check failed');
        }

        // Sanitize and validate booking data
        $booking_data = array(
            'camp_id' => sanitize_text_field($_POST['camp_id'] ?? ''),
            'participants' => array(),
            'special_requests' => sanitize_textarea_field($_POST['special_requests'] ?? '')
        );

        // Validate participants data
        if (!empty($_POST['participants']) && is_array($_POST['participants'])) {
            foreach ($_POST['participants'] as $participant) {
                $booking_data['participants'][] = array(
                    'name' => sanitize_text_field($participant['name'] ?? ''),
                    'email' => sanitize_email($participant['email'] ?? ''),
                    'phone' => sanitize_text_field($participant['phone'] ?? ''),
                    'surf_level' => sanitize_text_field($participant['surf_level'] ?? '')
                );
            }
        }

        // Validate required fields
        if (empty($booking_data['camp_id']) || empty($booking_data['participants'])) {
            wp_send_json(array(
                'success' => false,
                'error' => 'missing_data',
                'message' => 'Required booking information missing'
            ));
        }

        $response = $this->api->create_booking($booking_data);
        
        wp_send_json($response);
    }

    /**
     * Display widget programmatically (for theme integration)
     * 
     * @param array $args Widget arguments
     */
    public function display($args = array()) {
        // Merge with default settings
        $args = wp_parse_args($args, array(
            'position' => $this->settings['widget_position'] ?? 'right',
            'trigger_text' => $this->settings['trigger_text'] ?? 'BOOK NOW',
            'primary_color' => $this->settings['primary_color'] ?? '#2563eb'
        ));

        // Temporarily override settings
        $original_settings = $this->settings;
        $this->settings = array_merge($this->settings, $args);
        
        // Render widget
        $this->render_widget();
        
        // Restore original settings
        $this->settings = $original_settings;
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
