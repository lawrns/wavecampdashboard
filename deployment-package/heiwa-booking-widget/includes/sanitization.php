<?php
/**
 * Input Sanitization Utilities for Heiwa Booking Widget
 *
 * Provides additional sanitization utilities beyond the core security class.
 * This file contains specialized sanitization functions for various data types.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Sanitization utility class
 */
class Heiwa_Booking_Sanitization {

    /**
     * Sanitize HTML content with allowed tags
     *
     * @param string $content The content to sanitize
     * @param array $allowed_tags Allowed HTML tags
     * @return string Sanitized content
     */
    public static function sanitize_html($content, $allowed_tags = array()) {
        if (empty($allowed_tags)) {
            $allowed_tags = array(
                'a' => array('href' => array(), 'title' => array()),
                'br' => array(),
                'em' => array(),
                'strong' => array(),
                'p' => array(),
                'span' => array(),
                'div' => array('class' => array()),
            );
        }

        return wp_kses($content, $allowed_tags);
    }

    /**
     * Sanitize CSS color value
     *
     * @param string $color The color value to sanitize
     * @return string Sanitized color or empty string
     */
    public static function sanitize_color($color) {
        // Remove any whitespace
        $color = trim($color);

        // Check for hex colors
        if (preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', $color)) {
            return $color;
        }

        // Check for rgb/rgba colors
        if (preg_match('/^(rgb|rgba)\([0-9\s,]+\)$/', $color)) {
            return $color;
        }

        // Check for named colors (basic set)
        $named_colors = array(
            'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
            'pink', 'brown', 'gray', 'grey', 'silver', 'gold', 'navy', 'maroon'
        );

        if (in_array(strtolower($color), $named_colors)) {
            return $color;
        }

        return '';
    }

    /**
     * Sanitize font family name
     *
     * @param string $font The font family to sanitize
     * @return string Sanitized font family
     */
    public static function sanitize_font_family($font) {
        // Remove quotes and extra spaces
        $font = trim($font, '\'"');

        // Only allow alphanumeric, spaces, commas, and hyphens
        if (preg_match('/^[\w\s,-]+$/', $font)) {
            return sanitize_text_field($font);
        }

        return '';
    }

    /**
     * Sanitize border radius value
     *
     * @param string $radius The border radius value
     * @return string Sanitized border radius
     */
    public static function sanitize_border_radius($radius) {
        $radius = trim($radius);

        // Allow px, em, rem units or just numbers
        if (preg_match('/^(\d+(?:\.\d+)?(?:px|em|rem|%)?)$/', $radius)) {
            return $radius;
        }

        return '';
    }

    /**
     * Sanitize API endpoint URL
     *
     * @param string $url The URL to sanitize
     * @return string Sanitized URL or empty string
     */
    public static function sanitize_api_endpoint($url) {
        $url = trim($url);

        // Must be HTTPS
        if (!preg_match('/^https:\/\/.+/', $url)) {
            return '';
        }

        // Use WordPress URL validation
        if (wp_http_validate_url($url)) {
            return esc_url_raw($url);
        }

        return '';
    }

    /**
     * Sanitize brand configuration array
     *
     * @param array $config The brand configuration
     * @return array Sanitized configuration
     */
    public static function sanitize_brand_config($config) {
        if (!is_array($config)) {
            return array();
        }

        $sanitized = array();

        // Primary color
        if (isset($config['primary_color'])) {
            $sanitized['primary_color'] = self::sanitize_color($config['primary_color']);
        }

        // Secondary color
        if (isset($config['secondary_color'])) {
            $sanitized['secondary_color'] = self::sanitize_color($config['secondary_color']);
        }

        // Accent color
        if (isset($config['accent_color'])) {
            $sanitized['accent_color'] = self::sanitize_color($config['accent_color']);
        }

        // Font family
        if (isset($config['font_family'])) {
            $sanitized['font_family'] = self::sanitize_font_family($config['font_family']);
        }

        // Border radius
        if (isset($config['border_radius'])) {
            $sanitized['border_radius'] = self::sanitize_border_radius($config['border_radius']);
        }

        return $sanitized;
    }

