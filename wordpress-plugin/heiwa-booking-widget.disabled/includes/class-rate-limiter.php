<?php
/**
 * Rate Limiter Class
 *
 * Handles API rate limiting to prevent abuse and ensure fair usage
 *
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Rate Limiter for API calls
 */
class Heiwa_Booking_Rate_Limiter {

    /**
     * Rate limit storage prefix
     */
    const STORAGE_PREFIX = 'heiwa_rate_limit_';

    /**
     * Default rate limits per minute
     */
    const DEFAULT_LIMITS = array(
        'api_availability' => 10,
        'api_pricing' => 5,
        'api_booking' => 3,
        'general' => 30
    );

    /**
     * Check if request is within rate limits
     *
     * @param string $action Action identifier
     * @param string $identifier Unique identifier (IP, user ID, etc.)
     * @return bool True if allowed, false if rate limited
     */
    public static function check_limit($action = 'general', $identifier = null) {
        if (!$identifier) {
            $identifier = self::get_client_identifier();
        }

        $key = self::STORAGE_PREFIX . $action . '_' . $identifier;
        $limit = self::DEFAULT_LIMITS[$action] ?? self::DEFAULT_LIMITS['general'];

        // Get current usage
        $usage = get_transient($key);

        if ($usage === false) {
            // First request in this window
            set_transient($key, 1, MINUTE_IN_SECONDS);
            return true;
        }

        if ($usage >= $limit) {
            // Rate limit exceeded
            return false;
        }

        // Increment usage
        set_transient($key, $usage + 1, MINUTE_IN_SECONDS);
        return true;
    }

    /**
     * Get remaining requests for an action
     *
     * @param string $action Action identifier
     * @param string $identifier Unique identifier
     * @return int Remaining requests
     */
    public static function get_remaining($action = 'general', $identifier = null) {
        if (!$identifier) {
            $identifier = self::get_client_identifier();
        }

        $key = self::STORAGE_PREFIX . $action . '_' . $identifier;
        $limit = self::DEFAULT_LIMITS[$action] ?? self::DEFAULT_LIMITS['general'];

        $usage = get_transient($key);

        if ($usage === false) {
            return $limit;
        }

        return max(0, $limit - $usage);
    }

    /**
     * Get client identifier (IP address)
     *
     * @return string Client identifier
     */
    private static function get_client_identifier() {
        $ip = '';

        // Check for proxy headers
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $ip = $_SERVER['HTTP_X_REAL_IP'];
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }

        // Clean and hash the IP for privacy
        $ip = trim($ip);
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return wp_hash($ip);
        }

        // Fallback
        return wp_hash('unknown');
    }

    /**
     * Clear rate limit for testing/debugging
     *
     * @param string $action Action identifier
     * @param string $identifier Unique identifier
     */
    public static function clear_limit($action = 'general', $identifier = null) {
        if (!$identifier) {
            $identifier = self::get_client_identifier();
        }

        $key = self::STORAGE_PREFIX . $action . '_' . $identifier;
        delete_transient($key);
    }

    /**
     * Get rate limit status for debugging
     *
     * @param string $action Action identifier
     * @param string $identifier Unique identifier
     * @return array Status information
     */
    public static function get_status($action = 'general', $identifier = null) {
        if (!$identifier) {
            $identifier = self::get_client_identifier();
        }

        $key = self::STORAGE_PREFIX . $action . '_' . $identifier;
        $limit = self::DEFAULT_LIMITS[$action] ?? self::DEFAULT_LIMITS['general'];

        $usage = get_transient($key);
        $remaining = self::get_remaining($action, $identifier);

        return array(
            'action' => $action,
            'identifier' => $identifier,
            'limit' => $limit,
            'used' => $usage ?: 0,
            'remaining' => $remaining,
            'reset_time' => MINUTE_IN_SECONDS
        );
    }
}
