<?php
/**
 * Plugin Name: Heiwa React Booking Widget
 * Plugin URI: https://heiwahouse.com
 * Description: React-powered booking widget that provides the full booking experience
 * Version: 1.0.0
 * Author: Heiwa House
 * License: GPL v2 or later
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('HEIWA_REACT_VERSION', '1.0.0');
define('HEIWA_REACT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('HEIWA_REACT_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * React Widget Shortcode Class
 */
class Heiwa_React_Widget_Shortcode {
    
    public function __construct() {
        add_shortcode('heiwa_booking', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        error_log('Heiwa React Widget: Shortcode class initialized');
    }
    
    public function enqueue_assets() {
        $asset_url  = HEIWA_REACT_PLUGIN_URL . 'assets/build/';
        $asset_path = HEIWA_REACT_PLUGIN_DIR . 'assets/build/';
        $bundle_handle = 'heiwa-react-widget-umd';
        $bundle_file   = 'heiwa-widget.umd.js';

        // Ensure React and ReactDOM are available globally
        if (!wp_script_is('heiwa-react', 'registered')) {
            wp_register_script(
                'heiwa-react',
                'https://unpkg.com/react@18/umd/react.production.min.js',
                array(),
                '18.2.0',
                true
            );
        }

        if (!wp_script_is('heiwa-react-dom', 'registered')) {
            wp_register_script(
                'heiwa-react-dom',
                'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
                array('heiwa-react'),
                '18.2.0',
                true
            );
        }

        wp_enqueue_script('heiwa-react');
        wp_enqueue_script('heiwa-react-dom');

        // Enqueue widget CSS for full styling parity
        $tailwind_file = 'heiwa-widget.tailwind.css';
        if (file_exists($asset_path . $tailwind_file)) {
            wp_enqueue_style(
                'heiwa-react-widget-tailwind',
                $asset_url . $tailwind_file,
                array(),
                filemtime($asset_path . $tailwind_file)
            );
        }

        $surf_file = 'heiwa-widget.surf.css';
        if (file_exists($asset_path . $surf_file)) {
            wp_enqueue_style(
                'heiwa-react-widget-surf',
                $asset_url . $surf_file,
                array('heiwa-react-widget-tailwind'),
                filemtime($asset_path . $surf_file)
            );
        }

        // Enqueue the compiled React widget bundle built from the original app
        $bundle_version = HEIWA_REACT_VERSION;
        if (file_exists($asset_path . $bundle_file)) {
            $bundle_version = filemtime($asset_path . $bundle_file);
        }

        wp_enqueue_script(
            $bundle_handle,
            $asset_url . $bundle_file,
            array('heiwa-react-dom'),
            $bundle_version,
            true
        );

        // Determine Heiwa Admin (Next.js) API base for bookings (NOT WordPress)
        // Priority: env var HEIWA_ADMIN_API_BASE -> PHP constant HEIWA_ADMIN_API_BASE -> WordPress option -> sensible local default
        $admin_api_base = getenv('HEIWA_ADMIN_API_BASE');
        if (!$admin_api_base && defined('HEIWA_ADMIN_API_BASE')) {
            $admin_api_base = HEIWA_ADMIN_API_BASE;
        }
        if (!$admin_api_base) {
            $admin_api_base = get_option('heiwa_admin_api_base', 'http://localhost:3005/api');
        }

        // API key for Heiwa Admin (optional). Prefer env var, then constant, else WordPress option.
        $admin_api_key = getenv('HEIWA_ADMIN_API_KEY');
        if (!$admin_api_key && defined('HEIWA_ADMIN_API_KEY')) {
            $admin_api_key = HEIWA_ADMIN_API_KEY;
        }
        if (!$admin_api_key) {
            $admin_api_key = get_option('heiwa_admin_api_key', '');
        }

        // Provide configuration for the widget bundle
        wp_localize_script($bundle_handle, 'heiwaWidgetConfig', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_widget_nonce'),
            'restBase' => rest_url('heiwa/v1'),
            'pluginUrl' => plugins_url('/', __FILE__),
            'buildId' => 'react-widget-wp-' . time(),
            'settings' => array(
                'apiEndpoint' => $admin_api_base,
                'apiKey' => $admin_api_key,
                'position' => 'right',
                'primaryColor' => '#f97316',
                'triggerText' => 'BOOK NOW'
            )
        ));

        // Initialize widgets once the compiled bundle is available
        wp_add_inline_script($bundle_handle, $this->get_react_widget_script(), 'after');
        
        error_log('Heiwa React Widget: Assets enqueued');
    }

