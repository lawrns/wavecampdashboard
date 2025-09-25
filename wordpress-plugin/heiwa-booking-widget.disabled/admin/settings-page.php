<?php
/**
 * Heiwa Booking Widget - Admin Settings Page UI
 *
 * Modern, user-friendly settings page with tabbed interface,
 * real-time validation, and brand theming configuration.
 *
 * @package HeiwaBookingWidget
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Render the main settings page
 */
function heiwa_booking_render_settings_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions to access this page.'));
    }

    $settings = get_option('heiwa_booking_settings', array());
    $active_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'general';

    ?>
    <div class="wrap heiwa-admin-wrap">
        <div class="heiwa-admin-header">
            <div class="heiwa-admin-header-content">
                <h1><?php _e('Heiwa Booking Widget Settings', 'heiwa-booking-widget'); ?></h1>
                <p class="description">
                    <?php _e('Configure your Heiwa House booking widget to match your brand and display preferences.', 'heiwa-booking-widget'); ?>
                </p>
            </div>
            <div class="heiwa-admin-header-actions">
                <button type="button" id="heiwa-save-settings" class="button button-primary button-large">
                    <span class="dashicons dashicons-cloud-upload"></span>
                    <?php _e('Save Changes', 'heiwa-booking-widget'); ?>
                </button>
            </div>
        </div>

        <?php settings_errors('heiwa_booking_messages'); ?>

        <div class="heiwa-admin-tabs">
            <nav class="nav-tab-wrapper">
                <a href="?page=heiwa-booking-widget&tab=general" class="nav-tab <?php echo $active_tab === 'general' ? 'nav-tab-active' : ''; ?>">
                    <span class="dashicons dashicons-admin-settings"></span>
                    <?php _e('General', 'heiwa-booking-widget'); ?>
                </a>
                <a href="?page=heiwa-booking-widget&tab=appearance" class="nav-tab <?php echo $active_tab === 'appearance' ? 'nav-tab-active' : ''; ?>">
                    <span class="dashicons dashicons-art"></span>
                    <?php _e('Appearance', 'heiwa-booking-widget'); ?>
                </a>
                <a href="?page=heiwa-booking-widget&tab=branding" class="nav-tab <?php echo $active_tab === 'branding' ? 'nav-tab-active' : ''; ?>">
                    <span class="dashicons dashicons-admin-customizer"></span>
                    <?php _e('Branding', 'heiwa-booking-widget'); ?>
                </a>
                <a href="?page=heiwa-booking-widget&tab=advanced" class="nav-tab <?php echo $active_tab === 'advanced' ? 'nav-tab-active' : ''; ?>">
                    <span class="dashicons dashicons-admin-tools"></span>
                    <?php _e('Advanced', 'heiwa-booking-widget'); ?>
                </a>
            </nav>

            <div class="heiwa-admin-content">
                <?php
                switch ($active_tab) {
                    case 'appearance':
                        heiwa_booking_render_appearance_tab($settings);
                        break;
                    case 'branding':
                        heiwa_booking_render_branding_tab($settings);
                        break;
                    case 'advanced':
                        heiwa_booking_render_advanced_tab($settings);
                        break;
                    default:
                        heiwa_booking_render_general_tab($settings);
                        break;
                }
                ?>
            </div>
        </div>

        <!-- Connection Status Sidebar -->
        <div class="heiwa-admin-sidebar">
            <?php heiwa_booking_render_connection_status($settings); ?>
            <?php heiwa_booking_render_quick_help(); ?>
        </div>
    </div>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        // Auto-save on field change (debounced)
        let saveTimeout;
        $('.heiwa-admin-content input, .heiwa-admin-content select, .heiwa-admin-content textarea').on('input change', function() {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(function() {
                heiwaAutoSave();
            }, 1000);
        });

        // Manual save button
        $('#heiwa-save-settings').on('click', function() {
            heiwaSaveSettings();
        });

        // Color picker initialization
        $('.heiwa-color-picker').wpColorPicker({
            change: function(event, ui) {
                $(this).trigger('change');
            }
        });

        // Test connection
        $('#heiwa-test-connection').on('click', function() {
            heiwaTestConnection();
        });

        // Preview theme changes
        $('.heiwa-theme-preview-trigger').on('input change', function() {
            heiwaUpdateThemePreview();
        });

        function heiwaAutoSave() {
            heiwaSaveSettings(true);
        }

        function heiwaSaveSettings(isAuto = false) {
            const $button = $('#heiwa-save-settings');
            const originalText = $button.html();

            $button.prop('disabled', true).html('<span class="dashicons dashicons-update spin"></span> Saving...');

            const formData = new FormData();
            formData.append('action', 'heiwa_save_settings');
            formData.append('nonce', heiwaBookingAdmin.nonce);

            // Collect all form data
            $('.heiwa-admin-content input, .heiwa-admin-content select, .heiwa-admin-content textarea').each(function() {
                const $field = $(this);
                const name = $field.attr('name');
                const value = $field.attr('type') === 'checkbox' ? ($field.is(':checked') ? '1' : '0') : $field.val();

                if (name) {
                    if ($field.attr('type') === 'checkbox' && $field.attr('name').endsWith('[]')) {
                        // Handle array checkboxes
                        if ($field.is(':checked')) {
                            formData.append(name, $field.val());
                        }
                    } else {
                        formData.append(name, value);
                    }
                }
            });

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        if (!isAuto) {
                            // Show success message
                            heiwaShowNotice('Settings saved successfully!', 'success');
                        }
                        $button.html('<span class="dashicons dashicons-yes"></span> Saved');
                        setTimeout(function() {
                            $button.prop('disabled', false).html(originalText);
                        }, 2000);
                    } else {
                        heiwaShowNotice(response.data || 'Error saving settings', 'error');
                        $button.prop('disabled', false).html(originalText);
                    }
                },
                error: function() {
                    heiwaShowNotice('Network error while saving', 'error');
                    $button.prop('disabled', false).html(originalText);
                }
            });
        }

        function heiwaTestConnection() {
            const $button = $('#heiwa-test-connection');
            const $result = $('#heiwa-connection-result');

            $button.prop('disabled', true).text('Testing...');
            $result.html('<span class="dashicons dashicons-update spin"></span> Testing connection...');

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'heiwa_test_connection',
                    nonce: heiwaBookingAdmin.nonce
                },
                success: function(response) {
                    $button.prop('disabled', false).text('Test Connection');

                    if (response.success) {
                        $result.html('<span class="dashicons dashicons-yes" style="color: #46b450;"></span> ' + response.data.message);
                    } else {
                        $result.html('<span class="dashicons dashicons-no" style="color: #dc3232;"></span> ' + (response.data || 'Connection failed'));
                    }
                },
                error: function() {
                    $button.prop('disabled', false).text('Test Connection');
                    $result.html('<span class="dashicons dashicons-no" style="color: #dc3232;"></span> Connection error');
                }
            });
        }

        function heiwaUpdateThemePreview() {
            // Update live preview of theme changes
            const primaryColor = $('#primary_color').val() || '#2563eb';
            const secondaryColor = $('#secondary_color').val() || '#6b7280';
            const fontFamily = $('#font_family').val() || 'Inter, sans-serif';

            $('.heiwa-theme-preview .preview-button').css({
                'background-color': primaryColor,
                'font-family': fontFamily
            });

            $('.heiwa-theme-preview .preview-text').css({
                'color': secondaryColor,
                'font-family': fontFamily
            });
        }

        function heiwaShowNotice(message, type = 'info') {
            const $notice = $('<div class="notice notice-' + type + ' is-dismissible"><p>' + message + '</p></div>');
            $('.heiwa-admin-header').after($notice);

            // Auto-dismiss after 5 seconds
            setTimeout(function() {
                $notice.fadeOut(function() { $(this).remove(); });
            }, 5000);

            // Dismissible functionality
            $notice.on('click', '.notice-dismiss', function() {
                $notice.fadeOut(function() { $(this).remove(); });
            });
        }

        // Initialize theme preview
        heiwaUpdateThemePreview();
    });
    </script>
    <?php
}

