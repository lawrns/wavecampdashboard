<?php
/**
 * Error Handling System for Heiwa Booking Widget
 *
 * Comprehensive error handling, logging, user-friendly error messages,
 * and graceful degradation for the WordPress booking plugin.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Error Handling and Logging System
 */
class Heiwa_Booking_Error_Handler {

    /**
     * Error levels
     */
    const ERROR_LEVEL_DEBUG = 'debug';
    const ERROR_LEVEL_INFO = 'info';
    const ERROR_LEVEL_WARNING = 'warning';
    const ERROR_LEVEL_ERROR = 'error';
    const ERROR_LEVEL_CRITICAL = 'critical';

    /**
     * Error codes
     */
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
     * Get user-friendly error messages
     */
    private static function get_user_messages() {
        return array(
            self::ERROR_API_CONNECTION => __('Unable to connect to booking service. Please try again later.', 'heiwa-booking-widget'),
            self::ERROR_API_TIMEOUT => __('Request timed out. Please check your connection and try again.', 'heiwa-booking-widget'),
            self::ERROR_API_INVALID_RESPONSE => __('Received invalid response from server. Please contact support if this persists.', 'heiwa-booking-widget'),
            self::ERROR_VALIDATION_FAILED => __('Please check your information and try again.', 'heiwa-booking-widget'),
            self::ERROR_RATE_LIMITED => __('Too many requests. Please wait a moment before trying again.', 'heiwa-booking-widget'),
            self::ERROR_SECURITY_VIOLATION => __('Security check failed. Please refresh the page and try again.', 'heiwa-booking-widget'),
            self::ERROR_CONFIGURATION => __('Service configuration error. Please contact the website administrator.', 'heiwa-booking-widget'),
            self::ERROR_PERMISSION_DENIED => __('You don\'t have permission to perform this action.', 'heiwa-booking-widget'),
            self::ERROR_BOOKING_CONFLICT => __('Sorry, this booking is no longer available. Please select different dates or options.', 'heiwa-booking-widget'),
            self::ERROR_PAYMENT_FAILED => __('Payment could not be processed. Please check your payment information and try again.', 'heiwa-booking-widget'),
            self::ERROR_UNKNOWN => __('An unexpected error occurred. Please try again or contact support.', 'heiwa-booking-widget'),
        );
    }

    /**
     * Get error recovery suggestions
     */
    private static function get_recovery_suggestions_array() {
        return array(
            self::ERROR_API_CONNECTION => array(
                __('Check your internet connection', 'heiwa-booking-widget'),
                __('Try refreshing the page', 'heiwa-booking-widget'),
                __('Contact support if the problem persists', 'heiwa-booking-widget'),
            ),
            self::ERROR_API_TIMEOUT => array(
                __('Check your internet connection', 'heiwa-booking-widget'),
                __('Try again in a few moments', 'heiwa-booking-widget'),
            ),
            self::ERROR_RATE_LIMITED => array(
                __('Wait 1-2 minutes before trying again', 'heiwa-booking-widget'),
            ),
            self::ERROR_VALIDATION_FAILED => array(
                __('Review the highlighted fields', 'heiwa-booking-widget'),
                __('Ensure all required information is provided', 'heiwa-booking-widget'),
            ),
            self::ERROR_BOOKING_CONFLICT => array(
                __('Try selecting different dates', 'heiwa-booking-widget'),
                __('Check availability for other options', 'heiwa-booking-widget'),
            ),
            self::ERROR_PAYMENT_FAILED => array(
                __('Verify your payment information', 'heiwa-booking-widget'),
                __('Try a different payment method', 'heiwa-booking-widget'),
                __('Contact your bank if issues persist', 'heiwa-booking-widget'),
            ),
        );
    }

    /**
     * Initialize error handling
     */
    public static function init() {
        // Set up error handlers
        set_error_handler(array(__CLASS__, 'handle_php_error'));
        set_exception_handler(array(__CLASS__, 'handle_php_exception'));

        // WordPress error handling
        add_action('wp_die_handler', array(__CLASS__, 'wp_die_handler'));
        add_filter('wp_die_ajax_handler', array(__CLASS__, 'wp_die_ajax_handler'));

        // AJAX error handling
        add_action('wp_ajax_heiwa_handle_error', array(__CLASS__, 'handle_ajax_error'));
        add_action('wp_ajax_nopriv_heiwa_handle_error', array(__CLASS__, 'handle_ajax_error'));

        // Admin notices for errors
        add_action('admin_notices', array(__CLASS__, 'display_admin_errors'));

        // Cleanup old error logs
        add_action('wp_scheduled_delete', array(__CLASS__, 'cleanup_error_logs'));
    }