    /**
     * Sanitize API configuration array
     *
     * @param array $config The API configuration
     * @return array Sanitized configuration
     */
    public static function sanitize_api_config($config) {
        if (!is_array($config)) {
            return array();
        }

        $sanitized = array();

        // API endpoint
        if (isset($config['api_endpoint'])) {
            $sanitized['api_endpoint'] = self::sanitize_api_endpoint($config['api_endpoint']);
        }

        // Stripe publishable key (basic validation)
        if (isset($config['stripe_publishable_key'])) {
            $key = sanitize_text_field($config['stripe_publishable_key']);
            // Basic Stripe key format validation
            if (preg_match('/^pk_(test|live)_[A-Za-z0-9]+$/', $key)) {
                $sanitized['stripe_publishable_key'] = $key;
            }
        }

        return $sanitized;
    }

    /**
     * Sanitize settings array
     *
     * @param array $settings The settings array
     * @return array Sanitized settings
     */
    public static function sanitize_settings($settings) {
        if (!is_array($settings)) {
            return array();
        }

        $sanitized = array();

        // API endpoint
        if (isset($settings['api_endpoint'])) {
            $sanitized['api_endpoint'] = self::sanitize_api_endpoint($settings['api_endpoint']);
        }

        // API key
        if (isset($settings['api_key'])) {
            $sanitized['api_key'] = sanitize_text_field($settings['api_key']);
        }

        // Brand ID
        if (isset($settings['brand_id'])) {
            $sanitized['brand_id'] = sanitize_text_field($settings['brand_id']);
        }

        // Widget position
        if (isset($settings['widget_position'])) {
            $allowed_positions = array('left', 'right', 'bottom-left', 'bottom-right');
            if (in_array($settings['widget_position'], $allowed_positions)) {
                $sanitized['widget_position'] = $settings['widget_position'];
            }
        }

        // Trigger text
        if (isset($settings['trigger_text'])) {
            $sanitized['trigger_text'] = sanitize_text_field($settings['trigger_text']);
        }

        // Primary color
        if (isset($settings['primary_color'])) {
            $sanitized['primary_color'] = self::sanitize_color($settings['primary_color']);
        }

        // Auto inject
        if (isset($settings['auto_inject'])) {
            $sanitized['auto_inject'] = (bool) $settings['auto_inject'];
        }

        // Enabled pages
        if (isset($settings['enabled_pages']) && is_array($settings['enabled_pages'])) {
            $sanitized['enabled_pages'] = array_map('intval', $settings['enabled_pages']);
        }

        // Brand config
        if (isset($settings['brand_config'])) {
            $sanitized['brand_config'] = self::sanitize_brand_config($settings['brand_config']);
        }

        return $sanitized;
    }

    /**
     * Deep sanitize array recursively
     *
     * @param mixed $data The data to sanitize
     * @return mixed Sanitized data
     */
    public static function deep_sanitize($data) {
        if (is_array($data)) {
            return array_map(array(__CLASS__, 'deep_sanitize'), $data);
        } elseif (is_object($data)) {
            $sanitized = new stdClass();
            foreach ($data as $key => $value) {
                $sanitized->$key = self::deep_sanitize($value);
            }
            return $sanitized;
        } else {
            return Heiwa_Booking_Security::sanitize_input($data, 'text');
        }
    }

    /**
     * Sanitize filename for uploads
     *
     * @param string $filename The filename to sanitize
     * @return string Sanitized filename
     */
    public static function sanitize_filename($filename) {
        // Use WordPress sanitize_file_name
        return sanitize_file_name($filename);
    }

    /**
     * Sanitize SQL-like strings to prevent injection
     *
     * @param string $string The string to sanitize
     * @return string Sanitized string
     */
    public static function sanitize_sql_string($string) {
        // Remove or escape potentially dangerous characters
        return preg_replace('/[^\w\s\-.,]/', '', $string);
    }
}