/**
 * Render General tab
 */
function heiwa_booking_render_general_tab($settings) {
    ?>
    <div class="heiwa-admin-section">
        <h2><?php _e('API Configuration', 'heiwa-booking-widget'); ?></h2>
        <p class="description">
            <?php _e('Connect your WordPress site to the Heiwa House booking system.', 'heiwa-booking-widget'); ?>
        </p>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="api_endpoint"><?php _e('API Endpoint', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="url" id="api_endpoint" name="api_endpoint"
                           value="<?php echo esc_attr($settings['api_endpoint'] ?? ''); ?>"
                           class="regular-text" placeholder="https://your-heiwa-app.vercel.app/api" />
                    <p class="description">
                        <?php _e('The base URL of your Heiwa House API endpoint.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="api_key"><?php _e('API Key', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="password" id="api_key" name="api_key"
                           value="<?php echo esc_attr($settings['api_key'] ?? ''); ?>"
                           class="regular-text" placeholder="heiwa_wp_your_api_key_here" />
                    <p class="description">
                        <?php _e('Your WordPress API key from the Heiwa House admin dashboard.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php _e('Connection Test', 'heiwa-booking-widget'); ?></th>
                <td>
                    <button type="button" id="heiwa-test-connection" class="button button-secondary">
                        <?php _e('Test Connection', 'heiwa-booking-widget'); ?>
                    </button>
                    <div id="heiwa-connection-result" class="heiwa-connection-result"></div>
                </td>
            </tr>
        </table>

        <h2><?php _e('Display Settings', 'heiwa-booking-widget'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row"><?php _e('Auto-inject Widget', 'heiwa-booking-widget'); ?></th>
                <td>
                    <label for="auto_inject">
                        <input type="checkbox" id="auto_inject" name="auto_inject" value="1"
                               <?php checked(($settings['auto_inject'] ?? false), true); ?> />
                        <?php _e('Automatically display widget on selected pages', 'heiwa-booking-widget'); ?>
                    </label>
                    <p class="description">
                        <?php _e('When disabled, use the shortcode [heiwa_booking] to display the widget manually.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row"><?php _e('Show Widget On', 'heiwa-booking-widget'); ?></th>
                <td>
                    <fieldset>
                        <?php
                        $enabled_pages = $settings['enabled_pages'] ?? array();
                        $page_options = array(
                            'front_page' => __('Front Page', 'heiwa-booking-widget'),
                            'home' => __('Blog Home', 'heiwa-booking-widget'),
                            'pages' => __('All Pages', 'heiwa-booking-widget'),
                            'posts' => __('All Posts', 'heiwa-booking-widget'),
                        );

                        foreach ($page_options as $key => $label) {
                            ?>
                            <label for="enabled_pages_<?php echo esc_attr($key); ?>">
                                <input type="checkbox" id="enabled_pages_<?php echo esc_attr($key); ?>"
                                       name="enabled_pages[]" value="<?php echo esc_attr($key); ?>"
                                       <?php checked(in_array($key, $enabled_pages)); ?> />
                                <?php echo esc_html($label); ?>
                            </label><br>
                            <?php
                        }
                        ?>
                    </fieldset>
                    <p class="description">
                        <?php _e('Select where the widget should appear automatically.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
        </table>
    </div>
    <?php
}

/**
 * Render Appearance tab
 */
function heiwa_booking_render_appearance_tab($settings) {
    ?>
    <div class="heiwa-admin-section">
        <h2><?php _e('Widget Appearance', 'heiwa-booking-widget'); ?></h2>
        <p class="description">
            <?php _e('Customize the visual appearance of your booking widget.', 'heiwa-booking-widget'); ?>
        </p>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="widget_position"><?php _e('Widget Position', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <select id="widget_position" name="widget_position">
                        <option value="right" <?php selected($settings['widget_position'] ?? 'right', 'right'); ?>>
                            <?php _e('Right Side', 'heiwa-booking-widget'); ?>
                        </option>
                        <option value="left" <?php selected($settings['widget_position'] ?? 'right', 'left'); ?>>
                            <?php _e('Left Side', 'heiwa-booking-widget'); ?>
                        </option>
                        <option value="bottom" <?php selected($settings['widget_position'] ?? 'right', 'bottom'); ?>>
                            <?php _e('Bottom', 'heiwa-booking-widget'); ?>
                        </option>
                        <option value="bottom-left" <?php selected($settings['widget_position'] ?? 'right', 'bottom-left'); ?>>
                            <?php _e('Bottom Left', 'heiwa-booking-widget'); ?>
                        </option>
                        <option value="bottom-right" <?php selected($settings['widget_position'] ?? 'right', 'bottom-right'); ?>>
                            <?php _e('Bottom Right', 'heiwa-booking-widget'); ?>
                        </option>
                    </select>
                    <p class="description">
                        <?php _e('Position of the widget on the page.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="trigger_text"><?php _e('Trigger Button Text', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="text" id="trigger_text" name="trigger_text"
                           value="<?php echo esc_attr($settings['trigger_text'] ?? 'BOOK NOW'); ?>"
                           class="regular-text" />
                    <p class="description">
                        <?php _e('Text displayed on the floating trigger button.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
        </table>

        <h3><?php _e('Theme Preview', 'heiwa-booking-widget'); ?></h3>
        <div class="heiwa-theme-preview">
            <div class="preview-widget">
                <div class="preview-header">
                    <span class="preview-text"><?php _e('Book Your Surf Camp', 'heiwa-booking-widget'); ?></span>
                </div>
                <div class="preview-content">
                    <button class="preview-button button-primary">
                        <?php echo esc_html($settings['trigger_text'] ?? 'BOOK NOW'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <?php
}

/**
 * Render Branding tab
 */
function heiwa_booking_render_branding_tab($settings) {
    ?>
    <div class="heiwa-admin-section">
        <h2><?php _e('Brand Configuration', 'heiwa-booking-widget'); ?></h2>
        <p class="description">
            <?php _e('Configure brand-specific theming and tokens for your booking widget.', 'heiwa-booking-widget'); ?>
        </p>

        <div class="heiwa-brand-notice notice notice-info">
            <p>
                <strong><?php _e('Brand Configuration', 'heiwa-booking-widget'); ?>:</strong>
                <?php _e('These settings allow you to customize the widget appearance for different surf camp brands. Brand tokens are loaded from your Heiwa House admin panel.', 'heiwa-booking-widget'); ?>
            </p>
        </div>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="brand_id"><?php _e('Brand ID', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="text" id="brand_id" name="brand_id"
                           value="<?php echo esc_attr($settings['brand_id'] ?? ''); ?>"
                           class="regular-text" placeholder="heiwa-house" />
                    <p class="description">
                        <?php _e('Your brand identifier from Heiwa House (leave empty for default branding).', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
        </table>

        <h3><?php _e('Brand Theme Tokens', 'heiwa-booking-widget'); ?></h3>
        <p class="description">
            <?php _e('These values are automatically loaded from your Heiwa House brand configuration. You can override them here for this WordPress site.', 'heiwa-booking-widget'); ?>
        </p>

        <div class="heiwa-brand-tokens">
            <div class="token-group">
                <h4><?php _e('Colors', 'heiwa-booking-widget'); ?></h4>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="primary_color"><?php _e('Primary Color', 'heiwa-booking-widget'); ?></label>
                        </th>
                        <td>
                            <input type="color" id="primary_color" name="primary_color"
                                   value="<?php echo esc_attr($settings['primary_color'] ?? '#2563eb'); ?>"
                                   class="heiwa-color-picker" />
                            <p class="description">
                                <?php _e('Primary brand color for buttons and highlights.', 'heiwa-booking-widget'); ?>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="secondary_color"><?php _e('Secondary Color', 'heiwa-booking-widget'); ?></label>
                        </th>
                        <td>
                            <input type="color" id="secondary_color" name="secondary_color"
                                   value="<?php echo esc_attr($settings['secondary_color'] ?? '#6b7280'); ?>"
                                   class="heiwa-color-picker" />
                            <p class="description">
                                <?php _e('Secondary color for text and supporting elements.', 'heiwa-booking-widget'); ?>
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="accent_color"><?php _e('Accent Color', 'heiwa-booking-widget'); ?></label>
                        </th>
                        <td>
                            <input type="color" id="accent_color" name="accent_color"
                                   value="<?php echo esc_attr($settings['accent_color'] ?? '#f59e0b'); ?>"
                                   class="heiwa-color-picker" />
                            <p class="description">
                                <?php _e('Accent color for special highlights and CTAs.', 'heiwa-booking-widget'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="token-group">
                <h4><?php _e('Typography', 'heiwa-booking-widget'); ?></h4>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="font_family"><?php _e('Font Family', 'heiwa-booking-widget'); ?></label>
                        </th>
                        <td>
                            <select id="font_family" name="font_family" class="heiwa-theme-preview-trigger">
                                <option value="Inter, sans-serif" <?php selected($settings['font_family'] ?? 'Inter, sans-serif', 'Inter, sans-serif'); ?>>Inter</option>
                                <option value="Roboto, sans-serif" <?php selected($settings['font_family'] ?? 'Inter, sans-serif', 'Roboto, sans-serif'); ?>>Roboto</option>
                                <option value="Open Sans, sans-serif" <?php selected($settings['font_family'] ?? 'Inter, sans-serif', 'Open Sans, sans-serif'); ?>>Open Sans</option>
                                <option value="Lato, sans-serif" <?php selected($settings['font_family'] ?? 'Inter, sans-serif', 'Lato, sans-serif'); ?>>Lato</option>
                                <option value="system-ui, sans-serif" <?php selected($settings['font_family'] ?? 'Inter, sans-serif', 'system-ui, sans-serif'); ?>>System Font</option>
                            </select>
                            <p class="description">
                                <?php _e('Primary font family for the widget.', 'heiwa-booking-widget'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="token-group">
                <h4><?php _e('Layout', 'heiwa-booking-widget'); ?></h4>
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="border_radius"><?php _e('Border Radius', 'heiwa-booking-widget'); ?></label>
                        </th>
                        <td>
                            <select id="border_radius" name="border_radius" class="heiwa-theme-preview-trigger">
                                <option value="4px" <?php selected($settings['border_radius'] ?? '8px', '4px'); ?>>Sharp (4px)</option>
                                <option value="8px" <?php selected($settings['border_radius'] ?? '8px', '8px'); ?>>Rounded (8px)</option>
                                <option value="12px" <?php selected($settings['border_radius'] ?? '8px', '12px'); ?>>Very Rounded (12px)</option>
                                <option value="20px" <?php selected($settings['border_radius'] ?? '8px', '20px'); ?>>Pill (20px)</option>
                            </select>
                            <p class="description">
                                <?php _e('Corner rounding for buttons and containers.', 'heiwa-booking-widget'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <h3><?php _e('API Configuration', 'heiwa-booking-widget'); ?></h3>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="stripe_publishable_key"><?php _e('Stripe Publishable Key', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="password" id="stripe_publishable_key" name="stripe_publishable_key"
                           value="<?php echo esc_attr($settings['stripe_publishable_key'] ?? ''); ?>"
                           class="regular-text" placeholder="pk_test_..." />
                    <p class="description">
                        <?php _e('Stripe publishable key for client-side payments (leave empty to use default from Heiwa House).', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
        </table>

        <div class="heiwa-theme-preview">
            <h3><?php _e('Live Theme Preview', 'heiwa-booking-widget'); ?></h3>
            <div class="preview-widget">
                <div class="preview-header" style="background: linear-gradient(135deg, <?php echo esc_attr($settings['primary_color'] ?? '#2563eb'); ?>, <?php echo esc_attr($settings['secondary_color'] ?? '#6b7280'); ?>);">
                    <span class="preview-text" style="color: white;"><?php _e('Book Your Surf Camp', 'heiwa-booking-widget'); ?></span>
                </div>
                <div class="preview-content">
                    <button class="preview-button button-primary heiwa-theme-preview-trigger"
                            style="background-color: <?php echo esc_attr($settings['primary_color'] ?? '#2563eb'); ?>;
                                   border-radius: <?php echo esc_attr($settings['border_radius'] ?? '8px'); ?>;
                                   font-family: <?php echo esc_attr($settings['font_family'] ?? 'Inter, sans-serif'); ?>;">
                        <?php echo esc_html($settings['trigger_text'] ?? 'BOOK NOW'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
    <?php
}

/**
 * Render Advanced tab
 */
function heiwa_booking_render_advanced_tab($settings) {
    ?>
    <div class="heiwa-admin-section">
        <h2><?php _e('Advanced Settings', 'heiwa-booking-widget'); ?></h2>
        <p class="description">
            <?php _e('Advanced configuration options for power users and developers.', 'heiwa-booking-widget'); ?>
        </p>

        <div class="heiwa-admin-warning notice notice-warning">
            <p>
                <strong><?php _e('Warning', 'heiwa-booking-widget'); ?>:</strong>
                <?php _e('These settings are for advanced users. Incorrect configuration may break the widget functionality.', 'heiwa-booking-widget'); ?>
            </p>
        </div>

        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="debug_mode"><?php _e('Debug Mode', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <label for="debug_mode">
                        <input type="checkbox" id="debug_mode" name="debug_mode" value="1"
                               <?php checked(($settings['debug_mode'] ?? false), true); ?> />
                        <?php _e('Enable debug logging and error reporting', 'heiwa-booking-widget'); ?>
                    </label>
                    <p class="description">
                        <?php _e('Log detailed information for troubleshooting. Only enable on development sites.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="cache_timeout"><?php _e('Cache Timeout', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="number" id="cache_timeout" name="cache_timeout"
                           value="<?php echo esc_attr($settings['cache_timeout'] ?? 300); ?>"
                           class="small-text" min="60" max="3600" step="60" />
                    <?php _e('seconds', 'heiwa-booking-widget'); ?>
                    <p class="description">
                        <?php _e('How long to cache API responses (minimum 60 seconds, maximum 1 hour).', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="rate_limit"><?php _e('Rate Limit', 'heiwa-booking-widget'); ?></label>
                </th>
                <td>
                    <input type="number" id="rate_limit" name="rate_limit"
                           value="<?php echo esc_attr($settings['rate_limit'] ?? 10); ?>"
                           class="small-text" min="1" max="100" />
                    <?php _e('requests per minute', 'heiwa-booking-widget'); ?>
                    <p class="description">
                        <?php _e('Maximum API requests allowed per IP address per minute.', 'heiwa-booking-widget'); ?>
                    </p>
                </td>
            </tr>
        </table>

        <h3><?php _e('Custom CSS', 'heiwa-booking-widget'); ?></h3>
        <p class="description">
            <?php _e('Add custom CSS to override widget styles. Use with caution.', 'heiwa-booking-widget'); ?>
        </p>
        <textarea id="custom_css" name="custom_css" rows="10" class="large-text code"
                  placeholder=".heiwa-booking-widget { /* Your custom styles */ }"><?php echo esc_textarea($settings['custom_css'] ?? ''); ?></textarea>

        <h3><?php _e('System Information', 'heiwa-booking-widget'); ?></h3>
        <div class="heiwa-system-info">
            <table class="widefat">
                <tbody>
                    <tr>
                        <td><strong><?php _e('Plugin Version', 'heiwa-booking-widget'); ?></strong></td>
                        <td><?php echo esc_html(HEIWA_BOOKING_VERSION); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('Build ID', 'heiwa-booking-widget'); ?></strong></td>
                        <td><?php echo esc_html(HEIWA_WIDGET_BUILD_ID); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('WordPress Version', 'heiwa-booking-widget'); ?></strong></td>
                        <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('PHP Version', 'heiwa-booking-widget'); ?></strong></td>
                        <td><?php echo esc_html(PHP_VERSION); ?></td>
                    </tr>
                    <tr>
                        <td><strong><?php _e('REST API Available', 'heiwa-booking-widget'); ?></strong></td>
                        <td><?php echo rest_get_url_prefix() ? '<span style="color: #46b450;">Yes</span>' : '<span style="color: #dc3232;">No</span>'; ?></td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <?php
}

/**
 * Render connection status sidebar
 */
function heiwa_booking_render_connection_status($settings) {
    $is_configured = !empty($settings['api_endpoint']) && !empty($settings['api_key']);
    ?>
    <div class="heiwa-admin-card">
        <h3><?php _e('Connection Status', 'heiwa-booking-widget'); ?></h3>
        <div class="heiwa-status-indicator <?php echo $is_configured ? 'heiwa-status-connected' : 'heiwa-status-disconnected'; ?>">
            <span class="dashicons <?php echo $is_configured ? 'dashicons-yes-alt' : 'dashicons-warning'; ?>"></span>
            <?php echo $is_configured ? __('Connected', 'heiwa-booking-widget') : __('Not Connected', 'heiwa-booking-widget'); ?>
        </div>

        <?php if ($is_configured): ?>
            <div class="heiwa-connection-details">
                <p>
                    <strong><?php _e('Endpoint', 'heiwa-booking-widget'); ?>:</strong><br>
                    <code><?php echo esc_html($settings['api_endpoint']); ?></code>
                </p>
                <p>
                    <strong><?php _e('API Key', 'heiwa-booking-widget'); ?>:</strong><br>
                    <code><?php echo esc_html(substr($settings['api_key'], 0, 8) . '****'); ?></code>
                </p>
            </div>
        <?php else: ?>
            <p><?php _e('Configure your API settings to connect to Heiwa House.', 'heiwa-booking-widget'); ?></p>
        <?php endif; ?>
    </div>
    <?php
}

/**
 * Render quick help sidebar
 */
function heiwa_booking_render_quick_help() {
    ?>
    <div class="heiwa-admin-card">
        <h3><?php _e('Quick Help', 'heiwa-booking-widget'); ?></h3>
        <ul>
            <li>
                <strong><?php _e('Shortcode', 'heiwa-booking-widget'); ?>:</strong><br>
                <code>[heiwa_booking]</code>
            </li>
            <li>
                <strong><?php _e('PHP Function', 'heiwa-booking-widget'); ?>:</strong><br>
                <code>&lt;?php heiwa_booking_widget(); ?&gt;</code>
            </li>
            <li>
                <strong><?php _e('REST API', 'heiwa-booking-widget'); ?>:</strong><br>
                <code><?php echo esc_html(rest_get_url_prefix()); ?>/heiwa/v1/availability</code>
            </li>
        </ul>
        <p>
            <a href="#" class="button button-secondary"><?php _e('View Documentation', 'heiwa-booking-widget'); ?></a>
        </p>
    </div>

    <div class="heiwa-admin-card">
        <h3><?php _e('Support', 'heiwa-booking-widget'); ?></h3>
        <p><?php _e('Need help with your booking widget?', 'heiwa-booking-widget'); ?></p>
        <p>
            <a href="mailto:support@heiwahouse.com" class="button button-secondary">
                <span class="dashicons dashicons-email"></span>
                <?php _e('Contact Support', 'heiwa-booking-widget'); ?>
            </a>
        </p>
    </div>
    <?php
}

// Enqueue admin styles for the new settings page
add_action('admin_enqueue_scripts', 'heiwa_booking_enqueue_settings_styles');

function heiwa_booking_enqueue_settings_styles($hook) {
    if ($hook !== 'toplevel_page_heiwa-booking-widget') {
        return;
    }

    wp_enqueue_style('wp-color-picker');
    wp_enqueue_script('wp-color-picker');

    wp_enqueue_style(
        'heiwa-admin-settings',
        HEIWA_BOOKING_PLUGIN_URL . 'assets/css/admin-settings.css',
        array(),
        HEIWA_BOOKING_VERSION
    );

    wp_enqueue_script(
        'heiwa-admin-settings',
        HEIWA_BOOKING_PLUGIN_URL . 'assets/js/admin-settings.js',
        array('jquery', 'wp-color-picker'),
        HEIWA_BOOKING_VERSION,
        true
    );

    wp_localize_script('heiwa-admin-settings', 'heiwaBookingAdmin', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('heiwa_booking_admin_nonce'),
        'strings' => array(
            'saving' => __('Saving...', 'heiwa-booking-widget'),
            'saved' => __('Settings saved successfully!', 'heiwa-booking-widget'),
            'error' => __('Error saving settings', 'heiwa-booking-widget'),
            'testing' => __('Testing connection...', 'heiwa-booking-widget'),
            'connected' => __('Connection successful!', 'heiwa-booking-widget'),
            'disconnected' => __('Connection failed', 'heiwa-booking-widget'),
        )
    ));
}
