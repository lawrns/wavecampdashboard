<?php
/**
 * API Connector Class
 * Handles communication with the Heiwa House backend API
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_API_Connector {

    /**
     * API settings
     */
    private $api_endpoint;
    private $api_key;
    private $timeout;

    /**
     * Constructor
     */
    public function __construct() {
        $settings = get_option('heiwa_booking_settings', array());
        $this->api_endpoint = rtrim($settings['api_endpoint'] ?? '', '/');
        $this->api_key = $settings['api_key'] ?? '';
        $this->timeout = 30; // 30 seconds timeout

        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('heiwa/v1', '/rooms/availability', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_rooms_availability'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'start_date' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return strtotime($param) !== false;
                    }
                ),
                'end_date' => array(
                    'required' => true,
                    'validate_callback' => function($param) {
                        return strtotime($param) !== false;
                    }
                ),
                'participants' => array(
                    'required' => false,
                    'default' => 1,
                    'validate_callback' => function($param) {
                        return is_numeric($param) && $param > 0;
                    }
                )
            )
        ));

        register_rest_route('heiwa/v1', '/surf-camps', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_surf_camps_rest'),
            'permission_callback' => array($this, 'check_permissions')
        ));

        register_rest_route('heiwa/v1', '/bookings', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_booking_rest'),
            'permission_callback' => array($this, 'check_permissions'),
            'args' => array(
                'booking_data' => array(
                    'required' => true,
                    'validate_callback' => array($this, 'validate_booking_data')
                )
            )
        ));
    }

    /**
     * Check API permissions for REST requests
     */
    public function check_permissions(WP_REST_Request $request) {
        // Use WordPress nonce for authentication
        $nonce = $request->get_header('X-WP-Nonce');
        if (!$nonce || !wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('rest_forbidden', 'Invalid nonce', array('status' => 403));
        }

        return true;
    }

    /**
     * Get rooms availability (REST API)
     */
    public function get_rooms_availability(WP_REST_Request $request) {
        $start_date = sanitize_text_field($request->get_param('start_date'));
        $end_date = sanitize_text_field($request->get_param('end_date'));
        $participants = intval($request->get_param('participants'));

        try {
            $response = $this->make_request('GET', '/wordpress/rooms/availability?' . http_build_query(array(
                'start_date' => $start_date,
                'end_date' => $end_date,
                'participants' => $participants
            )));

            if (isset($response['success']) && $response['success'] === false) {
                return new WP_Error('api_error', $response['message'] ?? 'API request failed', array('status' => 500));
            }

            return new WP_REST_Response($response, 200);

        } catch (Exception $e) {
            Heiwa_Booking_Widget::log('error', 'Rooms availability REST API error: ' . $e->getMessage());
            return new WP_Error('api_error', 'Failed to fetch room availability', array('status' => 500));
        }
    }

    /**
     * Get surf camps (REST API)
     */
    public function get_surf_camps_rest(WP_REST_Request $request) {
        try {
            $response = $this->get_surf_camps();

            if (isset($response['success']) && $response['success'] === false) {
                return new WP_Error('api_error', $response['message'] ?? 'API request failed', array('status' => 500));
            }

            return new WP_REST_Response($response, 200);

        } catch (Exception $e) {
            Heiwa_Booking_Widget::log('error', 'Surf camps REST API error: ' . $e->getMessage());
            return new WP_Error('api_error', 'Failed to fetch surf camps', array('status' => 500));
        }
    }

    /**
     * Create booking (REST API)
     */
    public function create_booking_rest(WP_REST_Request $request) {
        $booking_data = $request->get_param('booking_data');

        if (!$this->validate_booking_data($booking_data)) {
            return new WP_Error('validation_error', 'Invalid booking data', array('status' => 400));
        }

        try {
            $response = $this->create_booking($booking_data);

            if (isset($response['success']) && $response['success'] === false) {
                return new WP_Error('api_error', $response['message'] ?? 'API request failed', array('status' => 500));
            }

            return new WP_REST_Response($response, 201);

        } catch (Exception $e) {
            Heiwa_Booking_Widget::log('error', 'Booking creation REST API error: ' . $e->getMessage());
            return new WP_Error('api_error', 'Failed to create booking', array('status' => 500));
        }
    }

    /**
     * Validate booking data
     */
    public function validate_booking_data($booking_data) {
        if (!is_array($booking_data)) {
            return false;
        }

        // Basic validation - add more as needed
        $required_fields = array('participants', 'dates', 'participantDetails');
        foreach ($required_fields as $field) {
            if (!isset($booking_data[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Test API connection
     *
     * @return array Response data
     */
    public function test_connection() {
        return $this->make_request('GET', '/wordpress/test');
    }

    /**
     * Get available surf camps
     * 
     * @param array $filters Optional filters (location, level)
     * @return array Response data
     */
    public function get_surf_camps($filters = array()) {
        $query_params = http_build_query($filters);
        $endpoint = '/wordpress/surf-camps' . ($query_params ? '?' . $query_params : '');
        
        return $this->make_request('GET', $endpoint);
    }

    /**
     * Check availability for a camp
     * 
     * @param string $camp_id Camp ID
     * @param string $start_date Start date (Y-m-d format)
     * @param string $end_date End date (Y-m-d format)
     * @param int $participants Number of participants
     * @return array Response data
     */
    public function check_availability($camp_id, $start_date, $end_date, $participants = 1) {
        $params = array(
            'camp_id' => $camp_id,
            'start_date' => $start_date,
            'end_date' => $end_date,
            'participants' => $participants
        );
        
        $query_params = http_build_query($params);
        $endpoint = '/wordpress/availability?' . $query_params;
        
        return $this->make_request('GET', $endpoint);
    }

    /**
     * Create a booking
     * 
     * @param array $booking_data Booking data
     * @return array Response data
     */
    public function create_booking($booking_data) {
        // Add WordPress-specific metadata
        $booking_data['source_url'] = home_url($_SERVER['REQUEST_URI'] ?? '');
        $booking_data['widget_version'] = HEIWA_BOOKING_VERSION;
        
        // Add UTM parameters if present
        if (!empty($_GET['utm_source'])) {
            $booking_data['utm_source'] = sanitize_text_field($_GET['utm_source']);
        }
        if (!empty($_GET['utm_campaign'])) {
            $booking_data['utm_campaign'] = sanitize_text_field($_GET['utm_campaign']);
        }
        
        return $this->make_request('POST', '/wordpress/bookings', $booking_data);
    }

    /**
     * Get booking by ID
     * 
     * @param string $booking_id Booking ID
     * @return array Response data
     */
    public function get_booking($booking_id) {
        $endpoint = '/wordpress/bookings?booking_id=' . urlencode($booking_id);
        return $this->make_request('GET', $endpoint);
    }

    /**
     * Make HTTP request to API
     * 
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $endpoint API endpoint
     * @param array $data Request data (for POST/PUT)
     * @return array Response data
     */
    private function make_request($method, $endpoint, $data = null) {
        // Validate configuration
        if (empty($this->api_endpoint) || empty($this->api_key)) {
            return array(
                'success' => false,
                'error' => 'API not configured',
                'message' => 'Please configure API endpoint and key in plugin settings'
            );
        }

        $url = $this->api_endpoint . $endpoint;
        
        // Prepare request arguments
        $args = array(
            'method' => $method,
            'timeout' => $this->timeout,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-Heiwa-API-Key' => $this->api_key,
                'User-Agent' => 'HeiwaBookingWidget/' . HEIWA_BOOKING_VERSION . ' WordPress/' . get_bloginfo('version')
            )
        );

        // Add request body for POST/PUT requests
        if ($data && in_array($method, array('POST', 'PUT'))) {
            $args['body'] = json_encode($data);
        }

        // Log request for debugging
        $this->log_request($method, $url, $data);

        // Make the request
        $response = wp_remote_request($url, $args);

        // Handle WordPress errors
        if (is_wp_error($response)) {
            $error_message = $response->get_error_message();
            $this->log_error('HTTP request failed: ' . $error_message);
            
            return array(
                'success' => false,
                'error' => 'connection_error',
                'message' => 'Failed to connect to Heiwa House API: ' . $error_message
            );
        }

        // Get response details
        $status_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);
        
        // Log response for debugging
        $this->log_response($status_code, $response_body);

        // Parse JSON response
        $decoded_response = json_decode($response_body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->log_error('Invalid JSON response: ' . json_last_error_msg());
            
            return array(
                'success' => false,
                'error' => 'invalid_response',
                'message' => 'Invalid response from API server'
            );
        }

        // Handle HTTP error status codes
        if ($status_code >= 400) {
            $error_message = $decoded_response['message'] ?? 'Unknown API error';
            $this->log_error("API error {$status_code}: {$error_message}");
            
            return array(
                'success' => false,
                'error' => $decoded_response['error'] ?? 'api_error',
                'message' => $error_message,
                'status_code' => $status_code
            );
        }

        // Return successful response
        return $decoded_response;
    }

    /**
     * Log API request for debugging
     * 
     * @param string $method HTTP method
     * @param string $url Request URL
     * @param array $data Request data
     */
    private function log_request($method, $url, $data = null) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $log_data = array(
            'method' => $method,
            'url' => $url,
            'data' => $data
        );

        Heiwa_Booking_Widget::log('debug', "API Request: {$method} {$url}", $log_data);
    }

    /**
     * Log API response for debugging
     * 
     * @param int $status_code HTTP status code
     * @param string $response_body Response body
     */
    private function log_response($status_code, $response_body) {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }

        $log_data = array(
            'status_code' => $status_code,
            'response' => $response_body
        );

        Heiwa_Booking_Widget::log('debug', "API Response: {$status_code}", $log_data);
    }

    /**
     * Log API errors
     * 
     * @param string $message Error message
     */
    private function log_error($message) {
        Heiwa_Booking_Widget::log('error', $message);
        
        // Also log to PHP error log if WP_DEBUG_LOG is enabled
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('[Heiwa Booking Widget] ' . $message);
        }
    }

    /**
     * Get cached response
     * 
     * @param string $cache_key Cache key
     * @return mixed Cached data or false
     */
    private function get_cached_response($cache_key) {
        return get_transient('heiwa_booking_' . md5($cache_key));
    }

    /**
     * Set cached response
     * 
     * @param string $cache_key Cache key
     * @param mixed $data Data to cache
     * @param int $expiration Cache expiration in seconds
     */
    private function set_cached_response($cache_key, $data, $expiration = 300) {
        set_transient('heiwa_booking_' . md5($cache_key), $data, $expiration);
    }

    /**
     * Validate API configuration
     * 
     * @return bool True if valid, false otherwise
     */
    public function is_configured() {
        return !empty($this->api_endpoint) && !empty($this->api_key);
    }

    /**
     * Get API endpoint URL
     * 
     * @return string API endpoint URL
     */
    public function get_api_endpoint() {
        return $this->api_endpoint;
    }

    /**
     * Get sanitized API key (for display purposes)
     * 
     * @return string Masked API key
     */
    public function get_masked_api_key() {
        if (empty($this->api_key)) {
            return '';
        }
        
        $length = strlen($this->api_key);
        if ($length <= 8) {
            return str_repeat('•', $length);
        }
        
        return substr($this->api_key, 0, 4) . str_repeat('•', $length - 8) . substr($this->api_key, -4);
    }
}