    private function get_react_widget_script() {
        return "
        (function() {
            'use strict';
            
            console.log('🎯 Heiwa React Widget: Loading UMD Bundle...');

            // Wait for React and HeiwaWidget UMD bundle to be available
            function waitForDependencies(callback, attempt = 0) {
                if (typeof window.React !== 'undefined' && 
                    typeof window.ReactDOM !== 'undefined' && 
                    typeof window.HeiwaWidget !== 'undefined' &&
                    typeof window.HeiwaWidget.mount === 'function') {
                    callback();
                    return;
                }

                if (attempt > 100) {
                    console.error('❌ Heiwa React Widget: Dependencies not available after 10 seconds.', {
                        React: typeof window.React,
                        ReactDOM: typeof window.ReactDOM,
                        HeiwaWidget: typeof window.HeiwaWidget,
                        mount: window.HeiwaWidget ? typeof window.HeiwaWidget.mount : 'N/A'
                    });
                    return;
                }

                setTimeout(() => waitForDependencies(callback, attempt + 1), 100);
            }

            // Initialize widgets using the UMD bundle
            function initializeWidgets() {
                console.log('🎯 Initializing Heiwa React widgets with UMD bundle...');
                
                const containers = document.querySelectorAll('.heiwa-react-widget-container:not([data-initialized])');
                console.log('🎯 Found containers:', containers.length);
                
                containers.forEach(function(container) {
                    container.setAttribute('data-initialized', 'true');
                    
                    const config = window.heiwaWidgetConfig || {};
                    console.log('🎯 Mounting widget with config:', config);
                    
                    try {
                        // Use the UMD bundle's mount function
                        const root = window.HeiwaWidget.mount(container, config);
                        if (root) {
                            console.log('✅ Heiwa React Widget: Successfully mounted to container:', container.id);
                        } else {
                            console.error('❌ Heiwa React Widget: Mount returned null for container:', container.id);
                        }
                    } catch (error) {
                        console.error('❌ Heiwa React Widget: Mount error:', error);
                    }
                });
            }

            // Initialize when dependencies are ready
            waitForDependencies(function() {
                console.log('✅ All dependencies loaded, initializing widgets...');
                
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', initializeWidgets);
                } else {
                    initializeWidgets();
                }
            });
        })();
        ";
    }

    public function render_shortcode($atts, $content = '') {
        error_log('Heiwa React Widget: Shortcode called');
        
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
        
        ob_start();
        ?>
        <!-- Heiwa React Booking Widget -->
        <div
            id="<?php echo esc_attr($widget_id); ?>"
            class="heiwa-react-widget-container"
            data-widget-id="<?php echo esc_attr($atts['id']); ?>"
            data-position="<?php echo esc_attr($atts['position']); ?>"
            data-primary-color="<?php echo esc_attr($atts['primary_color']); ?>"
            data-trigger-text="<?php echo esc_attr($atts['trigger_text']); ?>"
            data-inline="<?php echo esc_attr($atts['inline']); ?>"
        >
            <!-- React widget will mount here -->
        </div>
        <?php
        
        $output = ob_get_clean();
        error_log('Heiwa React Widget: Shortcode output length: ' . strlen($output));
        return $output;
    }
}

/**
 * Initialize the React widget plugin
 */
function heiwa_react_widget_init() {
    error_log('Heiwa React Widget: Plugin initializing');
    new Heiwa_React_Widget_Shortcode();
    error_log('Heiwa React Widget: Plugin initialized');
}

// Hook into WordPress
add_action('plugins_loaded', 'heiwa_react_widget_init');

error_log('Heiwa React Widget: Plugin file loaded');
?>
