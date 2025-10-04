<?php
/**
 * Internationalization (i18n) Functions for Heiwa Booking Widget
 *
 * Loads translation files and provides helper functions for multilingual support.
 * Handles EN/ES translations with fallback to English for missing translations.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Internationalization class for handling translations
 */
class Heiwa_Booking_I18n {

    /**
     * Text domain for the plugin
     */
    const TEXT_DOMAIN = 'heiwa-booking-widget';

    /**
     * Supported locales
     */
    const SUPPORTED_LOCALES = array(
        'en_US' => 'English',
        'es_ES' => 'Español',
    );

    /**
     * Current locale
     */
    private static $current_locale = 'en_US';

    /**
     * Initialize internationalization
     */
    public static function init() {
        // Load plugin text domain
        add_action('plugins_loaded', array(__CLASS__, 'load_text_domain'));

        // Set current locale
        add_action('plugins_loaded', array(__CLASS__, 'set_current_locale'), 5);

        // Handle locale switching for admin
        add_action('admin_init', array(__CLASS__, 'handle_admin_locale_switch'));

        // Add language selector to admin bar
        add_action('admin_bar_menu', array(__CLASS__, 'add_admin_language_selector'), 100);

        // Filter gettext for custom translations
        add_filter('gettext', array(__CLASS__, 'custom_gettext_filter'), 10, 3);
        add_filter('gettext_with_context', array(__CLASS__, 'custom_gettext_with_context_filter'), 10, 4);

        // Load frontend translations
        add_action('wp_enqueue_scripts', array(__CLASS__, 'load_frontend_translations'));

        // AJAX locale handling
        add_action('wp_ajax_heiwa_set_locale', array(__CLASS__, 'ajax_set_locale'));
        add_action('wp_ajax_nopriv_heiwa_set_locale', array(__CLASS__, 'ajax_set_locale'));
    }

    /**
     * Load plugin text domain
     */
    public static function load_text_domain() {
        $plugin_dir = dirname(dirname(__FILE__));
        $languages_dir = $plugin_dir . '/languages';

        // Load text domain
        load_plugin_textdomain(
            self::TEXT_DOMAIN,
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );

        // Ensure text domain is loaded
        if (!is_textdomain_loaded(self::TEXT_DOMAIN)) {
            // Manual loading as fallback
            $locale = self::get_current_locale();
            $mo_file = $languages_dir . '/' . self::TEXT_DOMAIN . '-' . $locale . '.mo';

            if (file_exists($mo_file)) {
                load_textdomain(self::TEXT_DOMAIN, $mo_file);
            }
        }
    }

    /**
     * Set current locale
     */
    public static function set_current_locale() {
        $locale = self::get_current_locale();
        self::$current_locale = $locale;

        // Set WordPress locale if different
        if ($locale !== get_locale()) {
            switch_to_locale($locale);
        }
    }

    /**
     * Get current locale with fallback
     *
     * @return string Current locale
     */
    public static function get_current_locale() {
        // Check URL parameter first (for testing)
        if (isset($_GET['heiwa_locale']) && array_key_exists($_GET['heiwa_locale'], self::SUPPORTED_LOCALES)) {
            return sanitize_text_field($_GET['heiwa_locale']);
        }

        // Check user preference
        $user_id = get_current_user_id();
        if ($user_id) {
            $user_locale = get_user_meta($user_id, 'heiwa_locale', true);
            if ($user_locale && array_key_exists($user_locale, self::SUPPORTED_LOCALES)) {
                return $user_locale;
            }
        }

        // Check session
        if (isset($_SESSION['heiwa_locale']) && array_key_exists($_SESSION['heiwa_locale'], self::SUPPORTED_LOCALES)) {
            return $_SESSION['heiwa_locale'];
        }

        // Check cookie
        if (isset($_COOKIE['heiwa_locale']) && array_key_exists($_COOKIE['heiwa_locale'], self::SUPPORTED_LOCALES)) {
            return $_COOKIE['heiwa_locale'];
        }

        // Use site locale or default to English
        $site_locale = get_locale();
        return array_key_exists($site_locale, self::SUPPORTED_LOCALES) ? $site_locale : 'en_US';
    }

