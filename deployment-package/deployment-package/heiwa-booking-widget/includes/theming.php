<?php
/**
 * Brand Theming and Token Management for Heiwa Booking Widget
 *
 * Handles loading, caching, and application of brand-specific theme tokens.
 * Provides integration between WordPress settings and Heiwa House brand configurations.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Brand theming management class
 */
class Heiwa_Booking_Theming {

    /**
     * Cache key for brand tokens
     */
    const BRAND_CACHE_KEY = 'heiwa_brand_tokens';

    /**
     * Cache expiration (24 hours)
     */
    const CACHE_EXPIRATION = 86400;

    /**
     * Default brand theme tokens
     */
    private static $default_tokens = array(
        'primary_color' => '#2563eb',
        'secondary_color' => '#6b7280',
        'accent_color' => '#f59e0b',
        'font_family' => 'Inter, sans-serif',
        'border_radius' => '8px',
        'api_config' => array(
            'stripe_publishable_key' => ''
        )
    );

    /**
     * Initialize theming system
     */
    public static function init() {
        add_action('wp_enqueue_scripts', array(__CLASS__, 'enqueue_brand_styles'));
        add_action('admin_enqueue_scripts', array(__CLASS__, 'enqueue_admin_brand_styles'));
        add_action('wp_ajax_heiwa_refresh_brand_tokens', array(__CLASS__, 'ajax_refresh_brand_tokens'));
        add_action('wp_ajax_heiwa_preview_brand_theme', array(__CLASS__, 'ajax_preview_brand_theme'));
    }

    /**
     * Get brand tokens for a specific brand
     *
     * @param string $brand_id Brand identifier
     * @return array Brand theme tokens
     */
    public static function get_brand_tokens($brand_id = null) {
        if (!$brand_id) {
            $settings = get_option('heiwa_booking_settings', array());
            $brand_id = $settings['brand_id'] ?? null;
        }

        if (!$brand_id) {
            return self::get_local_brand_tokens();
        }

        // Try to get from cache first
        $cache_key = self::BRAND_CACHE_KEY . '_' . $brand_id;
        $cached_tokens = get_transient($cache_key);

        if ($cached_tokens !== false) {
            return array_merge(self::$default_tokens, $cached_tokens);
        }

        // Fetch from API
        $api_tokens = self::fetch_brand_tokens_from_api($brand_id);

        if ($api_tokens) {
            // Cache the tokens
            set_transient($cache_key, $api_tokens, self::CACHE_EXPIRATION);
            return array_merge(self::$default_tokens, $api_tokens);
        }

        // Fall back to local tokens
        return self::get_local_brand_tokens();
    }

    /**
     * Get locally configured brand tokens
     *
     * @return array Local brand tokens
     */
    public static function get_local_brand_tokens() {
        $settings = get_option('heiwa_booking_settings', array());

        return array(
            'primary_color' => $settings['primary_color'] ?? self::$default_tokens['primary_color'],
            'secondary_color' => $settings['secondary_color'] ?? self::$default_tokens['secondary_color'],
            'accent_color' => $settings['accent_color'] ?? self::$default_tokens['accent_color'],
            'font_family' => $settings['font_family'] ?? self::$default_tokens['font_family'],
            'border_radius' => $settings['border_radius'] ?? self::$default_tokens['border_radius'],
            'api_config' => array(
                'stripe_publishable_key' => $settings['stripe_publishable_key'] ?? ''
            )
        );
    }

