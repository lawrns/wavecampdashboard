<?php
/**
 * Settings Validation and Management for Heiwa Booking Widget
 *
 * Comprehensive validation, sanitization, and management of plugin settings.
 * Ensures data integrity and security for all configuration options.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Settings validation and management class
 */
class Heiwa_Booking_Settings_Validator {

    /**
     * Validation rules for each setting
     */
    private static $validation_rules = array(
        'api_endpoint' => array(
            'type' => 'url',
            'required' => false,
            'sanitize' => 'sanitize_api_endpoint',
            'validate' => 'validate_api_endpoint'
        ),
        'api_key' => array(
            'type' => 'string',
            'required' => false,
            'sanitize' => 'sanitize_text_field',
            'validate' => 'validate_api_key'
        ),
        'brand_id' => array(
            'type' => 'string',
            'required' => false,
            'sanitize' => 'sanitize_text_field',
            'validate' => 'validate_brand_id'
        ),
        'stripe_publishable_key' => array(
            'type' => 'string',
            'required' => false,
            'sanitize' => 'sanitize_text_field',
            'validate' => 'validate_stripe_key'
        ),
        'widget_position' => array(
            'type' => 'enum',
            'required' => false,
            'options' => array('right', 'left', 'bottom', 'bottom-left', 'bottom-right'),
            'default' => 'right',
            'sanitize' => 'sanitize_text_field'
        ),
        'trigger_text' => array(
            'type' => 'string',
            'required' => false,
            'default' => 'BOOK NOW',
            'min_length' => 1,
            'max_length' => 50,
            'sanitize' => 'sanitize_text_field'
        ),
        'primary_color' => array(
            'type' => 'color',
            'required' => false,
            'default' => '#2563eb',
            'sanitize' => 'sanitize_hex_color'
        ),
        'secondary_color' => array(
            'type' => 'color',
            'required' => false,
            'default' => '#6b7280',
            'sanitize' => 'sanitize_hex_color'
        ),
        'accent_color' => array(
            'type' => 'color',
            'required' => false,
            'default' => '#f59e0b',
            'sanitize' => 'sanitize_hex_color'
        ),
        'font_family' => array(
            'type' => 'enum',
            'required' => false,
            'options' => array(
                'Inter, sans-serif',
                'Roboto, sans-serif',
                'Open Sans, sans-serif',
                'Lato, sans-serif',
                'system-ui, sans-serif'
            ),
            'default' => 'Inter, sans-serif',
            'sanitize' => 'sanitize_font_family'
        ),
        'border_radius' => array(
            'type' => 'border_radius',
            'required' => false,
            'default' => '8px',
            'sanitize' => 'sanitize_border_radius'
        ),
        'auto_inject' => array(
            'type' => 'boolean',
            'required' => false,
            'default' => false,
            'sanitize' => 'wp_validate_boolean'
        ),
        'enabled_pages' => array(
            'type' => 'array',
            'required' => false,
            'default' => array(),
            'sanitize' => 'sanitize_enabled_pages',
            'validate' => 'validate_enabled_pages'
        ),
        'debug_mode' => array(
            'type' => 'boolean',
            'required' => false,
            'default' => false,
            'sanitize' => 'wp_validate_boolean'
        ),
        'cache_timeout' => array(
            'type' => 'integer',
            'required' => false,
            'default' => 300,
            'min' => 60,
            'max' => 3600,
            'sanitize' => 'intval'
        ),
        'rate_limit' => array(
            'type' => 'integer',
            'required' => false,
            'default' => 10,
            'min' => 1,
            'max' => 100,
            'sanitize' => 'intval'
        ),
        'custom_css' => array(
            'type' => 'css',
            'required' => false,
            'default' => '',
            'sanitize' => 'sanitize_css',
            'validate' => 'validate_css'
        )
    );

    /**
     * Validation errors
     */
    private static $validation_errors = array();

    /**
     * Initialize settings validation
     */
    public static function init() {
        add_filter('pre_update_option_heiwa_booking_settings', array(__CLASS__, 'validate_settings'), 10, 2);
        add_action('wp_ajax_heiwa_save_settings', array(__CLASS__, 'ajax_save_settings'));
    }