    /**
     * Handle admin locale switching
     */
    public static function handle_admin_locale_switch() {
        if (isset($_POST['heiwa_locale']) && wp_verify_nonce($_POST['heiwa_locale_nonce'] ?? '', 'heiwa_locale_switch')) {
            $locale = sanitize_text_field($_POST['heiwa_locale']);

            if (array_key_exists($locale, self::SUPPORTED_LOCALES)) {
                $user_id = get_current_user_id();
                if ($user_id) {
                    update_user_meta($user_id, 'heiwa_locale', $locale);
                }

                // Set cookie for 30 days
                setcookie('heiwa_locale', $locale, time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN);

                // Redirect back to current page
                wp_safe_redirect(remove_query_arg(array('heiwa_locale_nonce', 'heiwa_locale')));
                exit;
            }
        }
    }

    /**
     * Add language selector to admin bar
     *
     * @param WP_Admin_Bar $wp_admin_bar Admin bar object
     */
    public static function add_admin_language_selector($wp_admin_bar) {
        if (!current_user_can('manage_options')) {
            return;
        }

        $current_locale = self::get_current_locale();
        $current_name = self::SUPPORTED_LOCALES[$current_locale] ?? 'English';

        $wp_admin_bar->add_node(array(
            'id' => 'heiwa-language-selector',
            'title' => '<span class="ab-icon dashicons dashicons-translation"></span> ' . esc_html($current_name),
            'href' => '#',
            'meta' => array(
                'class' => 'heiwa-language-selector',
            ),
        ));

        foreach (self::SUPPORTED_LOCALES as $locale => $name) {
            if ($locale === $current_locale) {
                continue;
            }

            $wp_admin_bar->add_node(array(
                'parent' => 'heiwa-language-selector',
                'id' => 'heiwa-locale-' . $locale,
                'title' => esc_html($name),
                'href' => wp_nonce_url(
                    add_query_arg(array('heiwa_locale' => $locale), admin_url('admin.php?page=heiwa-booking-widget')),
                    'heiwa_locale_switch',
                    'heiwa_locale_nonce'
                ),
                'meta' => array(
                    'class' => 'heiwa-locale-option',
                ),
            ));
        }
    }

    /**
     * Custom gettext filter for enhanced translations
     *
     * @param string $translation Translated text
     * @param string $text Original text
     * @param string $domain Text domain
     * @return string Filtered translation
     */
    public static function custom_gettext_filter($translation, $text, $domain) {
        if ($domain !== self::TEXT_DOMAIN) {
            return $translation;
        }

        // Apply custom translation logic if needed
        return self::apply_translation_filters($translation, $text);
    }

    /**
     * Custom gettext with context filter
     *
     * @param string $translation Translated text
     * @param string $text Original text
     * @param string $context Context
     * @param string $domain Text domain
     * @return string Filtered translation
     */
    public static function custom_gettext_with_context_filter($translation, $text, $context, $domain) {
        if ($domain !== self::TEXT_DOMAIN) {
            return $translation;
        }

        // Apply context-specific translation logic
        return self::apply_translation_filters($translation, $text, $context);
    }

    /**
     * Apply custom translation filters
     *
     * @param string $translation Translated text
     * @param string $text Original text
     * @param string $context Optional context
     * @return string Filtered translation
     */
    private static function apply_translation_filters($translation, $text, $context = '') {
        // Dynamic content replacement (e.g., dates, currencies)
        $translation = self::apply_dynamic_replacements($translation);

        // Cultural adaptations
        $translation = self::apply_cultural_adaptations($translation, $context);

        return $translation;
    }

    /**
     * Apply dynamic content replacements
     *
     * @param string $text Text to process
     * @return string Processed text
     */
    private static function apply_dynamic_replacements($text) {
        $locale = self::get_current_locale();

        // Date format replacements
        if ($locale === 'es_ES') {
            // Convert MM/DD/YYYY to DD/MM/YYYY in Spanish contexts
            $text = preg_replace('/(\d{1,2})\/(\d{1,2})\/(\d{4})/', '$2/$1/$3', $text);
        }

        // Currency formatting
        $text = self::format_currency_in_text($text, $locale);

        return $text;
    }

    /**
     * Apply cultural adaptations
     *
     * @param string $text Text to process
     * @param string $context Context
     * @return string Adapted text
     */
    private static function apply_cultural_adaptations($text, $context) {
        $locale = self::get_current_locale();

        if ($locale === 'es_ES') {
            // Formal vs informal language adjustments
            if ($context === 'customer_service') {
                // Use more formal language for customer service
                $text = self::apply_formal_spanish($text);
            }

            // Time expressions
            $text = str_replace('this week', 'esta semana', $text);
            $text = str_replace('next week', 'la próxima semana', $text);
        }

        return $text;
    }

