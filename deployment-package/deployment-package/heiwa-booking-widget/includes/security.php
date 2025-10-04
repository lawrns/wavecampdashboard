<?php
/**
 * Security utilities for Heiwa Booking Widget
 *
 * Provides comprehensive security measures including nonce validation,
 * CSRF protection, input sanitization, capability checks, and security headers.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Security class for the Heiwa Booking Widget
 */
class Heiwa_Booking_Security {

    /**
     * Nonce action names
     */
    const NONCE_BOOKING = 'heiwa_booking_action';
    const NONCE_ADMIN = 'heiwa_booking_admin';
    const NONCE_REST = 'wp_rest';
    const NONCE_AJAX = 'heiwa_booking_ajax';

    /**
     * Rate limiting keys
     */
    const RATE_LIMIT_BOOKING = 'heiwa_booking_requests';
    const RATE_LIMIT_API = 'heiwa_api_requests';

    /**
     * Initialize security measures
     */
    public static function init() {
        // Add security headers
        add_action('wp_headers', array(__CLASS__, 'add_security_headers'));
        add_action('send_headers', array(__CLASS__, 'add_security_headers'));

        // Validate requests
        add_action('admin_init', array(__CLASS__, 'validate_admin_requests'));
        add_action('wp_loaded', array(__CLASS__, 'validate_frontend_requests'));

        // Sanitize inputs
        add_filter('pre_comment_content', array(__CLASS__, 'sanitize_input'));
        add_filter('wp_insert_post_data', array(__CLASS__, 'sanitize_post_data'));

        // Rate limiting
        add_action('wp_loaded', array(__CLASS__, 'check_rate_limits'));
    }

    /**
     * Validate nonce for actions
     *
     * @param string $action The nonce action
     * @param string $nonce The nonce value
     * @return bool Whether the nonce is valid
     */
    public static function validate_nonce($action, $nonce) {
        if (empty($nonce)) {
            self::log_security_event('missing_nonce', array('action' => $action));
            return false;
        }

        $is_valid = wp_verify_nonce($nonce, $action);

        if (!$is_valid) {
            self::log_security_event('invalid_nonce', array(
                'action' => $action,
                'nonce' => substr($nonce, 0, 10) . '...' // Log partial nonce for debugging
            ));
        }

        return $is_valid;
    }

    /**
     * Create nonce for specific action
     *
     * @param string $action The nonce action
     * @return string The nonce
     */
    public static function create_nonce($action) {
        return wp_create_nonce($action);
    }

    /**
     * Validate admin request nonces
     */
    public static function validate_admin_requests() {
        if (!is_admin()) {
            return;
        }

        // Validate settings page requests
        if (isset($_POST['option_page']) && $_POST['option_page'] === 'heiwa_booking_settings') {
            if (!self::validate_nonce(self::NONCE_ADMIN, $_POST['_wpnonce'] ?? '')) {
                wp_die(__('Security check failed. Please try again.', 'heiwa-booking-widget'), __('Security Error', 'heiwa-booking-widget'), array('response' => 403));
            }
        }
    }

    /**
     * Validate frontend request nonces
     */
    public static function validate_frontend_requests() {
        // Validate AJAX requests
        if (wp_doing_ajax() && isset($_REQUEST['action'])) {
            $action = sanitize_text_field($_REQUEST['action']);

            if (strpos($action, 'heiwa_') === 0) {
                $nonce = $_REQUEST['nonce'] ?? $_REQUEST['_wpnonce'] ?? '';
                if (!self::validate_nonce(self::NONCE_AJAX, $nonce)) {
                    wp_send_json_error(array(
                        'message' => __('Security check failed. Please refresh the page and try again.', 'heiwa-booking-widget')
                    ));
                }
            }
        }

        // Validate form submissions
        if ($_SERVER['REQUEST_METHOD'] === 'POST' && !wp_doing_ajax()) {
            $nonce = $_POST['_wpnonce'] ?? $_POST['heiwa_nonce'] ?? '';
            if (!empty($nonce) && !self::validate_nonce(self::NONCE_BOOKING, $nonce)) {
                wp_die(__('Security check failed. Please try again.', 'heiwa-booking-widget'), __('Security Error', 'heiwa-booking-widget'), array('response' => 403));
            }
        }
    }

