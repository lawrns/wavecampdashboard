<?php
/**
 * Permission and Capability Management for Heiwa Booking Widget
 *
 * Manages user capabilities, roles, and access control for the booking system.
 * Provides fine-grained permission checks for different operations.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Permission management class
 */
class Heiwa_Booking_Permissions {

    /**
     * Custom capabilities
     */
    const CAP_MANAGE_BOOKINGS = 'manage_heiwa_bookings';
    const CAP_VIEW_BOOKINGS = 'view_heiwa_bookings';
    const CAP_EDIT_SETTINGS = 'edit_heiwa_settings';
    const CAP_VIEW_ANALYTICS = 'view_heiwa_analytics';

    /**
     * Initialize permissions
     */
    public static function init() {
        // Add custom capabilities to roles
        add_action('admin_init', array(__CLASS__, 'add_capabilities'));

        // Filter user capabilities
        add_filter('user_has_cap', array(__CLASS__, 'filter_capabilities'), 10, 4);

        // Register custom roles if needed
        add_action('init', array(__CLASS__, 'register_custom_roles'));
    }

    /**
     * Add custom capabilities to existing roles
     */
    public static function add_capabilities() {
        // Administrator gets all capabilities
        $admin_role = get_role('administrator');
        if ($admin_role) {
            $admin_role->add_cap(self::CAP_MANAGE_BOOKINGS);
            $admin_role->add_cap(self::CAP_VIEW_BOOKINGS);
            $admin_role->add_cap(self::CAP_EDIT_SETTINGS);
            $admin_role->add_cap(self::CAP_VIEW_ANALYTICS);
        }

        // Editor gets booking management capabilities
        $editor_role = get_role('editor');
        if ($editor_role) {
            $editor_role->add_cap(self::CAP_MANAGE_BOOKINGS);
            $editor_role->add_cap(self::CAP_VIEW_BOOKINGS);
            $editor_role->add_cap(self::CAP_VIEW_ANALYTICS);
        }

        // Author gets view capabilities
        $author_role = get_role('author');
        if ($author_role) {
            $author_role->add_cap(self::CAP_VIEW_BOOKINGS);
        }
    }

    /**
     * Filter user capabilities based on context
     *
     * @param array $allcaps All capabilities
     * @param array $caps Required capabilities
     * @param array $args Additional arguments
     * @param WP_User $user User object
     * @return array Filtered capabilities
     */
    public static function filter_capabilities($allcaps, $caps, $args, $user) {
        // Allow administrators to do everything
        if (isset($allcaps['manage_options'])) {
            return $allcaps;
        }

        // Custom capability filtering logic
        foreach ($caps as $cap) {
            switch ($cap) {
                case self::CAP_MANAGE_BOOKINGS:
                    // Only allow if user is not blocked
                    if (self::is_user_blocked($user->ID)) {
                        unset($allcaps[$cap]);
                    }
                    break;

                case self::CAP_VIEW_BOOKINGS:
                    // Allow if user can manage bookings or has specific access
                    if (!isset($allcaps[self::CAP_MANAGE_BOOKINGS]) && !self::can_view_bookings($user->ID)) {
                        unset($allcaps[$cap]);
                    }
                    break;

                case self::CAP_EDIT_SETTINGS:
                    // Restrict settings access based on user role and site settings
                    if (!self::can_edit_settings($user->ID)) {
                        unset($allcaps[$cap]);
                    }
                    break;

                case self::CAP_VIEW_ANALYTICS:
                    // Analytics access based on role hierarchy
                    if (!self::can_view_analytics($user->ID)) {
                        unset($allcaps[$cap]);
                    }
                    break;
            }
        }

        return $allcaps;
    }

    /**
     * Register custom roles if needed
     */
    public static function register_custom_roles() {
        // Add booking manager role if it doesn't exist
        if (!get_role('booking_manager')) {
            add_role(
                'booking_manager',
                __('Booking Manager', 'heiwa-booking-widget'),
                array(
                    self::CAP_MANAGE_BOOKINGS => true,
                    self::CAP_VIEW_BOOKINGS => true,
                    self::CAP_VIEW_ANALYTICS => true,
                    'read' => true,
                )
            );
        }

        // Add booking agent role if it doesn't exist
        if (!get_role('booking_agent')) {
            add_role(
                'booking_agent',
                __('Booking Agent', 'heiwa-booking-widget'),
                array(
                    self::CAP_VIEW_BOOKINGS => true,
                    'read' => true,
                )
            );
        }
    }