    /**
     * Apply formal Spanish adaptations
     *
     * @param string $text Text to process
     * @return string Formal Spanish text
     */
    private static function apply_formal_spanish($text) {
        // Convert informal constructions to formal where appropriate
        $replacements = array(
            'tu' => 'usted',
            'tú' => 'usted',
            'te' => 'le',
            'tu cuenta' => 'su cuenta',
            'tus datos' => 'sus datos',
        );

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }

    /**
     * Format currency in text
     *
     * @param string $text Text containing currency
     * @param string $locale Locale
     * @return string Formatted text
     */
    private static function format_currency_in_text($text, $locale) {
        // Handle currency symbols placement
        if ($locale === 'es_ES') {
            // In Spanish, currency often comes after the amount
            $text = preg_replace('/\$(\d+)/', '$1€', $text);
        }

        return $text;
    }

    /**
     * Load frontend translations
     */
    public static function load_frontend_translations() {
        $locale = self::get_current_locale();

        // Get translation strings for JavaScript
        $js_translations = self::get_javascript_translations($locale);

        wp_localize_script('heiwa-api-client', 'heiwaTranslations', $js_translations);

        // Add language attribute to HTML
        add_filter('language_attributes', array(__CLASS__, 'add_language_attributes'));
    }

    /**
     * Add language attributes to HTML
     *
     * @param string $output Language attributes
     * @return string Modified language attributes
     */
    public static function add_language_attributes($output) {
        $locale = self::get_current_locale();

        if ($locale === 'es_ES') {
            $output .= ' lang="es-ES"';
        } else {
            $output .= ' lang="en-US"';
        }

        return $output;
    }