    /**
     * Validate all settings before saving
     *
     * @param array $new_settings New settings values
     * @param array $old_settings Old settings values
     * @return array Validated and sanitized settings
     */
    public static function validate_settings($new_settings, $old_settings) {
        self::$validation_errors = array();

        if (!is_array($new_settings)) {
            self::$validation_errors[] = __('Invalid settings format', 'heiwa-booking-widget');
            return $old_settings;
        }

        $validated_settings = array();

        // Validate each setting according to rules
        foreach (self::$validation_rules as $setting_key => $rules) {
            $value = isset($new_settings[$setting_key]) ? $new_settings[$setting_key] : null;
            $validated_value = self::validate_setting($setting_key, $value, $rules);

            if ($validated_value !== null) {
                $validated_settings[$setting_key] = $validated_value;
            }
        }

        // Cross-field validation
        self::validate_cross_field_rules($validated_settings);

        // Log validation errors
        if (!empty(self::$validation_errors)) {
            Heiwa_Booking_Security::log_security_event('settings_validation_failed', array(
                'errors' => self::$validation_errors,
                'user_id' => get_current_user_id()
            ));

            // Add admin notice for validation errors
            add_settings_error(
                'heiwa_booking_settings',
                'validation_errors',
                __('Settings validation failed. Please check the errors below.', 'heiwa-booking-widget'),
                'error'
            );

            // Return old settings if validation failed
            return $old_settings;
        }

        // Log successful validation
        Heiwa_Booking_Security::log_security_event('settings_updated', array(
            'user_id' => get_current_user_id(),
            'changed_settings' => array_keys(array_diff_assoc($validated_settings, $old_settings))
        ));

        return $validated_settings;
    }

    /**
     * Validate a single setting
     *
     * @param string $key Setting key
     * @param mixed $value Setting value
     * @param array $rules Validation rules
     * @return mixed Validated value or null on error
     */
    private static function validate_setting($key, $value, $rules) {
        // Handle required fields
        if ($rules['required'] && (empty($value) && $value !== false && $value !== 0)) {
            self::$validation_errors[] = sprintf(__('Field %s is required', 'heiwa-booking-widget'), $key);
            return null;
        }

        // Use default value if empty and not required
        if (empty($value) && $value !== false && $value !== 0 && isset($rules['default'])) {
            $value = $rules['default'];
        }

        // Sanitize value
        if (isset($rules['sanitize'])) {
            $sanitize_function = $rules['sanitize'];

            if (method_exists('Heiwa_Booking_Sanitization', $sanitize_function)) {
                $value = Heiwa_Booking_Sanitization::$sanitize_function($value);
            } elseif (function_exists($sanitize_function)) {
                $value = call_user_func($sanitize_function, $value);
            }
        }

        // Validate value
        if (isset($rules['validate'])) {
            $validate_function = $rules['validate'];

            if (method_exists(__CLASS__, $validate_function)) {
                $is_valid = self::$validate_function($value, $rules);
                if (!$is_valid) {
                    return null;
                }
            }
        } else {
            // Use built-in validation
            $is_valid = self::validate_by_type($value, $rules);
            if (!$is_valid) {
                return null;
            }
        }

        return $value;
    }

    /**
     * Validate setting by type
     *
     * @param mixed $value Setting value
     * @param array $rules Validation rules
     * @return bool Whether the value is valid
     */
    private static function validate_by_type($value, $rules) {
        switch ($rules['type']) {
            case 'string':
                if (!is_string($value)) {
                    self::$validation_errors[] = __('Invalid string value', 'heiwa-booking-widget');
                    return false;
                }

                $length = strlen($value);
                if (isset($rules['min_length']) && $length < $rules['min_length']) {
                    self::$validation_errors[] = sprintf(__('Value must be at least %d characters', 'heiwa-booking-widget'), $rules['min_length']);
                    return false;
                }

                if (isset($rules['max_length']) && $length > $rules['max_length']) {
                    self::$validation_errors[] = sprintf(__('Value must be no more than %d characters', 'heiwa-booking-widget'), $rules['max_length']);
                    return false;
                }
                break;

            case 'integer':
                if (!is_numeric($value)) {
                    self::$validation_errors[] = __('Value must be a number', 'heiwa-booking-widget');
                    return false;
                }

                $value = intval($value);

                if (isset($rules['min']) && $value < $rules['min']) {
                    self::$validation_errors[] = sprintf(__('Value must be at least %d', 'heiwa-booking-widget'), $rules['min']);
                    return false;
                }

                if (isset($rules['max']) && $value > $rules['max']) {
                    self::$validation_errors[] = sprintf(__('Value must be no more than %d', 'heiwa-booking-widget'), $rules['max']);
                    return false;
                }
                break;

            case 'boolean':
                // Already handled by sanitize
                break;

            case 'enum':
                if (!in_array($value, $rules['options'])) {
                    self::$validation_errors[] = sprintf(__('Invalid value. Must be one of: %s', 'heiwa-booking-widget'), implode(', ', $rules['options']));
                    return false;
                }
                break;

            case 'array':
                if (!is_array($value)) {
                    self::$validation_errors[] = __('Value must be an array', 'heiwa-booking-widget');
                    return false;
                }
                break;

            case 'color':
                if (!preg_match('/^#[a-fA-F0-9]{6}$/', $value)) {
                    self::$validation_errors[] = __('Invalid color format. Use #RRGGBB format', 'heiwa-booking-widget');
                    return false;
                }
                break;

            case 'url':
                if (!wp_http_validate_url($value)) {
                    self::$validation_errors[] = __('Invalid URL format', 'heiwa-booking-widget');
                    return false;
                }
                break;
        }

        return true;
    }