    /**
     * Check if user can perform booking operations
     *
     * @param int $user_id User ID
     * @param string $operation Operation type
     * @return bool Whether user can perform the operation
     */
    public static function can_manage_bookings($user_id, $operation = 'manage') {
        if (!$user_id) {
            return false;
        }

        // Check basic capability
        if (!user_can($user_id, self::CAP_MANAGE_BOOKINGS)) {
            return false;
        }

        // Check if user is blocked
        if (self::is_user_blocked($user_id)) {
            return false;
        }

        // Operation-specific checks
        switch ($operation) {
            case 'create':
                return self::can_create_bookings($user_id);
            case 'edit':
                return self::can_edit_bookings($user_id);
            case 'delete':
                return self::can_delete_bookings($user_id);
            case 'refund':
                return self::can_process_refunds($user_id);
            default:
                return true;
        }
    }

    /**
     * Check if user can view bookings
     *
     * @param int $user_id User ID
     * @return bool Whether user can view bookings
     */
    public static function can_view_bookings($user_id) {
        if (!$user_id) {
            return false;
        }

        // Check capability
        if (!user_can($user_id, self::CAP_VIEW_BOOKINGS)) {
            return false;
        }

        // Check if user has access to current site
        if (is_multisite() && !is_super_admin($user_id)) {
            $user_sites = get_blogs_of_user($user_id);
            if (!array_key_exists(get_current_blog_id(), $user_sites)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user can edit settings
     *
     * @param int $user_id User ID
     * @return bool Whether user can edit settings
     */
    public static function can_edit_settings($user_id) {
        if (!$user_id) {
            return false;
        }

        // Must have edit_settings capability
        if (!user_can($user_id, self::CAP_EDIT_SETTINGS)) {
            return false;
        }

        // Additional checks for sensitive settings
        $settings = get_option('heiwa_booking_settings', array());

        // If API key is set, only allow administrators to change it
        if (!empty($settings['api_key']) && !user_can($user_id, 'manage_options')) {
            return false;
        }

        return true;
    }

    /**
     * Check if user can view analytics
     *
     * @param int $user_id User ID
     * @return bool Whether user can view analytics
     */
    public static function can_view_analytics($user_id) {
        if (!$user_id) {
            return false;
        }

        return user_can($user_id, self::CAP_VIEW_ANALYTICS);
    }

    /**
     * Check if user can create bookings
     *
     * @param int $user_id User ID
     * @return bool Whether user can create bookings
     */
    public static function can_create_bookings($user_id) {
        if (!self::can_manage_bookings($user_id, 'create')) {
            return false;
        }

        // Check if user has reached booking limit
        $booking_limit = self::get_user_booking_limit($user_id);
        if ($booking_limit > 0) {
            $user_bookings = self::count_user_bookings_today($user_id);
            if ($user_bookings >= $booking_limit) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if user can edit bookings
     *
     * @param int $user_id User ID
     * @return bool Whether user can edit bookings
     */
    public static function can_edit_bookings($user_id) {
        return self::can_manage_bookings($user_id, 'edit');
    }

    /**
     * Check if user can delete bookings
     *
     * @param int $user_id User ID
     * @return bool Whether user can delete bookings
     */
    public static function can_delete_bookings($user_id) {
        // Only administrators can delete bookings
        return user_can($user_id, 'manage_options') && self::can_manage_bookings($user_id, 'delete');
    }

    /**
     * Check if user can process refunds
     *
     * @param int $user_id User ID
     * @return bool Whether user can process refunds
     */
    public static function can_process_refunds($user_id) {
        // Only administrators and booking managers can process refunds
        return user_can($user_id, 'manage_options') ||
               (user_can($user_id, self::CAP_MANAGE_BOOKINGS) && user_can($user_id, 'booking_manager'));
    }

    /**
     * Check if user is blocked
     *
     * @param int $user_id User ID
     * @return bool Whether user is blocked
     */
    public static function is_user_blocked($user_id) {
        // Check user meta for blocked status
        $blocked = get_user_meta($user_id, 'heiwa_booking_blocked', true);
        return (bool) $blocked;
    }

    /**
     * Get user booking limit
     *
     * @param int $user_id User ID
     * @return int Maximum bookings per day (0 = unlimited)
     */
    public static function get_user_booking_limit($user_id) {
        // Check user meta for booking limit
        $limit = get_user_meta($user_id, 'heiwa_booking_limit', true);
        return intval($limit);
    }

    /**
     * Count user bookings today
     *
     * @param int $user_id User ID
     * @return int Number of bookings created today
     */
    public static function count_user_bookings_today($user_id) {
        global $wpdb;

        $table_name = $wpdb->prefix . 'heiwa_booking_logs';
        $today = date('Y-m-d');

        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$table_name}
             WHERE timestamp >= %s
             AND level = 'info'
             AND message LIKE %s",
            $today . ' 00:00:00',
            '%booking created by user ' . $user_id . '%'
        ));

        return intval($count);
    }

    /**
     * Grant temporary access to user
     *
     * @param int $user_id User ID
     * @param string $capability Capability to grant
     * @param int $duration Duration in seconds
     * @return bool Success
     */
    public static function grant_temporary_access($user_id, $capability, $duration = 3600) {
        if (!$user_id || !$capability) {
            return false;
        }

        // Store temporary capability with expiration
        $temp_caps = get_user_meta($user_id, 'heiwa_temp_capabilities', true);
        if (!is_array($temp_caps)) {
            $temp_caps = array();
        }

        $temp_caps[$capability] = time() + $duration;
        update_user_meta($user_id, 'heiwa_temp_capabilities', $temp_caps);

        // Clear user capability cache
        wp_cache_delete($user_id, 'user_capabilities');

        Heiwa_Booking_Security::log_security_event('temporary_access_granted', array(
            'user_id' => $user_id,
            'capability' => $capability,
            'duration' => $duration,
            'expires_at' => date('Y-m-d H:i:s', $temp_caps[$capability])
        ));

        return true;
    }

    /**
     * Revoke temporary access from user
     *
     * @param int $user_id User ID
     * @param string $capability Capability to revoke
     * @return bool Success
     */
    public static function revoke_temporary_access($user_id, $capability) {
        if (!$user_id || !$capability) {
            return false;
        }

        $temp_caps = get_user_meta($user_id, 'heiwa_temp_capabilities', true);
        if (is_array($temp_caps) && isset($temp_caps[$capability])) {
            unset($temp_caps[$capability]);
            update_user_meta($user_id, 'heiwa_temp_capabilities', $temp_caps);

            // Clear user capability cache
            wp_cache_delete($user_id, 'user_capabilities');

            Heiwa_Booking_Security::log_security_event('temporary_access_revoked', array(
                'user_id' => $user_id,
                'capability' => $capability
            ));

            return true;
        }

        return false;
    }

    /**
     * Check temporary capabilities
     *
     * @param int $user_id User ID
     * @return array Active temporary capabilities
     */
    public static function get_temporary_capabilities($user_id) {
        $temp_caps = get_user_meta($user_id, 'heiwa_temp_capabilities', true);
        if (!is_array($temp_caps)) {
            return array();
        }

        $current_time = time();
        $active_caps = array();

        foreach ($temp_caps as $cap => $expires) {
            if ($expires > $current_time) {
                $active_caps[$cap] = $expires;
            } else {
                // Remove expired capability
                unset($temp_caps[$cap]);
            }
        }

        // Update user meta if any expired
        if (count($temp_caps) !== count($active_caps)) {
            update_user_meta($user_id, 'heiwa_temp_capabilities', $temp_caps);
        }

        return $active_caps;
    }

    /**
     * Clean up expired temporary capabilities
     */
    public static function cleanup_expired_capabilities() {
        // This could be run by a cron job to clean up expired capabilities
        $users = get_users(array('fields' => 'ID'));

        foreach ($users as $user_id) {
            $temp_caps = get_user_meta($user_id, 'heiwa_temp_capabilities', true);
            if (is_array($temp_caps)) {
                $current_time = time();
                $has_expired = false;

                foreach ($temp_caps as $cap => $expires) {
                    if ($expires <= $current_time) {
                        unset($temp_caps[$cap]);
                        $has_expired = true;
                    }
                }

                if ($has_expired) {
                    update_user_meta($user_id, 'heiwa_temp_capabilities', $temp_caps);
                    wp_cache_delete($user_id, 'user_capabilities');
                }
            }
        }
    }
}

// Initialize permissions
Heiwa_Booking_Permissions::init();