    /**
     * Get JavaScript translations
     *
     * @param string $locale Locale
     * @return array JavaScript translations
     */
    private static function get_javascript_translations($locale) {
        $translations = array(
            // Booking widget strings
            'bookYourSurfCamp' => __('Book Your Surf Camp', self::TEXT_DOMAIN),
            'searchForAvailableCamps' => __('Search for available camps', self::TEXT_DOMAIN),
            'selectYourDates' => __('Select your dates', self::TEXT_DOMAIN),
            'chooseYourAccommodation' => __('Choose your accommodation', self::TEXT_DOMAIN),
            'addExtras' => __('Add extras', self::TEXT_DOMAIN),
            'completeYourBooking' => __('Complete your booking', self::TEXT_DOMAIN),

            // Form labels
            'checkInDate' => __('Check-in Date', self::TEXT_DOMAIN),
            'checkOutDate' => __('Check-out Date', self::TEXT_DOMAIN),
            'numberOfGuests' => __('Number of Guests', self::TEXT_DOMAIN),
            'selectDates' => __('Select Dates', self::TEXT_DOMAIN),
            'chooseAccommodation' => __('Choose Accommodation', self::TEXT_DOMAIN),
            'selectRoom' => __('Select Room', self::TEXT_DOMAIN),
            'addOns' => __('Add-ons', self::TEXT_DOMAIN),
            'totalPrice' => __('Total Price', self::TEXT_DOMAIN),

            // Actions
            'continue' => __('Continue', self::TEXT_DOMAIN),
            'back' => __('Back', self::TEXT_DOMAIN),
            'confirmBooking' => __('Confirm Booking', self::TEXT_DOMAIN),
            'processing' => __('Processing...', self::TEXT_DOMAIN),
            'bookNow' => __('BOOK NOW', self::TEXT_DOMAIN),

            // Status messages
            'bookingConfirmed' => __('Booking Confirmed!', self::TEXT_DOMAIN),
            'thankYouForBooking' => __('Thank you for your booking. You will receive a confirmation email shortly.', self::TEXT_DOMAIN),
            'viewBookingDetails' => __('View Booking Details', self::TEXT_DOMAIN),
            'bookAnother' => __('Book Another', self::TEXT_DOMAIN),

            // Customer information
            'customerInformation' => __('Customer Information', self::TEXT_DOMAIN),
            'firstName' => __('First Name', self::TEXT_DOMAIN),
            'lastName' => __('Last Name', self::TEXT_DOMAIN),
            'emailAddress' => __('Email Address', self::TEXT_DOMAIN),
            'phoneNumber' => __('Phone Number', self::TEXT_DOMAIN),
            'dateOfBirth' => __('Date of Birth', self::TEXT_DOMAIN),
            'emergencyContact' => __('Emergency Contact', self::TEXT_DOMAIN),
            'specialRequests' => __('Special Requests', self::TEXT_DOMAIN),
            'anySpecialRequests' => __('Any special requests or notes for your booking?', self::TEXT_DOMAIN),

            // Payment
            'paymentInformation' => __('Payment Information', self::TEXT_DOMAIN),
            'securePayment' => __('Secure Payment', self::TEXT_DOMAIN),
            'yourPaymentIsSecure' => __('Your payment information is encrypted and secure.', self::TEXT_DOMAIN),
            'total' => __('Total', self::TEXT_DOMAIN),
            'taxesAndFees' => __('Taxes & Fees', self::TEXT_DOMAIN),
            'grandTotal' => __('Grand Total', self::TEXT_DOMAIN),
            'payNow' => __('Pay Now', self::TEXT_DOMAIN),

            // Availability
            'available' => __('Available', self::TEXT_DOMAIN),
            'limitedAvailability' => __('Limited Availability', self::TEXT_DOMAIN),
            'soldOut' => __('Sold Out', self::TEXT_DOMAIN),
            'checkAvailability' => __('Check Availability', self::TEXT_DOMAIN),
            'noRoomsAvailable' => __('No rooms available for selected dates', self::TEXT_DOMAIN),
            'selectDifferentDates' => __('Please select different dates or contact us for alternatives.', self::TEXT_DOMAIN),

            // Error messages
            'loading' => __('Loading...', self::TEXT_DOMAIN),
            'anErrorOccurred' => __('An error occurred', self::TEXT_DOMAIN),
            'networkError' => __('Network error. Please check your connection.', self::TEXT_DOMAIN),
            'tooManyRequests' => __('Too many requests. Please wait a moment.', self::TEXT_DOMAIN),
            'pleaseCheckYourInformation' => __('Please check your information and try again.', self::TEXT_DOMAIN),

            // Recovery suggestions
            'checkYourInternetConnection' => __('Check your internet connection', self::TEXT_DOMAIN),
            'tryRefreshingThePage' => __('Try refreshing the page', self::TEXT_DOMAIN),
            'contactSupportIfProblemPersists' => __('Contact support if the problem persists', self::TEXT_DOMAIN),
            'tryAgainInAFewMoments' => __('Try again in a few moments', self::TEXT_DOMAIN),

            // Date/Time
            'today' => __('Today', self::TEXT_DOMAIN),
            'tomorrow' => __('Tomorrow', self::TEXT_DOMAIN),
            'thisWeek' => __('This Week', self::TEXT_DOMAIN),
            'nextWeek' => __('Next Week', self::TEXT_DOMAIN),
            'thisMonth' => __('This Month', self::TEXT_DOMAIN),
            'nextMonth' => __('Next Month', self::TEXT_DOMAIN),

            // Property types
            'surfCamp' => __('Surf Camp', self::TEXT_DOMAIN),
            'hostel' => __('Hostel', self::TEXT_DOMAIN),
            'hotel' => __('Hotel', self::TEXT_DOMAIN),
            'resort' => __('Resort', self::TEXT_DOMAIN),
            'villa' => __('Villa', self::TEXT_DOMAIN),
            'apartment' => __('Apartment', self::TEXT_DOMAIN),

            // Room types
            'dorm' => __('Dorm', self::TEXT_DOMAIN),
            'privateRoom' => __('Private Room', self::TEXT_DOMAIN),
            'suite' => __('Suite', self::TEXT_DOMAIN),

            // Add-ons
            'airportTransfer' => __('Airport Transfer', self::TEXT_DOMAIN),
            'surfLessons' => __('Surf Lessons', self::TEXT_DOMAIN),
            'equipmentRental' => __('Equipment Rental', self::TEXT_DOMAIN),
            'meals' => __('Meals', self::TEXT_DOMAIN),
            'insurance' => __('Insurance', self::TEXT_DOMAIN),
        );

        return $translations;
    }

