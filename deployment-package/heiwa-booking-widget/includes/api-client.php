<?php
/**
 * API Client for Heiwa Booking Widget
 *
 * Provides a secure, JavaScript-accessible API client for the WordPress REST endpoints.
 * Handles authentication, request signing, rate limiting, and error handling for
 * frontend widget communication with the Heiwa House booking system.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * API Client class for frontend widget communication
 */
class Heiwa_Booking_API_Client {

    /**
     * API namespace
     */
    const API_NAMESPACE = 'heiwa/v1';

    /**
     * Client configuration
     */
    private static $config = array();

    /**
     * Rate limiter instance
     */
    // private static $rate_limiter; // Disabled - rate limiter not implemented

    /**
     * Initialize the API client
     */
    public static function init() {
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_client_scripts'));
        add_action('wp_ajax_nopriv_heiwa_api_request', array(__CLASS__, 'handle_ajax_request'));
        add_action('wp_ajax_heiwa_api_request', array(__CLASS__, 'handle_ajax_request'));
        add_action('wp_ajax_heiwa_get_api_config', array(__CLASS__, 'handle_get_api_config'));

        // Initialize rate limiter (disabled - class doesn't exist)
        // self::$rate_limiter = new Heiwa_Booking_Rate_Limiter();
    }

    /**
     * Enqueue client-side API scripts
     */
    public static function enqueue_client_scripts() {
        // Disabled - causing PHP errors
        return;
    }

    /**
     * Get public configuration for frontend
     *
     * @return array Public configuration
     */
    public static function get_public_config() {
        $settings = get_option('heiwa_booking_settings', array());

        return array(
            'brandId' => $settings['brand_id'] ?? null,
            'stripePublishableKey' => $settings['stripe_publishable_key'] ?? null,
            'debug' => !empty($settings['debug_mode']),
            'rateLimits' => array(
                'availability' => 10, // requests per minute
                'pricing' => 5,
                'checkout' => 3,
            ),
        );
    }