    /**
     * Cross-field validation rules
     *
     * @param array $settings Settings array
     */
    private static function validate_cross_field_rules($settings) {
        // If API endpoint is set, API key should also be set
        if (!empty($settings['api_endpoint']) && empty($settings['api_key'])) {
            self::$validation_errors[] = __('API key is required when API endpoint is configured', 'heiwa-booking-widget');
        }

        // If API key is set, API endpoint should also be set
        if (!empty($settings['api_key']) && empty($settings['api_endpoint'])) {
            self::$validation_errors[] = __('API endpoint is required when API key is configured', 'heiwa-booking-widget');
        }

        // If auto_inject is enabled, at least one page type should be enabled
        if (!empty($settings['auto_inject']) && empty($settings['enabled_pages'])) {
            self::$validation_errors[] = __('At least one page type must be enabled when auto-inject is active', 'heiwa-booking-widget');
        }

        // Stripe key validation
        if (!empty($settings['stripe_publishable_key'])) {
            if (!preg_match('/^pk_(test|live)_[A-Za-z0-9]+$/', $settings['stripe_publishable_key'])) {
                self::$validation_errors[] = __('Invalid Stripe publishable key format', 'heiwa-booking-widget');
            }
        }
    }

    /**
     * Custom validation functions
     */
    private static function validate_api_endpoint($value, $rules) {
        if (empty($value)) {
            return true; // Optional field
        }

        if (!wp_http_validate_url($value)) {
            self::$validation_errors[] = __('Invalid API endpoint URL', 'heiwa-booking-widget');
            return false;
        }

        // Must be HTTPS
        if (!preg_match('/^https:\/\/.+/', $value)) {
            self::$validation_errors[] = __('API endpoint must use HTTPS', 'heiwa-booking-widget');
            return false;
        }

        return true;
    }

    private static function validate_api_key($value, $rules) {
        if (empty($value)) {
            return true; // Optional field
        }

        // Basic format validation (should start with heiwa_)
        if (!preg_match('/^heiwa_/', $value)) {
            self::$validation_errors[] = __('API key should start with "heiwa_"', 'heiwa-booking-widget');
            return false;
        }

        // Length check
        if (strlen($value) < 20) {
            self::$validation_errors[] = __('API key appears to be too short', 'heiwa-booking-widget');
            return false;
        }

        return true;
    }

    private static function validate_brand_id($value, $rules) {
        if (empty($value)) {
            return true; // Optional field
        }

        // Brand ID should be lowercase, alphanumeric, hyphens only
        if (!preg_match('/^[a-z0-9-]+$/', $value)) {
            self::$validation_errors[] = __('Brand ID can only contain lowercase letters, numbers, and hyphens', 'heiwa-booking-widget');
            return false;
        }

        // Length check
        if (strlen($value) < 2 || strlen($value) > 50) {
            self::$validation_errors[] = __('Brand ID must be between 2 and 50 characters', 'heiwa-booking-widget');
            return false;
        }

        return true;
    }

    private static function validate_stripe_key($value, $rules) {
        if (empty($value)) {
            return true; // Optional field
        }

        // Stripe publishable key format
        if (!preg_match('/^pk_(test|live)_[A-Za-z0-9]+$/', $value)) {
            self::$validation_errors[] = __('Invalid Stripe publishable key format', 'heiwa-booking-widget');
            return false;
        }

        return true;
    }

    private static function validate_enabled_pages($value, $rules) {
        if (!is_array($value)) {
            self::$validation_errors[] = __('Enabled pages must be an array', 'heiwa-booking-widget');
            return false;
        }

        $allowed_pages = array('front_page', 'home', 'pages', 'posts');
        foreach ($value as $page) {
            if (!in_array($page, $allowed_pages)) {
                self::$validation_errors[] = sprintf(__('Invalid page type: %s', 'heiwa-booking-widget'), $page);
                return false;
            }
        }

        return true;
    }

