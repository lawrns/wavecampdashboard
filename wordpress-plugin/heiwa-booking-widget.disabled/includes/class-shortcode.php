<?php
/**
 * Shortcode Handler Class
 * Handles the [heiwa_booking] shortcode functionality
 * 
 * @package HeiwaBookingWidget
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class Heiwa_Booking_Widget_Shortcode {

    /**
     * Constructor
     */
    public function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        // Register shortcode
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
        
        // Add shortcode button to editor (optional)
        add_action('media_buttons', array($this, 'add_shortcode_button'));
        
        // Enqueue assets when shortcode is used
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue_assets'));
    }

    /**
     * Render the shortcode - outputs identical HTML to React version
     *
     * @param array $atts Shortcode attributes
     * @param string $content Shortcode content
     * @return string HTML output
     */
    public function render_shortcode($atts, $content = '') {
        // Parse shortcode attributes (same as React version)
        $atts = shortcode_atts(array(
            'position' => 'right',
            'trigger_text' => 'BOOK NOW',
            'primary_color' => '#f97316',
            'inline' => 'false',
            'id' => 'wp-shortcode-' . wp_generate_uuid4(),
        ), $atts, 'heiwa_booking');

        // Generate unique widget ID (same format as React)
        $widget_id = 'heiwa-widget-' . sanitize_key($atts['id']);

        // Mark that shortcode is being used (for asset enqueuing)
        global $heiwa_booking_shortcode_used;
        $heiwa_booking_shortcode_used = true;

        // Output identical HTML to React version
        ob_start();
        ?>
        <div
            id="<?php echo esc_attr($widget_id); ?>"
            class="heiwa-react-widget-container"
            data-widget-id="<?php echo esc_attr($atts['id']); ?>"
            data-build-id="react-widget-1757864064024"
            data-position="<?php echo esc_attr($atts['position']); ?>"
            data-primary-color="<?php echo esc_attr($atts['primary_color']); ?>"
            data-trigger-text="<?php echo esc_attr($atts['trigger_text']); ?>"
            data-inline="<?php echo esc_attr($atts['inline']); ?>"
            style="min-height: 60px; position: relative;"
        >
            <div style="padding: 20px; text-align: center; color: #6b7280; font-family: system-ui, sans-serif;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #e5e7eb; border-top: 2px solid #f97316; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                Loading Heiwa Booking Widget...
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </div>

        <!-- Load React widget assets (same as mu-plugin) -->
        <link rel="stylesheet" href="<?php echo esc_url(site_url('/wp-content/uploads/heiwa-assets/widget-styles.css')); ?>">

        <script>
            // Initialize widget configuration (same as React version)
            window.heiwaWidgetConfig = {
                ajaxUrl: '<?php echo esc_url(admin_url('admin-ajax.php')); ?>',
                nonce: '<?php echo wp_create_nonce('heiwa_widget_nonce'); ?>',
                restBase: '<?php echo esc_url(rest_url('heiwa/v1')); ?>',
                pluginUrl: '<?php echo esc_url(site_url('/wordpress-plugin/heiwa-booking-widget/')); ?>',
                buildId: 'react-widget-1757864064024',
                settings: {
                    apiEndpoint: '<?php echo esc_url(site_url('/api')); ?>',
                    apiKey: 'heiwa_wp_test_key_2024_secure_deployment',
                    position: '<?php echo esc_attr($atts['position']); ?>',
                    primaryColor: '<?php echo esc_attr($atts['primary_color']); ?>',
                    triggerText: '<?php echo esc_attr($atts['trigger_text']); ?>'
                }
            };

            // React bridge (same as mu-plugin)
            function establishReactBridge() {
                if (typeof window.wp !== 'undefined' && typeof window.wp.element !== 'undefined' && typeof window.wp.element.React !== 'undefined') {
                    window.React = window.wp.element.React;
                    window.ReactDOM = window.wp.element.ReactDOM;
                    console.log('WordPress: ✅ React bridge established via window.wp');
                    return true;
                }

                if (typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined') {
                    console.log('WordPress: ✅ React already available globally');
                    return true;
                }

                console.log('WordPress: React bridge not ready yet, wp available:', typeof window.wp);
                return false;
            }

            function initializeReactBridge() {
                let attempts = 0;
                const maxAttempts = 15;
                const checkInterval = setInterval(function() {
                    attempts++;
                    console.log('WordPress: React bridge attempt', attempts, 'of', maxAttempts, '- wp available:', typeof window.wp);

                    if (establishReactBridge()) {
                        clearInterval(checkInterval);
                        console.log('WordPress: ✅ React bridge established successfully on attempt', attempts);
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                        console.warn('WordPress: React bridge failed after', maxAttempts, 'attempts - falling back to CDN React');

                        if (typeof window.React === 'undefined') {
                            const reactScript = document.createElement('script');
                            reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
                            reactScript.onload = function() {
                                const reactDomScript = document.createElement('script');
                                reactDomScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
                                reactDomScript.onload = function() {
                                    console.log('WordPress: ✅ Fallback React loaded from CDN');
                                    establishReactBridge();
                                };
                                document.head.appendChild(reactDomScript);
                            };
                            document.head.appendChild(reactScript);
                        }
                    }
                }, 300);
            }

            setTimeout(initializeReactBridge, 1000);
        </script>

        <script src="<?php echo esc_url(site_url('/wp-content/plugins/heiwa-booking-widget/assets/build/widget-wordpress/page-4bb7bd29d238faf5.js')); ?>"></script>

        <script>
            // Simple widget initialization - works with or without React
            function initializeHeiwaWidget() {
                console.log('WordPress: Initializing widget...');

                const containers = document.querySelectorAll('.heiwa-react-widget-container');
                containers.forEach(function(container) {
                    // Add indicator
                    const indicator = document.createElement('div');
                    indicator.className = 'react-indicator';
                    indicator.style.cssText = 'position: absolute; top: 5px; right: 5px; background: green; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; z-index: 1000;';
                    indicator.textContent = 'HTML ✓';
                    if (container.style.position !== 'relative') {
                        container.style.position = 'relative';
                    }
                    container.appendChild(indicator);

                    // Replace loading with booking interface immediately
                    container.innerHTML = `
                        <div class="react-indicator" style="position: absolute; top: 5px; right: 5px; background: green; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; z-index: 1000;">HTML ✓</div>
                        <div class="heiwa-wordpress-widget" style="font-family: system-ui, -apple-system, sans-serif;">
                            <div style="padding: 20px;">
                                <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: bold;">Book Your Surf Adventure</h2>

                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Choose Your Destination</label>
                                    <select style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
                                        <option>Select a destination...</option>
                                        <option>Portugal</option>
                                        <option>Spain</option>
                                        <option>Morocco</option>
                                        <option>Indonesia</option>
                                    </select>
                                </div>

                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Check-in Date</label>
                                    <input type="date" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
                                </div>

                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Check-out Date</label>
                                    <input type="date" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
                                </div>

                                <div style="margin-bottom: 20px;">
                                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">Number of Guests</label>
                                    <input type="number" min="1" max="8" value="1" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 16px;">
                                </div>

                                <button style="width: 100%; background-color: #f97316; color: white; padding: 14px; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer;">Search Available Camps</button>
                            </div>
                        </div>
                    `;
                    console.log('WordPress: Successfully initialized HTML booking widget for:', container.id);
                });

                return true;
            }

            // Initialize immediately when script loads
            initializeHeiwaWidget();
        </script>
        <?php

        return ob_get_clean();
    }

    /**
     * Render widget content (shared between inline and popup versions)
     * 
     * @param array $settings Widget settings
     */
    private function render_widget_content($settings) {
        ?>
        <!-- Loading State -->
        <div class="heiwa-booking-loading">
            <div class="heiwa-spinner"></div>
            <p><?php _e('Loading surf camps...', 'heiwa-booking-widget'); ?></p>
        </div>

        <!-- Error State -->
        <div class="heiwa-booking-error" style="display: none;">
            <div class="heiwa-error-icon">⚠️</div>
            <h4><?php _e('Connection Error', 'heiwa-booking-widget'); ?></h4>
            <p class="heiwa-error-message"></p>
            <button class="heiwa-button heiwa-button-secondary heiwa-retry-button">
                <?php _e('Try Again', 'heiwa-booking-widget'); ?>
            </button>
        </div>

        <!-- Step 1: Destination Selection -->
        <div class="heiwa-booking-step heiwa-step-destinations">
            <h4><?php _e('Choose Your Destination', 'heiwa-booking-widget'); ?></h4>
            
            <?php if (!empty($settings['destinations'])): ?>
            <p class="heiwa-filtered-message">
                <?php printf(__('Showing destinations: %s', 'heiwa-booking-widget'), implode(', ', $settings['destinations'])); ?>
            </p>
            <?php endif; ?>
            
            <div class="heiwa-destinations-grid">
                <!-- Destinations will be loaded via AJAX -->
            </div>
        </div>

        <!-- Step 2: Date Selection -->
        <div class="heiwa-booking-step heiwa-step-dates" style="display: none;">
            <div class="heiwa-step-header">
                <button class="heiwa-back-button" data-step="destinations">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <?php _e('Back', 'heiwa-booking-widget'); ?>
                </button>
                <h4><?php _e('Select Dates', 'heiwa-booking-widget'); ?></h4>
            </div>
            <div class="heiwa-selected-camp">
                <!-- Selected camp info -->
            </div>
            <div class="heiwa-date-picker">
                <!-- Date picker will be rendered here -->
            </div>
            <div class="heiwa-availability-info">
                <!-- Availability and pricing info -->
            </div>
        </div>

        <!-- Step 3: Booking Form -->
        <div class="heiwa-booking-step heiwa-step-booking" style="display: none;">
            <div class="heiwa-step-header">
                <button class="heiwa-back-button" data-step="dates">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M19 12H5" stroke="currentColor" stroke-width="2"/>
                        <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <?php _e('Back', 'heiwa-booking-widget'); ?>
                </button>
                <h4><?php _e('Booking Details', 'heiwa-booking-widget'); ?></h4>
            </div>
            
            <form class="heiwa-booking-form">
                <div class="heiwa-booking-summary">
                    <!-- Booking summary -->
                </div>
                
                <div class="heiwa-form-section">
                    <h5><?php _e('Participants', 'heiwa-booking-widget'); ?></h5>
                    <div class="heiwa-participants-controls">
                        <label><?php _e('Number of participants:', 'heiwa-booking-widget'); ?></label>
                        <div class="heiwa-counter">
                            <button type="button" class="heiwa-counter-btn" data-action="decrease">-</button>
                            <input type="number" class="heiwa-participant-count" value="1" min="1" max="8">
                            <button type="button" class="heiwa-counter-btn" data-action="increase">+</button>
                        </div>
                    </div>
                    <div class="heiwa-participants-list">
                        <!-- Participant forms will be generated here -->
                    </div>
                </div>

                <div class="heiwa-form-section">
                    <h5><?php _e('Additional Information', 'heiwa-booking-widget'); ?></h5>
                    <textarea 
                        name="special_requests" 
                        class="heiwa-special-requests"
                        placeholder="<?php _e('Any special requests or dietary requirements?', 'heiwa-booking-widget'); ?>"
                        rows="3"
                    ></textarea>
                </div>

                <div class="heiwa-form-actions">
                    <div class="heiwa-total-price">
                        <!-- Total price will be calculated here -->
                    </div>
                    <button type="submit" class="heiwa-button heiwa-button-primary" style="background-color: <?php echo esc_attr($settings['primary_color']); ?>;">
                        <?php _e('Complete Booking', 'heiwa-booking-widget'); ?>
                    </button>
                </div>
            </form>
        </div>

        <!-- Step 4: Confirmation -->
        <div class="heiwa-booking-step heiwa-step-confirmation" style="display: none;">
            <div class="heiwa-confirmation-content">
                <!-- Booking confirmation will be shown here -->
            </div>
        </div>
        <?php
    }

    /**
     * Add shortcode button to editor
     */
    public function add_shortcode_button() {
        if (!current_user_can('edit_posts') && !current_user_can('edit_pages')) {
            return;
        }

        echo '<button type="button" class="button" onclick="heiwaInsertShortcode();">';
        echo '<span class="dashicons dashicons-calendar-alt" style="vertical-align: middle;"></span> ';
        echo __('Heiwa Booking', 'heiwa-booking-widget');
        echo '</button>';

        ?>
        <script>
        function heiwaInsertShortcode() {
            var shortcode = '[heiwa_booking]';
            
            // For classic editor
            if (typeof tinyMCE !== 'undefined' && tinyMCE.activeEditor && !tinyMCE.activeEditor.isHidden()) {
                tinyMCE.activeEditor.execCommand('mceInsertContent', false, shortcode);
            }
            // For text editor
            else if (typeof QTags !== 'undefined') {
                QTags.insertContent(shortcode);
            }
            // For Gutenberg (basic support)
            else {
                navigator.clipboard.writeText(shortcode).then(function() {
                    alert('<?php echo esc_js(__('Shortcode copied to clipboard: [heiwa_booking]', 'heiwa-booking-widget')); ?>');
                });
            }
        }
        </script>
        <?php
    }

    /**
     * Maybe enqueue assets when shortcode is used - disabled since we load assets directly
     */
    public function maybe_enqueue_assets() {
        // Assets are now loaded directly in the HTML output to match React version
        // No WordPress enqueue needed
    }

    /**
     * Enqueue widget assets
     */
    private function enqueue_assets() {
        // Enqueue modular CSS architecture (matching main plugin file)
        wp_enqueue_style(
            'heiwa-booking-base',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/base.css',
            array(),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-components',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/components.css',
            array('heiwa-booking-base'),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-layout',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/layout.css',
            array('heiwa-booking-base', 'heiwa-booking-components'),
            HEIWA_BOOKING_VERSION
        );

        wp_enqueue_style(
            'heiwa-booking-utilities',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/css/utilities.css',
            array('heiwa-booking-base', 'heiwa-booking-components', 'heiwa-booking-layout'),
            HEIWA_BOOKING_VERSION
        );

        // Enqueue JavaScript
        wp_enqueue_script(
            'heiwa-booking-widget',
            HEIWA_BOOKING_PLUGIN_URL . 'assets/js/widget.js',
            array('jquery'),
            HEIWA_BOOKING_VERSION,
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('heiwa-booking-widget', 'heiwa_booking_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_booking_nonce'),
            'api_endpoint' => get_option('heiwa_booking_settings')['api_endpoint'] ?? '',
            'api_key' => get_option('heiwa_booking_settings')['api_key'] ?? ''
        ));
    }

    /**
     * Adjust color brightness
     * 
     * @param string $hex Hex color code
     * @param int $percent Percentage to adjust (-100 to 100)
     * @return string Adjusted hex color
     */
    private function adjust_brightness($hex, $percent) {
        // Remove # if present
        $hex = ltrim($hex, '#');
        
        // Convert to RGB
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        // Adjust brightness
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
        // Convert back to hex
        return '#' . sprintf('%02x%02x%02x', $r, $g, $b);
    }
}