    /**
     * Check user capabilities for operations
     *
     * @param string $capability The capability to check
     * @param int|null $user_id User ID (defaults to current user)
     * @return bool Whether the user has the capability
     */
    public static function check_capability($capability, $user_id = null) {
        if ($user_id === null) {
            $user_id = get_current_user_id();
        }

        $has_cap = user_can($user_id, $capability);

        if (!$has_cap) {
            self::log_security_event('insufficient_capability', array(
                'capability' => $capability,
                'user_id' => $user_id
            ));
        }

        return $has_cap;
    }

    /**
     * Validate and sanitize input data
     *
     * @param mixed $input The input to sanitize
     * @param string $type The expected data type
     * @return mixed Sanitized input
     */
    public static function sanitize_input($input, $type = 'text') {
        if ($input === null || $input === '') {
            return $input;
        }

        switch ($type) {
            case 'email':
                return sanitize_email($input);

            case 'url':
                return esc_url_raw($input);

            case 'int':
                return intval($input);

            case 'float':
                return floatval($input);

            case 'boolean':
                return filter_var($input, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            case 'array':
                return is_array($input) ? array_map('sanitize_text_field', $input) : array();

            case 'json':
                if (is_string($input)) {
                    $decoded = json_decode($input, true);
                    return $decoded !== null ? $decoded : array();
                }
                return is_array($input) ? $input : array();

            case 'text':
            default:
                return sanitize_text_field($input);
        }
    }

    /**
     * Validate booking form data
     *
     * @param array $data The form data
     * @return array|WP_Error Validated data or error
     */
    public static function validate_booking_data($data) {
        $errors = array();

        // Required fields
        $required_fields = array('customer_email', 'customer_first_name', 'customer_last_name');
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                $errors[] = sprintf(__('Field %s is required', 'heiwa-booking-widget'), $field);
            }
        }

        // Email validation
        if (!empty($data['customer_email']) && !is_email($data['customer_email'])) {
            $errors[] = __('Please enter a valid email address', 'heiwa-booking-widget');
        }

        // Phone validation (optional)
        if (!empty($data['customer_phone'])) {
            $phone = preg_replace('/[^\d+\-\s()]/', '', $data['customer_phone']);
            if (strlen($phone) < 7) {
                $errors[] = __('Please enter a valid phone number', 'heiwa-booking-widget');
            }
            $data['customer_phone'] = $phone;
        }

        // Date validation
        if (!empty($data['check_in_date'])) {
            $check_in = strtotime($data['check_in_date']);
            if (!$check_in || $check_in < strtotime('today')) {
                $errors[] = __('Check-in date must be today or later', 'heiwa-booking-widget');
            }
        }

        if (!empty($data['check_out_date']) && !empty($data['check_in_date'])) {
            $check_in = strtotime($data['check_in_date']);
            $check_out = strtotime($data['check_out_date']);
            if ($check_out <= $check_in) {
                $errors[] = __('Check-out date must be after check-in date', 'heiwa-booking-widget');
            }
        }

        // Guest count validation
        if (isset($data['guest_count'])) {
            $guest_count = intval($data['guest_count']);
            if ($guest_count < 1 || $guest_count > 20) {
                $errors[] = __('Guest count must be between 1 and 20', 'heiwa-booking-widget');
            }
            $data['guest_count'] = $guest_count;
        }

        if (!empty($errors)) {
            return new WP_Error('validation_failed', __('Validation failed', 'heiwa-booking-widget'), array('errors' => $errors));
        }

        // Sanitize all fields
        $sanitized = array();
        foreach ($data as $key => $value) {
            $field_type = self::get_field_type($key);
            $sanitized[$key] = self::sanitize_input($value, $field_type);
        }