    /**
     * AJAX handler for setting locale
     */
    public static function ajax_set_locale() {
        try {
            if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_api_nonce')) {
                throw new Exception(__('Security check failed', 'heiwa-booking-widget'));
            }

            $locale = sanitize_text_field($_POST['locale'] ?? '');

            if (!array_key_exists($locale, self::SUPPORTED_LOCALES)) {
                throw new Exception(__('Invalid locale', 'heiwa-booking-widget'));
            }

            // Set user preference
            $user_id = get_current_user_id();
            if ($user_id) {
                update_user_meta($user_id, 'heiwa_locale', $locale);
            }

            // Set cookie
            setcookie('heiwa_locale', $locale, time() + (30 * DAY_IN_SECONDS), COOKIEPATH, COOKIE_DOMAIN);

            // Set session if available
            if (session_id()) {
                $_SESSION['heiwa_locale'] = $locale;
            }

            wp_send_json_success(array(
                'message' => __('Language updated successfully', self::TEXT_DOMAIN),
                'locale' => $locale,
            ));

        } catch (Exception $e) {
            wp_send_json_error(array(
                'message' => $e->getMessage(),
            ));
        }
    }

    /**
     * Get supported locales
     *
     * @return array Supported locales
     */
    public static function get_supported_locales() {
        return self::SUPPORTED_LOCALES;
    }

    /**
     * Get locale display name
     *
     * @param string $locale Locale code
     * @return string Display name
     */
    public static function get_locale_display_name($locale) {
        return self::SUPPORTED_LOCALES[$locale] ?? $locale;
    }

    /**
     * Check if locale is RTL
     *
     * @param string $locale Locale code
     * @return bool Whether locale is RTL
     */
    public static function is_rtl_locale($locale) {
        $rtl_locales = array('ar', 'he', 'fa', 'ur');
        $language_code = substr($locale, 0, 2);
        return in_array($language_code, $rtl_locales);
    }

    /**
     * Get text direction for locale
     *
     * @param string $locale Locale code
     * @return string 'ltr' or 'rtl'
     */
    public static function get_text_direction($locale = null) {
        if (!$locale) {
            $locale = self::get_current_locale();
        }

        return self::is_rtl_locale($locale) ? 'rtl' : 'ltr';
    }

    /**
     * Translate plural forms
     *
     * @param string $single Singular form
     * @param string $plural Plural form
     * @param int $number Number
     * @param string $domain Text domain
     * @return string Translated string
     */
    public static function translate_plural($single, $plural, $number, $domain = '') {
        if (empty($domain)) {
            $domain = self::TEXT_DOMAIN;
        }

        return _n($single, $plural, $number, $domain);
    }

    /**
     * Format date according to locale
     *
     * @param string $date Date string
     * @param string $format Date format
     * @return string Formatted date
     */
    public static function format_date($date, $format = null) {
        $locale = self::get_current_locale();

        if (!$format) {
            if ($locale === 'es_ES') {
                $format = 'd/m/Y';
            } else {
                $format = 'm/d/Y';
            }
        }

        $timestamp = strtotime($date);
        return date_i18n($format, $timestamp);
    }

    /**
     * Format currency according to locale
     *
     * @param float $amount Amount
     * @param string $currency Currency code
     * @return string Formatted currency
     */
    public static function format_currency($amount, $currency = 'USD') {
        $locale = self::get_current_locale();

        if ($locale === 'es_ES') {
            // Spanish formatting
            return number_format($amount, 2, ',', '.') . ' €';
        } else {
            // English formatting
            return '$' . number_format($amount, 2, '.', ',');
        }
    }

    /**
     * Get translation statistics
     *
     * @return array Translation statistics
     */
    public static function get_translation_stats() {
        $stats = array();

        foreach (self::SUPPORTED_LOCALES as $locale => $name) {
            $mo_file = WP_PLUGIN_DIR . '/heiwa-booking-widget/languages/' . self::TEXT_DOMAIN . '-' . $locale . '.mo';

            if (file_exists($mo_file)) {
                // This is a simplified check - in production you'd parse the MO file
                $stats[$locale] = array(
                    'name' => $name,
                    'status' => 'available',
                    'last_modified' => date('Y-m-d H:i:s', filemtime($mo_file)),
                );
            } else {
                $stats[$locale] = array(
                    'name' => $name,
                    'status' => 'missing',
                    'last_modified' => null,
                );
            }
        }

        return $stats;
    }
}

// Initialize internationalization
Heiwa_Booking_I18n::init();