    private static function validate_css($value, $rules) {
        if (empty($value)) {
            return true; // Optional field
        }

        // Basic CSS validation - check for potentially dangerous constructs
        $dangerous_patterns = array(
            '/@import/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/data:/i',
            '/expression/i'
        );

        foreach ($dangerous_patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                self::$validation_errors[] = __('Custom CSS contains potentially unsafe code', 'heiwa-booking-widget');
                return false;
            }
        }

        return true;
    }

    /**
     * Sanitization functions
     */
    private static function sanitize_enabled_pages($value) {
        if (!is_array($value)) {
            return array();
        }

        return array_map('sanitize_text_field', $value);
    }

    private static function sanitize_css($value) {
        // Basic CSS sanitization - remove script tags and dangerous content
        $value = wp_strip_all_tags($value);
        $value = preg_replace('/javascript:/i', '', $value);
        $value = preg_replace('/vbscript:/i', '', $value);
        $value = preg_replace('/data:/i', '', $value);

        return $value;
    }

    /**
     * AJAX handler for saving settings
     */
    public static function ajax_save_settings() {
        // Verify nonce
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_admin_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'heiwa-booking-widget')));
        }

        // Check capabilities
        if (!Heiwa_Booking_Permissions::can_edit_settings(get_current_user_id())) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'heiwa-booking-widget')));
        }

        // Get current settings
        $current_settings = get_option('heiwa_booking_settings', array());

        // Collect form data
        $new_settings = array();
        parse_str($_POST['form_data'] ?? '', $new_settings);

        // Validate and sanitize
        $validated_settings = self::validate_settings($new_settings, $current_settings);

        if (!empty(self::$validation_errors)) {
            wp_send_json_error(array(
                'message' => __('Validation failed', 'heiwa-booking-widget'),
                'errors' => self::$validation_errors
            ));
        }

        // Save settings
        $updated = update_option('heiwa_booking_settings', $validated_settings);

        if ($updated) {
            wp_send_json_success(array(
                'message' => __('Settings saved successfully', 'heiwa-booking-widget')
            ));
        } else {
            wp_send_json_error(array(
                'message' => __('Failed to save settings', 'heiwa-booking-widget')
            ));
        }
    }

    /**
     * Get validation errors
     *
     * @return array Validation errors
     */
    public static function get_validation_errors() {
        return self::$validation_errors;
    }

    /**
     * Clear validation errors
     */
    public static function clear_validation_errors() {
        self::$validation_errors = array();
    }

    /**
     * Get available setting options for dropdowns
     *
     * @param string $setting Setting key
     * @return array Available options
     */
    public static function get_setting_options($setting) {
        $options = array();

        switch ($setting) {
            case 'widget_position':
                $options = array(
                    'right' => __('Right Side', 'heiwa-booking-widget'),
                    'left' => __('Left Side', 'heiwa-booking-widget'),
                    'bottom' => __('Bottom', 'heiwa-booking-widget'),
                    'bottom-left' => __('Bottom Left', 'heiwa-booking-widget'),
                    'bottom-right' => __('Bottom Right', 'heiwa-booking-widget'),
                );
                break;

            case 'font_family':
                $options = array(
                    'Inter, sans-serif' => 'Inter',
                    'Roboto, sans-serif' => 'Roboto',
                    'Open Sans, sans-serif' => 'Open Sans',
                    'Lato, sans-serif' => 'Lato',
                    'system-ui, sans-serif' => __('System Font', 'heiwa-booking-widget'),
                );
                break;

            case 'border_radius':
                $options = array(
                    '4px' => __('Sharp (4px)', 'heiwa-booking-widget'),
                    '8px' => __('Rounded (8px)', 'heiwa-booking-widget'),
                    '12px' => __('Very Rounded (12px)', 'heiwa-booking-widget'),
                    '20px' => __('Pill (20px)', 'heiwa-booking-widget'),
                );
                break;

            case 'enabled_pages':
                $options = array(
                    'front_page' => __('Front Page', 'heiwa-booking-widget'),
                    'home' => __('Blog Home', 'heiwa-booking-widget'),
                    'pages' => __('All Pages', 'heiwa-booking-widget'),
                    'posts' => __('All Posts', 'heiwa-booking-widget'),
                );
                break;
        }

        return $options;
    }
}

// Initialize settings validation
Heiwa_Booking_Settings_Validator::init();