        return $sanitized;
    }

    /**
     * Get field type for sanitization
     *
     * @param string $field_name The field name
     * @return string The field type
     */
    private static function get_field_type($field_name) {
        $field_types = array(
            'customer_email' => 'email',
            'guest_count' => 'int',
            'total_amount' => 'float',
            'check_in_date' => 'text',
            'check_out_date' => 'text',
            'special_requests' => 'text',
            'addons' => 'json',
            'beds' => 'array',
        );

        return $field_types[$field_name] ?? 'text';
    }

    /**
     * Sanitize post data before saving
     *
     * @param array $data The post data
     * @return array Sanitized data
     */
    public static function sanitize_post_data($data) {
        // Only sanitize our custom post types
        if (isset($data['post_type']) && $data['post_type'] === 'heiwa_booking') {
            $data['post_title'] = sanitize_text_field($data['post_title']);
            $data['post_content'] = wp_kses_post($data['post_content']);
        }

        return $data;
    }

    /**
     * Add security headers
     */
    public static function add_security_headers() {
        if (!is_admin() && !wp_doing_ajax()) {
            // Content Security Policy for widget pages
            header("X-Content-Type-Options: nosniff");
            header("X-Frame-Options: SAMEORIGIN");
            header("X-XSS-Protection: 1; mode=block");

            // Referrer Policy
            header("Referrer-Policy: strict-origin-when-cross-origin");

            // Permissions Policy (formerly Feature Policy)
            header("Permissions-Policy: geolocation=(), microphone=(), camera=()");
        }
    }

    /**
     * Check rate limits for requests
     */
    public static function check_rate_limits() {
        $ip = self::get_client_ip();
        $current_time = time();

        // Skip rate limiting for admin users
        if (current_user_can('manage_options')) {
            return;
        }

        // Rate limit booking requests
        if (isset($_REQUEST['action']) && strpos($_REQUEST['action'], 'heiwa_booking') === 0) {
            $requests = get_transient(self::RATE_LIMIT_BOOKING . '_' . $ip);
            if ($requests === false) {
                $requests = array();
            }

            // Remove requests older than 1 minute
            $requests = array_filter($requests, function($timestamp) use ($current_time) {
                return ($current_time - $timestamp) < 60;
            });

            // Check rate limit (max 10 requests per minute)
            if (count($requests) >= 10) {
                self::log_security_event('rate_limit_exceeded', array(
                    'ip' => $ip,
                    'requests' => count($requests)
                ));

                wp_die(__('Too many requests. Please try again later.', 'heiwa-booking-widget'), __('Rate Limit Exceeded', 'heiwa-booking-widget'), array('response' => 429));
            }

            $requests[] = $current_time;
            set_transient(self::RATE_LIMIT_BOOKING . '_' . $ip, $requests, 60);
        }
    }

    /**
     * Get client IP address
     *
     * @return string The client IP address
     */
    public static function get_client_ip() {
        $ip_headers = array(
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        );

        foreach ($ip_headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];

                // Handle comma-separated IPs (from X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }

                // Validate IP
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return '127.0.0.1'; // Fallback
    }

    /**
     * Log security events
     *
     * @param string $event The event type
     * @param array $context Additional context
     */
    public static function log_security_event($event, $context = array()) {
        $log_data = array(
            'event' => $event,
            'ip' => self::get_client_ip(),
            'user_id' => get_current_user_id(),
            'timestamp' => current_time('mysql'),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
        );

        $log_data = array_merge($log_data, $context);

        // Use WordPress logging if available, otherwise use plugin's log method
        if (function_exists('wp_log')) {
            wp_log($log_data, 'security', 'heiwa-booking-widget');
        } else {
            Heiwa_Booking_Widget::log('security', $event, $log_data);
        }

        // Log critical security events to error log
        if (in_array($event, array('invalid_nonce', 'rate_limit_exceeded', 'insufficient_capability'))) {
            error_log(sprintf(
                'Heiwa Booking Security Event: %s - IP: %s - User: %s - Context: %s',
                $event,
                $log_data['ip'],
                $log_data['user_id'],
                json_encode($context)
            ));
        }
    }

    /**
     * Validate REST API requests
     *
     * @param WP_REST_Request $request The REST request
     * @return bool|WP_Error Whether the request is valid
     */
    public static function validate_rest_request($request) {
        // Check if user is authenticated for protected endpoints
        if (!$request->get_header('authorization') && !is_user_logged_in()) {
            return new WP_Error(
                'rest_forbidden',
                __('Authentication required', 'heiwa-booking-widget'),
                array('status' => 401)
            );
        }

        // Validate nonces for state-changing operations
        if (in_array($request->get_method(), array('POST', 'PUT', 'DELETE'))) {
            $nonce = $request->get_header('x_wp_nonce') ?: $request->get_param('_wpnonce');

            if (!$nonce || !self::validate_nonce(self::NONCE_REST, $nonce)) {
                return new WP_Error(
                    'rest_forbidden',
                    __('Invalid nonce', 'heiwa-booking-widget'),
                    array('status' => 403)
                );
            }
        }

        return true;
    }
}

// Initialize security measures
Heiwa_Booking_Security::init();