    /**
     * Fetch brand tokens from Heiwa House API
     *
     * @param string $brand_id Brand identifier
     * @return array|false Brand tokens or false on failure
     */
    private static function fetch_brand_tokens_from_api($brand_id) {
        $settings = get_option('heiwa_booking_settings', array());

        if (empty($settings['api_endpoint']) || empty($settings['api_key'])) {
            return false;
        }

        $api_url = rtrim($settings['api_endpoint'], '/') . '/brands/' . urlencode($brand_id) . '/tokens';

        $response = wp_remote_get($api_url, array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $settings['api_key'],
                'Content-Type' => 'application/json',
                'User-Agent' => 'HeiwaBookingWidget/' . HEIWA_BOOKING_VERSION . ' (WordPress)',
            ),
            'timeout' => 15,
        ));

        if (is_wp_error($response)) {
            Heiwa_Booking_Security::log_security_event('brand_api_error', array(
                'brand_id' => $brand_id,
                'error' => $response->get_error_message()
            ));
            return false;
        }

        $response_code = wp_remote_retrieve_response_code($response);
        $response_body = wp_remote_retrieve_body($response);

        if ($response_code !== 200) {
            Heiwa_Booking_Security::log_security_event('brand_api_error', array(
                'brand_id' => $brand_id,
                'response_code' => $response_code,
                'response_body' => $response_body
            ));
            return false;
        }

        $tokens = json_decode($response_body, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($tokens)) {
            Heiwa_Booking_Security::log_security_event('brand_api_error', array(
                'brand_id' => $brand_id,
                'error' => 'Invalid JSON response'
            ));
            return false;
        }

        // Validate and sanitize the tokens
        return self::validate_brand_tokens($tokens);
    }

    /**
     * Validate and sanitize brand tokens from API
     *
     * @param array $tokens Raw tokens from API
     * @return array Validated tokens
     */
    private static function validate_brand_tokens($tokens) {
        $validated = array();

        // Validate colors
        if (isset($tokens['primary_color'])) {
            $validated['primary_color'] = Heiwa_Booking_Sanitization::sanitize_color($tokens['primary_color']) ?: self::$default_tokens['primary_color'];
        }

        if (isset($tokens['secondary_color'])) {
            $validated['secondary_color'] = Heiwa_Booking_Sanitization::sanitize_color($tokens['secondary_color']) ?: self::$default_tokens['secondary_color'];
        }

        if (isset($tokens['accent_color'])) {
            $validated['accent_color'] = Heiwa_Booking_Sanitization::sanitize_color($tokens['accent_color']) ?: self::$default_tokens['accent_color'];
        }

        // Validate font family
        if (isset($tokens['font_family'])) {
            $validated['font_family'] = Heiwa_Booking_Sanitization::sanitize_font_family($tokens['font_family']) ?: self::$default_tokens['font_family'];
        }

        // Validate border radius
        if (isset($tokens['border_radius'])) {
            $validated['border_radius'] = Heiwa_Booking_Sanitization::sanitize_border_radius($tokens['border_radius']) ?: self::$default_tokens['border_radius'];
        }

        // Validate API config
        if (isset($tokens['api_config']) && is_array($tokens['api_config'])) {
            $validated['api_config'] = Heiwa_Booking_Sanitization::sanitize_api_config($tokens['api_config']);
        }

        return $validated;
    }

    /**
     * Generate CSS variables from brand tokens
     *
     * @param array $tokens Brand tokens
     * @return string CSS custom properties
     */
    public static function generate_css_variables($tokens) {
        $css = ":root {\n";

        if (isset($tokens['primary_color'])) {
            $css .= "  --heiwa-primary-color: {$tokens['primary_color']};\n";
        }

        if (isset($tokens['secondary_color'])) {
            $css .= "  --heiwa-secondary-color: {$tokens['secondary_color']};\n";
        }

        if (isset($tokens['accent_color'])) {
            $css .= "  --heiwa-accent-color: {$tokens['accent_color']};\n";
        }

        if (isset($tokens['font_family'])) {
            $css .= "  --heiwa-font-family: {$tokens['font_family']};\n";
        }

        if (isset($tokens['border_radius'])) {
            $css .= "  --heiwa-border-radius: {$tokens['border_radius']};\n";
        }

        $css .= "}\n";

        return $css;
    }

    /**
     * Generate brand-specific CSS
     *
     * @param array $tokens Brand tokens
     * @return string Brand CSS
     */
    public static function generate_brand_css($tokens) {
        $css = '';

        // Button styles
        if (isset($tokens['primary_color'])) {
            $css .= ".heiwa-booking-widget .heiwa-button-primary {\n";
            $css .= "  background-color: {$tokens['primary_color']};\n";
            $css .= "  border-color: {$tokens['primary_color']};\n";
            $css .= "}\n\n";

            $css .= ".heiwa-booking-widget .heiwa-button-primary:hover {\n";
            $css .= "  background-color: " . self::adjust_color_brightness($tokens['primary_color'], -20) . ";\n";
            $css .= "  border-color: " . self::adjust_color_brightness($tokens['primary_color'], -20) . ";\n";
            $css .= "}\n\n";
        }

        // Font family
        if (isset($tokens['font_family'])) {
            $css .= ".heiwa-booking-widget {\n";
            $css .= "  font-family: {$tokens['font_family']};\n";
            $css .= "}\n\n";
        }

        // Border radius
        if (isset($tokens['border_radius'])) {
            $css .= ".heiwa-booking-widget .heiwa-button,\n";
            $css .= ".heiwa-booking-widget .heiwa-input,\n";
            $css .= ".heiwa-booking-widget .heiwa-select {\n";
            $css .= "  border-radius: {$tokens['border_radius']};\n";
            $css .= "}\n\n";
        }

        // Accent colors for links and highlights
        if (isset($tokens['accent_color'])) {
            $css .= ".heiwa-booking-widget .heiwa-link {\n";
            $css .= "  color: {$tokens['accent_color']};\n";
            $css .= "}\n\n";

            $css .= ".heiwa-booking-widget .heiwa-highlight {\n";
            $css .= "  background-color: " . self::hex_to_rgba($tokens['accent_color'], 0.1) . ";\n";
            $css .= "  border-left-color: {$tokens['accent_color']};\n";
            $css .= "}\n\n";
        }

        return $css;
    }

    /**
     * Enqueue brand-specific styles
     */
    public static function enqueue_brand_styles() {
        $settings = get_option('heiwa_booking_settings', array());

        // Only load if widget is configured
        if (empty($settings['api_endpoint']) || empty($settings['api_key'])) {
            return;
        }

        $brand_id = $settings['brand_id'] ?? null;
        $tokens = self::get_brand_tokens($brand_id);

        // Add CSS variables
        $css_variables = self::generate_css_variables($tokens);
        wp_add_inline_style('heiwa-booking-utilities', $css_variables);

        // Add brand-specific CSS
        $brand_css = self::generate_brand_css($tokens);
        if (!empty($brand_css)) {
            wp_add_inline_style('heiwa-booking-utilities', $brand_css);
        }

        // Load Google Fonts if needed
        self::enqueue_brand_fonts($tokens);
    }

    /**
     * Enqueue brand-specific fonts
     *
     * @param array $tokens Brand tokens
     */
    private static function enqueue_brand_fonts($tokens) {
        if (!isset($tokens['font_family'])) {
            return;
        }

        $font_family = $tokens['font_family'];

        // Map common font families to Google Fonts
        $google_fonts_map = array(
            'Inter, sans-serif' => 'Inter:wght@400;500;600;700',
            'Roboto, sans-serif' => 'Roboto:wght@400;500;700',
            'Open Sans, sans-serif' => 'Open+Sans:wght@400;600;700',
            'Lato, sans-serif' => 'Lato:wght@400;700',
        );

        if (isset($google_fonts_map[$font_family])) {
            wp_enqueue_style(
                'heiwa-google-fonts',
                'https://fonts.googleapis.com/css2?family=' . urlencode($google_fonts_map[$font_family]) . '&display=swap',
                array(),
                null
            );
        }
    }

    /**
     * Enqueue admin brand styles
     *
     * @param string $hook Current admin page hook
     */
    public static function enqueue_admin_brand_styles($hook) {
        if ($hook !== 'toplevel_page_heiwa-booking-widget') {
            return;
        }

        $settings = get_option('heiwa_booking_settings', array());
        $brand_id = $settings['brand_id'] ?? null;
        $tokens = self::get_brand_tokens($brand_id);

        // Add CSS variables for admin preview
        $css_variables = self::generate_css_variables($tokens);
        wp_add_inline_style('heiwa-admin-settings', $css_variables);
    }

    /**
     * AJAX handler to refresh brand tokens
     */
    public static function ajax_refresh_brand_tokens() {
        // Verify nonce and capabilities
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_admin_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'heiwa-booking-widget')));
        }

        if (!Heiwa_Booking_Permissions::can_edit_settings(get_current_user_id())) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'heiwa-booking-widget')));
        }

        $brand_id = sanitize_text_field($_POST['brand_id'] ?? '');

        if (empty($brand_id)) {
            wp_send_json_error(array('message' => __('Brand ID is required', 'heiwa-booking-widget')));
        }

        // Clear cache for this brand
        $cache_key = self::BRAND_CACHE_KEY . '_' . $brand_id;
        delete_transient($cache_key);

        // Fetch fresh tokens
        $tokens = self::fetch_brand_tokens_from_api($brand_id);

        if ($tokens === false) {
            wp_send_json_error(array('message' => __('Failed to refresh brand tokens', 'heiwa-booking-widget')));
        }

        wp_send_json_success(array(
            'message' => __('Brand tokens refreshed successfully', 'heiwa-booking-widget'),
            'tokens' => $tokens
        ));
    }

    /**
     * AJAX handler for theme preview
     */
    public static function ajax_preview_brand_theme() {
        // Verify nonce and capabilities
        if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_booking_admin_nonce')) {
            wp_send_json_error(array('message' => __('Security check failed', 'heiwa-booking-widget')));
        }

        $preview_tokens = json_decode(stripslashes($_POST['tokens'] ?? '{}'), true);

        if (!is_array($preview_tokens)) {
            wp_send_json_error(array('message' => __('Invalid preview data', 'heiwa-booking-widget')));
        }

        // Validate and generate preview CSS
        $validated_tokens = self::validate_brand_tokens($preview_tokens);
        $css_variables = self::generate_css_variables($validated_tokens);
        $brand_css = self::generate_brand_css($validated_tokens);

        wp_send_json_success(array(
            'css_variables' => $css_variables,
            'brand_css' => $brand_css,
            'tokens' => $validated_tokens
        ));
    }

    /**
     * Clear brand token cache
     *
     * @param string $brand_id Optional brand ID, clears all if not specified
     */
    public static function clear_brand_cache($brand_id = null) {
        if ($brand_id) {
            $cache_key = self::BRAND_CACHE_KEY . '_' . $brand_id;
            delete_transient($cache_key);
        } else {
            // Clear all brand caches (would need a more sophisticated approach in production)
            global $wpdb;
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_' . self::BRAND_CACHE_KEY . '_%'
            ));
        }
    }

    /**
     * Utility function to adjust color brightness
     *
     * @param string $hex Hex color
     * @param int $steps Brightness adjustment (-255 to 255)
     * @return string Adjusted hex color
     */
    private static function adjust_color_brightness($hex, $steps) {
        // Remove # if present
        $hex = ltrim($hex, '#');

        // Convert to RGB
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        // Adjust brightness
        $r = max(0, min(255, $r + $steps));
        $g = max(0, min(255, $g + $steps));
        $b = max(0, min(255, $b + $steps));

        // Convert back to hex
        return '#' . str_pad(dechex($r), 2, '0', STR_PAD_LEFT) .
               str_pad(dechex($g), 2, '0', STR_PAD_LEFT) .
               str_pad(dechex($b), 2, '0', STR_PAD_LEFT);
    }

    /**
     * Convert hex color to RGBA
     *
     * @param string $hex Hex color
     * @param float $alpha Alpha value (0-1)
     * @return string RGBA color
     */
    private static function hex_to_rgba($hex, $alpha = 1) {
        $hex = ltrim($hex, '#');

        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        return "rgba({$r}, {$g}, {$b}, {$alpha})";
    }

    /**
     * Get theme preview HTML
     *
     * @param array $tokens Brand tokens
     * @return string Preview HTML
     */
    public static function get_theme_preview_html($tokens) {
        ob_start();
        ?>
        <div class="heiwa-theme-preview" style="
            --heiwa-primary-color: <?php echo esc_attr($tokens['primary_color'] ?? self::$default_tokens['primary_color']); ?>;
            --heiwa-secondary-color: <?php echo esc_attr($tokens['secondary_color'] ?? self::$default_tokens['secondary_color']); ?>;
            --heiwa-accent-color: <?php echo esc_attr($tokens['accent_color'] ?? self::$default_tokens['accent_color']); ?>;
            --heiwa-font-family: <?php echo esc_attr($tokens['font_family'] ?? self::$default_tokens['font_family']); ?>;
            --heiwa-border-radius: <?php echo esc_attr($tokens['border_radius'] ?? self::$default_tokens['border_radius']); ?>;
        ">
            <div class="preview-header" style="
                background: linear-gradient(135deg, var(--heiwa-primary-color), var(--heiwa-secondary-color));
                font-family: var(--heiwa-font-family);
            ">
                <span style="color: white;"><?php _e('Book Your Surf Camp', 'heiwa-booking-widget'); ?></span>
            </div>
            <div class="preview-content">
                <button class="preview-button button-primary" style="
                    background-color: var(--heiwa-primary-color);
                    border-radius: var(--heiwa-border-radius);
                    font-family: var(--heiwa-font-family);
                ">
                    <?php _e('Book Now', 'heiwa-booking-widget'); ?>
                </button>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Initialize theming system
Heiwa_Booking_Theming::init();