    /**
     * Handle PHP errors
     *
     * @param int $errno Error number
     * @param string $errstr Error message
     * @param string $errfile Error file
     * @param int $errline Error line
     * @return bool Whether to continue execution
     */
    public static function handle_php_error($errno, $errstr, $errfile, $errline) {
        // Only handle errors that are included in error_reporting
        if (!(error_reporting() & $errno)) {
            return false;
        }

        $error_data = array(
            'type' => 'php_error',
            'errno' => $errno,
            'message' => $errstr,
            'file' => $errfile,
            'line' => $errline,
            'trace' => debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS),
        );

        $level = self::get_error_level_from_code($errno);
        self::log_error($level, 'PHP Error', $error_data);

        // Don't execute PHP's internal error handler for plugin errors
        if (strpos($errfile, 'heiwa-booking-widget') !== false) {
            return true;
        }

        return false;
    }

    /**
     * Handle uncaught exceptions
     *
     * @param Exception $exception The exception
     */
    public static function handle_php_exception($exception) {
        $error_data = array(
            'type' => 'uncaught_exception',
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTrace(),
        );

        self::log_error(self::ERROR_LEVEL_CRITICAL, 'Uncaught Exception', $error_data);

        // Show user-friendly error page
        self::display_fatal_error();
    }

    /**
     * Custom WP die handler
     *
     * @param string $message Error message
     * @param string $title Error title
     * @param array $args Additional arguments
     */
    public static function wp_die_handler($message, $title, $args) {
        // Check if this is a plugin-related error
        if (isset($args['heiwa_error'])) {
            $error_code = $args['heiwa_error'];
            $user_message = self::get_user_friendly_message($error_code);

            // Log the error
            self::log_error(self::ERROR_LEVEL_ERROR, 'WordPress Die', array(
                'message' => $message,
                'title' => $title,
                'error_code' => $error_code,
            ));

            // Display user-friendly error
            wp_die($user_message, $title, $args);
        }

        // Default WordPress die handler
        _default_wp_die_handler($message, $title, $args);
    }

    /**
     * AJAX error handler
     */
    public static function wp_die_ajax_handler() {
        return array(__CLASS__, 'wp_die_ajax_handler_callback');
    }

    /**
     * AJAX die handler callback
     *
     * @param array $args Die arguments
     */
    public static function wp_die_ajax_handler_callback($args) {
        $response = array(
            'success' => false,
            'data' => array(
                'message' => isset($args['heiwa_error'])
                    ? self::get_user_friendly_message($args['heiwa_error'])
                    : __('An error occurred', 'heiwa-booking-widget'),
                'code' => $args['response'] ?? 500,
            ),
        );

        wp_send_json($response);
    }

    /**
     * Handle AJAX error reporting
     */
    public static function handle_ajax_error() {
        try {
            // Verify nonce
            if (!wp_verify_nonce($_POST['nonce'] ?? '', 'heiwa_api_nonce')) {
                wp_send_json_error(array('message' => __('Security check failed', 'heiwa-booking-widget')));
                return;
            }

            $error_data = json_decode(stripslashes($_POST['error'] ?? '{}'), true);

            if (empty($error_data)) {
                wp_send_json_error(array('message' => __('Invalid error data', 'heiwa-booking-widget')));
                return;
            }

            // Log client-side error
            self::log_error(
                self::ERROR_LEVEL_ERROR,
                'Client-side Error',
                array(
                    'error_data' => $error_data,
                    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                    'url' => $_POST['url'] ?? 'unknown',
                )
            );

            wp_send_json_success(array('message' => __('Error logged successfully', 'heiwa-booking-widget')));

        } catch (Exception $e) {
            wp_send_json_error(array('message' => __('Failed to log error', 'heiwa-booking-widget')));
        }
    }

    /**
     * Log an error
     *
     * @param string $level Error level
     * @param string $message Error message
     * @param array $context Additional context
     */
    public static function log_error($level, $message, $context = array()) {
        $settings = get_option('heiwa_booking_settings', array());
        $debug_mode = !empty($settings['debug_mode']);

        // Skip debug level errors unless debug mode is enabled
        if ($level === self::ERROR_LEVEL_DEBUG && !$debug_mode) {
            return;
        }

        $error_entry = array(
            'timestamp' => current_time('timestamp'),
            'level' => $level,
            'message' => $message,
            'context' => $context,
            'user_id' => get_current_user_id(),
            'ip' => Heiwa_Booking_Security::get_client_ip(),
            'url' => $_SERVER['REQUEST_URI'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        );

        // Store in database for admin review
        self::store_error_log($error_entry);

        // WordPress error log
        $log_message = sprintf(
            '[%s] Heiwa Booking Widget: %s - %s',
            strtoupper($level),
            $message,
            wp_json_encode($context)
        );

        error_log($log_message);

        // Send critical errors to admin email if configured
        if ($level === self::ERROR_LEVEL_CRITICAL) {
            self::notify_admin_of_critical_error($error_entry);
        }
    }

    /**
     * Store error log in database
     *
     * @param array $error_entry Error entry
     */
    private static function store_error_log($error_entry) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_error_logs';

        // Create table if it doesn't exist
        self::ensure_error_log_table_exists();

        $wpdb->insert(
            $table_name,
            array(
                'timestamp' => $error_entry['timestamp'],
                'level' => $error_entry['level'],
                'message' => $error_entry['message'],
                'context' => wp_json_encode($error_entry['context']),
                'user_id' => $error_entry['user_id'],
                'ip_address' => $error_entry['ip'],
                'url' => $error_entry['url'],
                'user_agent' => $error_entry['user_agent'],
            ),
            array('%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s')
        );
    }

    /**
     * Ensure error log table exists
     */
    private static function ensure_error_log_table_exists() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_error_logs';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table_name'") != $table_name) {
            $charset_collate = $wpdb->get_charset_collate();

            $sql = "CREATE TABLE $table_name (
                id mediumint(9) NOT NULL AUTO_INCREMENT,
                timestamp bigint(20) NOT NULL,
                level varchar(20) NOT NULL,
                message text NOT NULL,
                context longtext,
                user_id bigint(20) UNSIGNED DEFAULT 0,
                ip_address varchar(45) DEFAULT '',
                url text,
                user_agent text,
                PRIMARY KEY (id),
                KEY timestamp (timestamp),
                KEY level (level),
                KEY user_id (user_id)
            ) $charset_collate;";

            require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
            dbDelta($sql);
        }
    }

    /**
     * Display admin error notices
     */
    public static function display_admin_errors() {
        // Only show to administrators
        if (!current_user_can('manage_options')) {
            return;
        }

        $recent_errors = self::get_recent_errors(3);

        if (!empty($recent_errors)) {
            foreach ($recent_errors as $error) {
                $class = $error->level === self::ERROR_LEVEL_CRITICAL ? 'error' : 'warning';
                printf(
                    '<div class="notice notice-%s is-dismissible"><p><strong>%s:</strong> %s</p></div>',
                    $class,
                    __('Heiwa Booking Widget Error', 'heiwa-booking-widget'),
                    esc_html($error->message)
                );
            }
        }
    }

    /**
     * Get recent errors
     *
     * @param int $limit Number of errors to retrieve
     * @return array Recent errors
     */
    public static function get_recent_errors($limit = 10) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_error_logs';

        return $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name WHERE level IN ('error', 'critical') ORDER BY timestamp DESC LIMIT %d",
            $limit
        ));
    }

    /**
     * Cleanup old error logs
     */
    public static function cleanup_error_logs() {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_error_logs';
        $thirty_days_ago = current_time('timestamp') - (30 * DAY_IN_SECONDS);

        $wpdb->query($wpdb->prepare(
            "DELETE FROM $table_name WHERE timestamp < %d",
            $thirty_days_ago
        ));
    }

    /**
     * Notify admin of critical errors
     *
     * @param array $error_entry Error entry
     */
    private static function notify_admin_of_critical_error($error_entry) {
        $admin_email = get_option('admin_email');

        if (!$admin_email) {
            return;
        }

        $subject = __('Critical Error in Heiwa Booking Widget', 'heiwa-booking-widget');

        $message = sprintf(
            __("A critical error occurred in the Heiwa Booking Widget:\n\nError: %s\n\nContext: %s\n\nTime: %s\n\nPlease check the error logs for more details.", 'heiwa-booking-widget'),
            $error_entry['message'],
            wp_json_encode($error_entry['context'], JSON_PRETTY_PRINT),
            date('Y-m-d H:i:s', $error_entry['timestamp'])
        );

        wp_mail($admin_email, $subject, $message);
    }

    /**
     * Create user-friendly error response
     *
     * @param string $error_code Error code
     * @param array $context Additional context
     * @return array Error response
     */
    public static function create_error_response($error_code, $context = array()) {
        return array(
            'success' => false,
            'error' => array(
                'code' => $error_code,
                'message' => self::get_user_friendly_message($error_code),
                'suggestions' => self::get_recovery_suggestions($error_code),
                'context' => $context,
            ),
        );
    }

    /**
     * Get user-friendly error message
     *
     * @param string $error_code Error code
     * @return string User-friendly message
     */
    public static function get_user_friendly_message($error_code) {
        $messages = self::get_user_messages();
        return $messages[$error_code] ?? $messages[self::ERROR_UNKNOWN];
    }

    /**
     * Get recovery suggestions for error
     *
     * @param string $error_code Error code
     * @return array Recovery suggestions
     */
    public static function get_recovery_suggestions($error_code) {
        $suggestions = self::get_recovery_suggestions_array();
        return $suggestions[$error_code] ?? array();
    }

    /**
     * Display fatal error page
     */
    private static function display_fatal_error() {
        if (!headers_sent()) {
            header('HTTP/1.1 500 Internal Server Error');
            header('Content-Type: text/html; charset=utf-8');
        }

        $error_page = self::get_error_page_html();
        echo $error_page;
        exit;
    }

    /**
     * Get error page HTML
     *
     * @return string Error page HTML
     */
    private static function get_error_page_html() {
        ob_start();
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title><?php _e('Service Unavailable', 'heiwa-booking-widget'); ?> - <?php bloginfo('name'); ?></title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
                .error-container { max-width: 600px; margin: 50px auto; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .error-icon { text-align: center; font-size: 48px; color: #dc3232; margin-bottom: 20px; }
                .error-title { text-align: center; margin-bottom: 20px; color: #23282d; }
                .error-message { margin-bottom: 30px; line-height: 1.6; }
                .error-actions { text-align: center; }
                .error-actions a { display: inline-block; margin: 0 10px; padding: 10px 20px; background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
                .error-actions a:hover { background: #005a87; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-icon">⚠️</div>
                <h1 class="error-title"><?php _e('Service Temporarily Unavailable', 'heiwa-booking-widget'); ?></h1>
                <div class="error-message">
                    <p><?php _e('We\'re experiencing technical difficulties with our booking system. This is usually temporary and we\'re working to resolve it.', 'heiwa-booking-widget'); ?></p>
                    <p><?php _e('Please try again in a few minutes. If the problem persists, contact us for assistance.', 'heiwa-booking-widget'); ?></p>
                </div>
                <div class="error-actions">
                    <a href="<?php echo home_url(); ?>"><?php _e('Go to Homepage', 'heiwa-booking-widget'); ?></a>
                    <a href="javascript:history.back()"><?php _e('Go Back', 'heiwa-booking-widget'); ?></a>
                </div>
            </div>
        </body>
        </html>
        <?php
        return ob_get_clean();
    }

    /**
     * Convert PHP error code to error level
     *
     * @param int $errno PHP error code
     * @return string Error level
     */
    private static function get_error_level_from_code($errno) {
        switch ($errno) {
            case E_ERROR:
            case E_PARSE:
            case E_CORE_ERROR:
            case E_COMPILE_ERROR:
            case E_USER_ERROR:
                return self::ERROR_LEVEL_CRITICAL;

            case E_WARNING:
            case E_CORE_WARNING:
            case E_COMPILE_WARNING:
            case E_USER_WARNING:
                return self::ERROR_LEVEL_WARNING;

            case E_NOTICE:
            case E_USER_NOTICE:
            case E_STRICT:
            case E_DEPRECATED:
            case E_USER_DEPRECATED:
                return self::ERROR_LEVEL_INFO;

            default:
                return self::ERROR_LEVEL_ERROR;
        }
    }

    /**
     * Get error statistics
     *
     * @param int $days Number of days to look back
     * @return array Error statistics
     */
    public static function get_error_statistics($days = 7) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_error_logs';
        $since = current_time('timestamp') - ($days * DAY_IN_SECONDS);

        $stats = $wpdb->get_results($wpdb->prepare(
            "SELECT level, COUNT(*) as count FROM $table_name WHERE timestamp > %d GROUP BY level",
            $since
        ), OBJECT_K);

        return array(
            'debug' => $stats['debug']->count ?? 0,
            'info' => $stats['info']->count ?? 0,
            'warning' => $stats['warning']->count ?? 0,
            'error' => $stats['error']->count ?? 0,
            'critical' => $stats['critical']->count ?? 0,
            'total' => array_sum(array_column($stats, 'count')),
        );
    }
}

// Initialize error handling
Heiwa_Booking_Error_Handler::init();