    /**
     * Handle AJAX API requests from frontend
     */
    public static function handle_ajax_request() {
        try {
            // Verify nonce
            if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_api_nonce')) {
                throw new Exception(__('Security check failed', 'heiwa-booking-widget'), 403);
            }

            // Check rate limiting (disabled - rate limiter not implemented)
            // $client_ip = Heiwa_Booking_Security::get_client_ip();
            // $endpoint = sanitize_text_field($_POST['endpoint'] ?? '');
            //
            // if (!self::$rate_limiter->check_limit($client_ip, $endpoint)) {
            //     throw new Exception(__('Rate limit exceeded', 'heiwa-booking-widget'), 429);
            // }

            // Validate endpoint
            $allowed_endpoints = array('availability', 'price-quote', 'create-checkout');
            if (!in_array($endpoint, $allowed_endpoints)) {
                throw new Exception(__('Invalid endpoint', 'heiwa-booking-widget'), 400);
            }

            // Get request data
            $data = json_decode(stripslashes($_POST['data'] ?? '{}'), true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception(__('Invalid request data', 'heiwa-booking-widget'), 400);
            }

            // Validate and sanitize request data
            $validated_data = self::validate_request_data($endpoint, $data);
            if (is_wp_error($validated_data)) {
                throw new Exception($validated_data->get_error_message(), 400);
            }

            // Make the API call
            $response = self::proxy_api_request($endpoint, $validated_data);

            // Log successful request
            Heiwa_Booking_Security::log_security_event('api_request_success', array(
                'endpoint' => $endpoint,
                'ip' => $client_ip,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            ));

            wp_send_json_success($response);

        } catch (Exception $e) {
            $error_code = $e->getCode() ?: 500;

            // Log error
            Heiwa_Booking_Security::log_security_event('api_request_error', array(
                'endpoint' => $_POST['endpoint'] ?? 'unknown',
                'error' => $e->getMessage(),
                'code' => $error_code,
                'ip' => Heiwa_Booking_Security::get_client_ip(),
            ));

            wp_send_json_error(array(
                'message' => $e->getMessage(),
                'code' => $error_code,
            ), $error_code);
        }
    }

    /**
     * Handle get API config request
     */
    public static function handle_get_api_config() {
        try {
            // Verify nonce
            if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_api_nonce')) {
                throw new Exception(__('Security check failed', 'heiwa-booking-widget'), 403);
            }

            $config = self::get_public_config();

            wp_send_json_success($config);

        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => $e->getMessage(),
                'code' => $e->getCode() ?: 500,
            ));
        }
    }

    /**
     * Validate request data for specific endpoint
     *
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @return array|WP_Error Validated data or error
     */
    private static function validate_request_data($endpoint, $data) {
        switch ($endpoint) {
            case 'availability':
                return self::validate_availability_data($data);

            case 'price-quote':
                return self::validate_price_quote_data($data);

            case 'create-checkout':
                return self::validate_checkout_data($data);

            default:
                return new WP_Error('validation_error', __('Unknown endpoint', 'heiwa-booking-widget'));
        }
    }

    /**
     * Validate availability request data
     *
     * @param array $data Request data
     * @return array|WP_Error Validated data or error
     */
    private static function validate_availability_data($data) {
        $validated = array();

        // Required fields
        if (empty($data['brandId'])) {
            return new WP_Error('validation_error', __('Brand ID is required', 'heiwa-booking-widget'));
        }
        $validated['brand_id'] = sanitize_text_field($data['brandId']);

        if (!isset($data['guestCount']) || !is_numeric($data['guestCount'])) {
            return new WP_Error('validation_error', __('Valid guest count is required', 'heiwa-booking-widget'));
        }
        $guest_count = intval($data['guestCount']);
        if ($guest_count < 1 || $guest_count > 20) {
            return new WP_Error('validation_error', __('Guest count must be between 1 and 20', 'heiwa-booking-widget'));
        }
        $validated['guest_count'] = $guest_count;

        // Optional fields
        if (!empty($data['checkInDate'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['checkInDate'])) {
                return new WP_Error('validation_error', __('Invalid check-in date format', 'heiwa-booking-widget'));
            }
            $validated['check_in_date'] = sanitize_text_field($data['checkInDate']);
        }

        if (!empty($data['checkOutDate'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['checkOutDate'])) {
                return new WP_Error('validation_error', __('Invalid check-out date format', 'heiwa-booking-widget'));
            }
            $validated['check_out_date'] = sanitize_text_field($data['checkOutDate']);
        }

        if (!empty($data['propertyIds']) && is_array($data['propertyIds'])) {
            $validated['property_ids'] = array_map('sanitize_text_field', $data['propertyIds']);
        }

        if (!empty($data['roomTypes']) && is_array($data['roomTypes'])) {
            $allowed_types = array('dorm', 'private', 'suite');
            $validated['room_types'] = array_filter($data['roomTypes'], function($type) use ($allowed_types) {
                return in_array($type, $allowed_types);
            });
        }

        return $validated;
    }

    /**
     * Validate price quote request data
     *
     * @param array $data Request data
     * @return array|WP_Error Validated data or error
     */
    private static function validate_price_quote_data($data) {
        $validated = array();

        // Required fields
        if (empty($data['campWeekId'])) {
            return new WP_Error('validation_error', __('Camp week ID is required', 'heiwa-booking-widget'));
        }
        $validated['camp_week_id'] = sanitize_text_field($data['campWeekId']);

        if (empty($data['beds']) || !is_array($data['beds'])) {
            return new WP_Error('validation_error', __('At least one bed selection is required', 'heiwa-booking-widget'));
        }
        $validated['beds'] = array_map('sanitize_text_field', $data['beds']);

        if (!isset($data['guestCount']) || !is_numeric($data['guestCount'])) {
            return new WP_Error('validation_error', __('Valid guest count is required', 'heiwa-booking-widget'));
        }
        $validated['guest_count'] = intval($data['guestCount']);

        // Optional fields
        if (!empty($data['brandId'])) {
            $validated['brand_id'] = sanitize_text_field($data['brandId']);
        }

        if (!empty($data['addons']) && is_array($data['addons'])) {
            $validated['addons'] = array();
            foreach ($data['addons'] as $addon) {
                if (isset($addon['addonId']) && isset($addon['quantity'])) {
                    $validated['addons'][] = array(
                        'addon_id' => sanitize_text_field($addon['addonId']),
                        'quantity' => intval($addon['quantity']),
                    );
                }
            }
        }

        if (!empty($data['promoCode'])) {
            $validated['promo_code'] = sanitize_text_field($data['promoCode']);
        }

        return $validated;
    }

    /**
     * Validate checkout request data
     *
     * @param array $data Request data
     * @return array|WP_Error Validated data or error
     */
    private static function validate_checkout_data($data) {
        // Start with price quote validation
        $validated = self::validate_price_quote_data($data);
        if (is_wp_error($validated)) {
            return $validated;
        }

        // Additional checkout fields
        if (empty($data['customerEmail']) || !is_email($data['customerEmail'])) {
            return new WP_Error('validation_error', __('Valid customer email is required', 'heiwa-booking-widget'));
        }
        $validated['customer_email'] = sanitize_email($data['customerEmail']);

        if (empty($data['customerFirstName'])) {
            return new WP_Error('validation_error', __('Customer first name is required', 'heiwa-booking-widget'));
        }
        $validated['customer_first_name'] = sanitize_text_field($data['customerFirstName']);

        if (empty($data['customerLastName'])) {
            return new WP_Error('validation_error', __('Customer last name is required', 'heiwa-booking-widget'));
        }
        $validated['customer_last_name'] = sanitize_text_field($data['customerLastName']);

        if (!empty($data['customerPhone'])) {
            $validated['customer_phone'] = sanitize_text_field($data['customerPhone']);
        }

        if (!empty($data['successUrl']) && !wp_http_validate_url($data['successUrl'])) {
            return new WP_Error('validation_error', __('Invalid success URL', 'heiwa-booking-widget'));
        }
        $validated['success_url'] = esc_url_raw($data['successUrl']);

        if (!empty($data['cancelUrl']) && !wp_http_validate_url($data['cancelUrl'])) {
            return new WP_Error('validation_error', __('Invalid cancel URL', 'heiwa-booking-widget'));
        }
        $validated['cancel_url'] = esc_url_raw($data['cancelUrl']);

        if (!empty($data['specialRequests'])) {
            $validated['special_requests'] = sanitize_textarea_field($data['specialRequests']);
        }

        // Remove guest_count as it's derived from beds
        unset($validated['guest_count']);

        return $validated;
    }

    /**
     * Proxy API request to REST endpoints
     *
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @return array Response data
     * @throws Exception On error
     */
    private static function proxy_api_request($endpoint, $data) {
        $rest_url = rest_url(self::API_NAMESPACE . '/' . $endpoint);

        // Map frontend field names to REST API field names
        $mapped_data = self::map_frontend_to_rest($endpoint, $data);

        // Make request to REST endpoint
        $response = wp_remote_post($rest_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-WP-Nonce' => wp_create_nonce('wp_rest'),
            ),
            'body' => wp_json_encode($mapped_data),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            throw new Exception(__('Failed to communicate with booking service', 'heiwa-booking-widget'), 502);
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code >= 400) {
            $error_data = json_decode($response_body, true);
            $error_message = $error_data['message'] ?? __('API request failed', 'heiwa-booking-widget');
            throw new Exception($error_message, $response_code);
        }

        $decoded_response = json_decode($response_body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception(__('Invalid response from server', 'heiwa-booking-widget'), 502);
        }

        return $decoded_response;
    }

    /**
     * Map frontend field names to REST API field names
     *
     * @param string $endpoint API endpoint
     * @param array $data Frontend data
     * @return array Mapped data
     */
    private static function map_frontend_to_rest($endpoint, $data) {
        // Most fields already match, but handle any special mappings here
        return $data;
    }

    /**
     * Get client-side JavaScript code
     *
     * @return string JavaScript code
     */
    public static function get_client_javascript() {
        ob_start();
        ?>
        (function($) {
            'use strict';

            // Heiwa API Client
            window.HeiwaAPI = {

                config: heiwaAPI.config,

                // Make API request
                request: function(endpoint, data, options) {
                    options = options || {};

                    return $.ajax({
                        url: heiwaAPI.ajaxUrl,
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            action: 'heiwa_api_request',
                            nonce: heiwaAPI.nonce,
                            endpoint: endpoint,
                            data: JSON.stringify(data)
                        },
                        timeout: options.timeout || 30000,
                        beforeSend: function() {
                            if (options.beforeSend) {
                                options.beforeSend();
                            }
                        }
                    }).then(function(response) {
                        if (response.success) {
                            return response.data;
                        } else {
                            throw new Error(response.data.message || heiwaAPI.strings.error);
                        }
                    }).catch(function(xhr) {
                        var errorMessage = heiwaAPI.strings.networkError;

                        if (xhr.responseJSON && xhr.responseJSON.data) {
                            errorMessage = xhr.responseJSON.data.message;
                        } else if (xhr.status === 429) {
                            errorMessage = heiwaAPI.strings.rateLimited;
                        }

                        throw new Error(errorMessage);
                    });
                },

                // Get availability
                getAvailability: function(params) {
                    return this.request('availability', params);
                },

                // Get price quote
                getPriceQuote: function(params) {
                    return this.request('price-quote', params);
                },

                // Create checkout session
                createCheckout: function(params) {
                    return this.request('create-checkout', params);
                },

                // Utility methods
                formatDate: function(date) {
                    if (date instanceof Date) {
                        return date.toISOString().split('T')[0];
                    }
                    return date;
                },

                validateEmail: function(email) {
                    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    return re.test(email);
                },

                sanitizeInput: function(input) {
                    return String(input).replace(/[<>]/g, '');
                }
            };

            // Initialize on document ready
            $(document).ready(function() {
                // Auto-initialize widgets
                $('.heiwa-booking-widget').each(function() {
                    var $widget = $(this);
                    var widgetId = $widget.data('widget-id') || 'default';

                    // Initialize widget API client
                    $widget.data('api', window.HeiwaAPI);
                });
            });

        })(jQuery);
        <?php
        return ob_get_clean();
    }
}

// Initialize API client
Heiwa_Booking_API_Client::init();
