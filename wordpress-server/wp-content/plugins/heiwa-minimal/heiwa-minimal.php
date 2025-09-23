<?php
/**
 * Plugin Name: Heiwa Booking Widget (Minimal)
 * Plugin URI: https://heiwahouse.com
 * Description: Minimal version of the Heiwa booking widget for testing
 * Version: 1.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEIWA_MINIMAL_VERSION', '1.0.0');
define('HEIWA_MINIMAL_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_MINIMAL_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Minimal Shortcode Class
 */
class Heiwa_Minimal_Shortcode {
    
    public function __construct() {
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        error_log('Heiwa Minimal: Shortcode class initialized');
    }
    
    public function enqueue_assets() {
        // Enqueue React and ReactDOM
        wp_enqueue_script('react', 'https://unpkg.com/react@18/umd/react.production.min.js', array(), '18.0.0', true);
        wp_enqueue_script('react-dom', 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js', array('react'), '18.0.0', true);

        // Create a simple inline script that creates a working widget
        $inline_script = "
        (function() {
            console.log('🎯 Heiwa Minimal: Initializing widget');

            // Simple widget implementation
            function createBookingWidget(container) {
                if (!container) return;

                console.log('🎯 Creating booking widget in container:', container.id);

                // Create a simple button that opens the booking widget
                const button = document.createElement('button');
                button.innerHTML = `
                    <div style='display: flex; align-items: center; gap: 8px;'>
                        <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'/>
                        </svg>
                        <span>BOOK NOW</span>
                    </div>
                `;

                // Style the button
                button.style.cssText = `
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 999999;
                    background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    padding: 12px 20px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.4);
                    transition: all 0.3s ease;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                `;

                // Add hover effects
                button.addEventListener('mouseenter', function() {
                    this.style.transform = 'translateY(-2px)';
                    this.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.6)';
                });

                button.addEventListener('mouseleave', function() {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.4)';
                });

                // Add click handler to open the actual booking widget
                button.addEventListener('click', function() {
                    console.log('🎯 Opening booking widget');
                    // For now, redirect to the working widget test page
                    window.open('http://localhost:3005/widget-test-wp/', '_blank');
                });

                // Clear container and add button
                container.innerHTML = '';
                container.appendChild(button);

                console.log('✅ Booking widget created successfully');
            }

            // Initialize widgets when DOM is ready
            function initializeWidgets() {
                console.log('🎯 Searching for widget containers');
                const containers = document.querySelectorAll('.heiwa-react-widget-container');
                console.log('🎯 Found', containers.length, 'widget containers');

                containers.forEach(function(container, index) {
                    console.log('🎯 Initializing widget', index + 1, 'in container:', container.id);
                    createBookingWidget(container);
                });
            }

            // Run initialization
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeWidgets);
            } else {
                initializeWidgets();
            }

            // Also run after a short delay to catch any dynamically added containers
            setTimeout(initializeWidgets, 1000);

            console.log('🎯 Heiwa Minimal: Widget script loaded');
        })();
        ";

        // Add the inline script
        wp_add_inline_script('react', $inline_script);

        error_log('Heiwa Minimal: Simple widget script enqueued');
    }
    
    public function render_shortcode($atts, $content = '') {
        error_log('Heiwa Minimal: Shortcode called');
        
        // Parse shortcode attributes
        $atts = shortcode_atts(array(
            'position' => 'right',
            'trigger_text' => 'BOOK NOW',
            'primary_color' => '#f97316',
            'inline' => 'false',
            'id' => 'wp-shortcode-' . wp_generate_uuid4(),
        ), $atts, 'heiwa_booking');
        
        // Generate unique widget ID
        $widget_id = 'heiwa-widget-' . sanitize_key($atts['id']);
        
        // Determine CSS classes
        $classes = array('heiwa-react-widget-container');
        if (filter_var($atts['inline'], FILTER_VALIDATE_BOOLEAN)) {
            $classes[] = 'heiwa-position-inline';
        } else {
            $classes[] = 'heiwa-position-' . sanitize_key($atts['position']);
        }
        
        ob_start();
        ?>
        <!-- Heiwa React Booking Widget (Minimal) -->
        <div
            id="<?php echo esc_attr($widget_id); ?>"
            class="<?php echo esc_attr(implode(' ', $classes)); ?>"
            data-widget-id="<?php echo esc_attr($atts['id']); ?>"
            data-build-id="react-widget-1757864064024"
            data-position="<?php echo esc_attr($atts['position']); ?>"
            data-primary-color="<?php echo esc_attr($atts['primary_color']); ?>"
            data-trigger-text="<?php echo esc_attr($atts['trigger_text']); ?>"
            data-inline="<?php echo esc_attr($atts['inline']); ?>"
        >
            <!-- React widget will auto-initialize here -->
        </div>
        
        <style>
            #<?php echo esc_attr($widget_id); ?> {
                --heiwa-primary-color: <?php echo esc_attr($atts['primary_color']); ?>;
                --heiwa-primary-hover: <?php echo esc_attr($this->adjust_brightness($atts['primary_color'], -20)); ?>;
            }
        </style>
        <?php
        
        $output = ob_get_clean();
        error_log('Heiwa Minimal: Shortcode output length: ' . strlen($output));
        return $output;
    }
    
    private function adjust_brightness($hex, $percent) {
        // Simple brightness adjustment
        $hex = str_replace('#', '', $hex);
        if (strlen($hex) !== 6) return $hex;
        
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        $r = max(0, min(255, $r + ($r * $percent / 100)));
        $g = max(0, min(255, $g + ($g * $percent / 100)));
        $b = max(0, min(255, $b + ($b * $percent / 100)));
        
        return sprintf('#%02x%02x%02x', $r, $g, $b);
    }
}

/**
 * Initialize the minimal plugin
 */
function heiwa_minimal_init() {
    error_log('Heiwa Minimal: Plugin initializing');
    new Heiwa_Minimal_Shortcode();
    error_log('Heiwa Minimal: Plugin initialized');
}

// Hook into WordPress
add_action('plugins_loaded', 'heiwa_minimal_init');

// Log that the minimal plugin is loaded
error_log('Heiwa Minimal: Plugin file loaded');
?>
