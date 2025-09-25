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

        // Provide WordPress configuration for the widget
        wp_localize_script('heiwa-react-dom', 'heiwaWidgetConfig', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('heiwa_widget_nonce'),
            'restBase' => rest_url('heiwa/v1'),
            'pluginUrl' => plugins_url('/', __FILE__),
            'buildId' => 'react-widget-wp-' . time(),
            'settings' => array(
                'apiEndpoint' => home_url('/api'),
                'apiKey' => 'heiwa_wp_test_key_2024_secure_deployment',
                'position' => 'right',
                'primaryColor' => '#f97316',
                'triggerText' => 'BOOK NOW'
            )
        ));

        // Add the React widget inline once React DOM is enqueued
        wp_add_inline_script('heiwa-react-dom', $this->get_react_widget_script());
        
        error_log('Heiwa React Widget: Assets enqueued');
    }

    private function get_react_widget_script() {
        return "
        (function() {
            'use strict';
            
            console.log('🎯 Heiwa React Widget: Loading...');

            // Wait for React to be available
            function waitForReact(callback, attempt = 0) {
                if (typeof window.React !== 'undefined' && typeof window.ReactDOM !== 'undefined') {
                    callback();
                    return;
                }

                if (attempt > 50) {
                    console.error('❌ Heiwa React Widget: React did not become available.');
                    return;
                }

                setTimeout(() => waitForReact(callback, attempt + 1), 100);
            }

            // StandaloneWidget Component (from your existing React code)
            function StandaloneWidget({ config, containerId = 'heiwa-widget', className = '' }) {
                const [isConfigured, setIsConfigured] = window.React.useState(false);
                const [wpConfig, setWpConfig] = window.React.useState(null);
                const [error, setError] = window.React.useState(null);

                window.React.useEffect(() => {
                    const initializeConfig = () => {
                        try {
                            let finalConfig = config;
                            
                            if (!finalConfig && typeof window !== 'undefined') {
                                const globalConfig = window.heiwaWidgetConfig;
                                if (globalConfig) {
                                    finalConfig = globalConfig;
                                }
                            }

                            if (!finalConfig) {
                                throw new Error('WordPress configuration not found. Ensure wp_localize_script is properly configured.');
                            }

                            if (!finalConfig.restBase || !finalConfig.nonce) {
                                throw new Error('Invalid WordPress configuration. Missing required fields.');
                            }

                            setWpConfig(finalConfig);
                            setIsConfigured(true);
                            
                            console.log('🎯 Heiwa Widget: WordPress configuration loaded', {
                                buildId: finalConfig.buildId,
                                restBase: finalConfig.restBase,
                                containerId
                            });

                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : 'Unknown configuration error';
                            setError(errorMessage);
                            console.error('❌ Heiwa Widget Configuration Error:', errorMessage);
                        }
                    };

                    initializeConfig();
                }, [config, containerId]);

                // Error state
                if (error) {
                    return window.React.createElement('div', {
                        className: 'heiwa-widget-error',
                        style: {
                            padding: '20px',
                            border: '2px solid #ef4444',
                            borderRadius: '8px',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            fontFamily: 'system-ui, sans-serif'
                        }
                    }, [
                        window.React.createElement('h4', {
                            key: 'title',
                            style: { margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }
                        }, 'Heiwa Booking Widget Error'),
                        window.React.createElement('p', {
                            key: 'message',
                            style: { margin: '0', fontSize: '14px' }
                        }, error)
                    ]);
                }

                // Loading state
                if (!isConfigured || !wpConfig) {
                    return window.React.createElement('div', {
                        className: 'heiwa-widget-loading',
                        style: {
                            padding: '40px 20px',
                            textAlign: 'center',
                            color: '#6b7280',
                            fontFamily: 'system-ui, sans-serif'
                        }
                    }, [
                        window.React.createElement('div', {
                            key: 'spinner',
                            style: {
                                width: '40px',
                                height: '40px',
                                border: '3px solid #e5e7eb',
                                borderTop: '3px solid #f97316',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 15px'
                            }
                        }),
                        window.React.createElement('p', {
                            key: 'text',
                            style: { margin: '0', fontSize: '14px' }
                        }, 'Loading Heiwa Booking Widget...')
                    ]);
                }

                // Main widget component
                return window.React.createElement('div', {
                    id: containerId,
                    className: 'heiwa-react-widget-container ' + (className || ''),
                    'data-widget-id': containerId,
                    'data-build-id': wpConfig.buildId
                }, [
                    window.React.createElement(BookingWidget, {
                        key: 'widget',
                        className: 'heiwa-wordpress-widget'
                    })
                ]);
            }

            // BookingWidget Component (simplified version of your beautiful widget)
            function BookingWidget({ className = '' }) {
                const [isOpen, setIsOpen] = window.React.useState(false);
                const [currentStep, setCurrentStep] = window.React.useState(1);
                const [selectedExperience, setSelectedExperience] = window.React.useState(null);

                // Handle body scroll lock
                window.React.useEffect(() => {
                    if (isOpen) {
                        document.body.style.overflow = 'hidden';
                        document.body.classList.add('heiwa-modal-open');
                    } else {
                        document.body.style.overflow = '';
                        document.body.classList.remove('heiwa-modal-open');
                    }

                    return () => {
                        document.body.style.overflow = '';
                        document.body.classList.remove('heiwa-modal-open');
                    };
                }, [isOpen]);

                const experiences = [
                    {
                        id: 'room',
                        title: 'Book a Room',
                        price: '€45',
                        description: 'Choose your dates and accommodation. Perfect for flexible stays.',
                        features: ['Flexible dates', 'Choose your room', 'Self-guided experience'],
                        image: '🏠'
                    },
                    {
                        id: 'surf-week',
                        title: 'All-Inclusive Surf Week',
                        price: '€599',
                        description: 'Join our structured surf camp programs with coaching and community.',
                        features: ['Professional coaching', 'All meals included', 'Structured program'],
                        image: '🏄‍♂️'
                    }
                ];

                const experienceCards = experiences.map((exp, index) => {
                    const featureChips = exp.features.map((feature, idx) =>
                        window.React.createElement('span', {
                            key: idx,
                            style: {
                                fontSize: '12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                color: 'white',
                                backdropFilter: 'blur(4px)'
                            }
                        }, feature)
                    );

                    return window.React.createElement('button', {
                        key: exp.id,
                        onClick: () => setSelectedExperience(exp),
                        style: {
                            position: 'relative',
                            width: '100%',
                            padding: '24px',
                            borderRadius: '12px',
                            border: selectedExperience?.id === exp.id ? '2px solid #f97316' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.7s ease-out',
                            overflow: 'hidden',
                            backgroundImage: exp.id === 'surf-week'
                                ? 'linear-gradient(135deg, rgba(236, 104, 28, 0.9) 0%, rgba(236, 104, 28, 0.7) 100%), url(\'/room1.jpg\')'
                                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(59, 130, 246, 0.7) 100%), url(\'/room2.webp\')',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            color: 'white',
                            boxShadow: selectedExperience?.id === exp.id
                                ? '0 8px 25px rgba(249, 115, 22, 0.3)'
                                : '0 4px 12px rgba(0, 0, 0, 0.1)',
                            transform: selectedExperience?.id === exp.id ? 'scale(1.02) translateY(-2px)' : 'scale(1)'
                        }
                    }, [
                        window.React.createElement('div', {
                            key: 'card-content',
                            style: {
                                position: 'relative',
                                zIndex: 2
                            }
                        }, [
                            window.React.createElement('div', {
                                key: 'header',
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px'
                                }
                            }, [
                                window.React.createElement('span', {
                                    key: 'icon',
                                    style: { fontSize: '24px' }
                                }, exp.image),
                                window.React.createElement('div', { key: 'info' }, [
                                    window.React.createElement('h4', {
                                        key: 'title',
                                        style: {
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            margin: 0,
                                            color: 'white'
                                        }
                                    }, exp.title),
                                    window.React.createElement('p', {
                                        key: 'price',
                                        style: {
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: 'rgba(255, 255, 255, 0.9)',
                                            margin: '4px 0 0'
                                        }
                                    }, 'From ' + exp.price)
                                ])
                            ]),
                            window.React.createElement('p', {
                                key: 'description',
                                style: {
                                    fontSize: '14px',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    marginBottom: '12px',
                                    lineHeight: '1.5'
                                }
                            }, exp.description),
                            window.React.createElement('div', {
                                key: 'features',
                                style: {
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '8px'
                                }
                            }, featureChips)
                        ])
                    ]);
                });

                if (!isOpen) {
                    return window.React.createElement('button', {
                        onClick: () => setIsOpen(true),
                        style: {
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
                            zIndex: 999999,
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '12px 20px',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                            transition: 'all 0.3s ease',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }
                    }, [
                        window.React.createElement('span', { key: 'icon' }, '🏄‍♂️'),
                        window.React.createElement('span', { key: 'text' }, 'BOOK NOW')
                    ]);
                }

                return window.React.createElement('div', {
                    style: {
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end', // Changed from 'center' to 'flex-end'
                        padding: '0', // Remove padding for full-height panel
                        backdropFilter: 'blur(4px)'
                    },
                    onClick: (e) => e.target === e.currentTarget && setIsOpen(false)
                }, [
                    window.React.createElement('div', {
                        key: 'panel',
                        style: {
                            position: 'relative',
                            width: '100%',
                            maxWidth: '28rem', // 448px - matches your React widget
                            height: '100%', // Full height
                            backgroundColor: 'white',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                            animation: 'slideInFromRight 0.5s ease-out'
                        }
                    }, [
                        // Header
                        window.React.createElement('div', {
                            key: 'header',
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '24px',
                                borderBottom: '1px solid #f3f4f6',
                                background: 'linear-gradient(to right, #f9fafb, white)'
                            }
                        }, [
                            window.React.createElement('h2', {
                                key: 'title',
                                style: {
                                    fontSize: '20px',
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    margin: 0
                                }
                            }, 'Book Your Surf Adventure'),
                            window.React.createElement('button', {
                                key: 'close',
                                onClick: () => setIsOpen(false),
                                style: {
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    transition: 'all 0.2s'
                                }
                            }, '×')
                        ]),
                        
                        // Progress Indicator
                        window.React.createElement('div', {
                            key: 'progress',
                            style: {
                                padding: '16px 24px',
                                backgroundColor: 'rgba(249, 250, 251, 0.5)',
                                borderBottom: '1px solid #f3f4f6'
                            }
                        }, [
                            window.React.createElement('div', {
                                key: 'progress-steps',
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }
                            }, [
                                // Step 1
                                window.React.createElement('div', {
                                    key: 'step-1',
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        flex: 1
                                    }
                                }, [
                                    window.React.createElement('div', {
                                        key: 'step-number',
                                        style: {
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: currentStep === 1 ? '#f97316' : '#e5e7eb',
                                            color: currentStep === 1 ? 'white' : '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            marginBottom: '8px'
                                        }
                                    }, '1'),
                                    window.React.createElement('span', {
                                        key: 'step-name',
                                        style: {
                                            fontSize: '12px',
                                            color: currentStep === 1 ? '#f97316' : '#6b7280',
                                            fontWeight: currentStep === 1 ? '600' : '400'
                                        }
                                    }, 'Experience')
                                ]),
                                // Step 2
                                window.React.createElement('div', {
                                    key: 'step-2',
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        flex: 1
                                    }
                                }, [
                                    window.React.createElement('div', {
                                        key: 'step-number',
                                        style: {
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: currentStep === 2 ? '#f97316' : '#e5e7eb',
                                            color: currentStep === 2 ? 'white' : '#6b7280',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            marginBottom: '8px'
                                        }
                                    }, '2'),
                                    window.React.createElement('span', {
                                        key: 'step-name',
                                        style: {
                                            fontSize: '12px',
                                            color: currentStep === 2 ? '#f97316' : '#6b7280',
                                            fontWeight: currentStep === 2 ? '600' : '400'
                                        }
                                    }, 'Options')
                                ])
                            ])
                        ]),
                        
                        // Content - Scrollable area
                        window.React.createElement('div', {
                            key: 'content',
                            style: { 
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px'
                            }
                        }, [
                            // Header
                            window.React.createElement('div', {
                                key: 'content-header',
                                style: {
                                    textAlign: 'center',
                                    marginBottom: '24px'
                                }
                            }, [
                                window.React.createElement('h3', {
                                    key: 'title',
                                    style: {
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: '#111827',
                                        margin: '0 0 8px 0'
                                    }
                                }, 'Choose Your Adventure'),
                                window.React.createElement('p', {
                                    key: 'subtitle',
                                    style: {
                                        fontSize: '16px',
                                        color: '#6b7280',
                                        margin: 0
                                    }
                                }, 'How would you like to experience Heiwa House?')
                            ]),
                            
                            // Experience Cards
                            window.React.createElement('div', {
                                key: 'experience-cards',
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }
                            }, experienceCards),
                        ]),
                        
                        // Footer Navigation
                        window.React.createElement('div', {
                            key: 'footer',
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '24px',
                                borderTop: '1px solid #f3f4f6',
                                background: 'linear-gradient(to right, white, #f9fafb)'
                            }
                        }, [
                            window.React.createElement('button', {
                                key: 'back',
                                onClick: () => setCurrentStep(Math.max(1, currentStep - 1)),
                                disabled: currentStep === 1,
                                style: {
                                    padding: '8px 16px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    color: currentStep === 1 ? '#9ca3af' : '#6b7280',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                                    transition: 'color 0.2s'
                                }
                            }, 'Back'),
                            
                            window.React.createElement('div', {
                                key: 'total-section',
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px'
                                }
                            }, [
                                window.React.createElement('div', {
                                    key: 'total',
                                    style: {
                                        textAlign: 'right'
                                    }
                                }, [
                                    window.React.createElement('div', {
                                        key: 'amount',
                                        style: {
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#111827'
                                        }
                                    }, '€0'),
                                    window.React.createElement('div', {
                                        key: 'label',
                                        style: {
                                            fontSize: '12px',
                                            color: '#6b7280'
                                        }
                                    }, 'Total')
                                ]),
                                
                                window.React.createElement('button', {
                                    key: 'next',
                                    onClick: () => setCurrentStep(Math.min(2, currentStep + 1)),
                                    disabled: !selectedExperience && currentStep === 1,
                                    style: {
                                        padding: '12px 24px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: 'white',
                                        background: (!selectedExperience && currentStep === 1) 
                                            ? 'linear-gradient(to right, #d1d5db, #9ca3af)' 
                                            : 'linear-gradient(to right, #f97316, #ea580c)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (!selectedExperience && currentStep === 1) ? 'not-allowed' : 'pointer',
                                        boxShadow: (!selectedExperience && currentStep === 1) 
                                            ? 'none' 
                                            : '0 4px 12px rgba(249, 115, 22, 0.4)',
                                        transition: 'all 0.3s ease-out',
                                        transform: (!selectedExperience && currentStep === 1) ? 'none' : 'translateY(0)'
                                    }
                                }, currentStep === 2 ? 'Complete Booking' : 'Next')
                            ])
                        ])
                    ])
                ]);
            }

            // Initialize widgets
            function initializeWidgets() {
                console.log('🎯 Initializing Heiwa React widgets...');
                console.log('🎯 React available:', typeof window.React !== 'undefined');
                console.log('🎯 ReactDOM available:', typeof window.ReactDOM !== 'undefined');
                
                const containers = document.querySelectorAll('.heiwa-react-widget-container:not([data-initialized])');
                console.log('🎯 Found containers:', containers.length);
                
                containers.forEach(function(container) {
                    container.setAttribute('data-initialized', 'true');
                    
                    const config = window.heiwaWidgetConfig || {};
                    console.log('🎯 Config:', config);
                    
                    try {
                        if (window.ReactDOM.createRoot) {
                            // React 18+
                            const root = window.ReactDOM.createRoot(container);
                            root.render(window.React.createElement(StandaloneWidget, { 
                                config: config,
                                containerId: container.id 
                            }));
                        } else {
                            // React 17
                            window.ReactDOM.render(window.React.createElement(StandaloneWidget, { 
                                config: config,
                                containerId: container.id 
                            }), container);
                        }
                        
                        console.log('🎯 Heiwa React Widget: Successfully mounted to container:', container.id);
                    } catch (error) {
                        console.error('🎯 Heiwa React Widget: Mount error:', error);
                    }
                });

                // Add CSS for animations
                if (!document.getElementById('heiwa-widget-styles')) {
                    const style = document.createElement('style');
                    style.id = 'heiwa-widget-styles';
                    style.textContent = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        @keyframes slideInFromRight {
                            0% { 
                                transform: translateX(100%); 
                                opacity: 0;
                            }
                            100% { 
                                transform: translateX(0); 
                                opacity: 1;
                            }
                        }
                        .heiwa-react-widget-container {
                            position: relative;
                            z-index: 999999;
                        }
                        .heiwa-react-widget-container * {
                            box-sizing: border-box;
                        }
                        /* Ensure body doesn't scroll when modal is open */
                        body.heiwa-modal-open {
                            overflow: hidden !important;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
            
            // --- INITIALIZATION ---
            function run() {
                console.log('🚀 Heiwa Widget: DOM ready, waiting for React...');
                waitForReact(() => {
                    console.log('🚀 Heiwa Widget: React detected, initializing widgets.');
                    initializeWidgets();
                });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', run);
            } else {
                // DOM is already ready
                run();
            }

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
