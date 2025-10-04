<?php
/**
 * Error Handling Class - Simplified Version
 * Handles errors and exceptions for the Heiwa Booking Widget
 *
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_Error_Handler {

    // Error codes
    const ERROR_API_CONNECTION = 'api_connection';
    const ERROR_API_TIMEOUT = 'api_timeout';
    const ERROR_API_INVALID_RESPONSE = 'api_invalid_response';
    const ERROR_VALIDATION_FAILED = 'validation_failed';
    const ERROR_RATE_LIMITED = 'rate_limited';
    const ERROR_SECURITY_VIOLATION = 'security_violation';
    const ERROR_CONFIGURATION = 'configuration_error';
    const ERROR_PERMISSION_DENIED = 'permission_denied';
    const ERROR_BOOKING_CONFLICT = 'booking_conflict';
    const ERROR_PAYMENT_FAILED = 'payment_failed';
    const ERROR_UNKNOWN = 'unknown_error';

    /**
     * Initialize error handling
     */
    public static function init() {
        // Basic error handling - minimal implementation
    }

    /**
     * Get user-friendly error message
     */
    public static function get_user_friendly_message($error_code) {
        $messages = array(
            self::ERROR_API_CONNECTION => __('Unable to connect to booking service. Please try again later.', 'heiwa-booking-widget'),
            self::ERROR_API_TIMEOUT => __('Request timed out. Please check your connection and try again.', 'heiwa-booking-widget'),
            self::ERROR_API_INVALID_RESPONSE => __('Received invalid response from server.', 'heiwa-booking-widget'),
            self::ERROR_VALIDATION_FAILED => __('Please check your information and try again.', 'heiwa-booking-widget'),
            self::ERROR_RATE_LIMITED => __('Too many requests. Please wait a moment before trying again.', 'heiwa-booking-widget'),
            self::ERROR_SECURITY_VIOLATION => __('Security check failed. Please refresh the page and try again.', 'heiwa-booking-widget'),
            self::ERROR_CONFIGURATION => __('Service configuration error.', 'heiwa-booking-widget'),
            self::ERROR_PERMISSION_DENIED => __('You don\'t have permission to perform this action.', 'heiwa-booking-widget'),
            self::ERROR_BOOKING_CONFLICT => __('Sorry, this booking is no longer available.', 'heiwa-booking-widget'),
            self::ERROR_PAYMENT_FAILED => __('Payment could not be processed.', 'heiwa-booking-widget'),
            self::ERROR_UNKNOWN => __('An unexpected error occurred. Please try again.', 'heiwa-booking-widget'),
        );
        return $messages[$error_code] ?? $messages[self::ERROR_UNKNOWN];
    }

    /**
     * Get recovery suggestions for error
     */
    public static function get_recovery_suggestions_for_error($error_code) {
        return array(__('Please try again', 'heiwa-booking-widget'));
    }
}


