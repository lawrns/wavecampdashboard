'use client';

import { useEffect } from 'react';
import { StandaloneWidget } from '../../components/BookingWidget/StandaloneWidget';



/**
 * WordPress React Widget Integration Test Page
 * 
 * This page simulates how the React widget would work when integrated
 * into a WordPress site using the build files we just created.
 */
export default function WordPressWidgetTestPage() {
  // WordPress configuration for the widget
  const wpConfig = {
    ajaxUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/wp-json/wp/v2/`,
    nonce: 'wp_rest_nonce_12345',
    restBase: `${typeof window !== 'undefined' ? window.location.origin : ''}/wp-json/heiwa/v1`,
    pluginUrl: '/wordpress-plugin/heiwa-booking-widget/',
    buildId: 'react-widget-1757864064024',
    settings: {
      apiEndpoint: `${typeof window !== 'undefined' ? window.location.origin : ''}/api`,
      apiKey: 'heiwa_wp_test_key_2024_secure_deployment',
      position: 'right',
      primaryColor: '#f97316',
      triggerText: 'BOOK NOW'
    }
  };

  useEffect(() => {
    // Also set global config for compatibility
    if (typeof window !== 'undefined') {
      (window as any).heiwaWidgetConfig = wpConfig;
      console.log('🎯 WordPress React Widget Test: Configuration loaded');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simulate WordPress site header */}
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              WordPress Site with Heiwa Widget
            </h1>
            <div className="flex items-center gap-6">
              <div className="text-sm text-gray-600">
                React Widget Integration Test
              </div>
              {/* Note: Book Now button is rendered in the shortcode section below */}
            </div>
          </div>
        </div>
      </header>

      {/* Simulate WordPress content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Our Surf Camp
          </h2>
          <div className="prose prose-lg text-gray-700 space-y-4">
            <p>
              Experience the ultimate surf adventure with our world-class surf camps. 
              From beginner-friendly waves to advanced coaching, we have something for everyone.
            </p>
            <p>
              Our camps are located in some of the most beautiful surf destinations around 
              the world, offering perfect waves, expert instruction, and an amazing community 
              of fellow surfers.
            </p>
            <p>
              Ready to book your surf adventure? Use our booking widget to get started!
            </p>
          </div>
        </article>

        {/* WordPress Shortcode Simulation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            WordPress Shortcode Integration
          </h3>
          <p className="text-blue-800 mb-4">
            The following widget is rendered using the WordPress shortcode: 
            <code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">
              [heiwa_booking]
            </code>
          </p>
          
          {/* React Widget Container - This simulates WordPress shortcode output */}
          <div
            id="heiwa-booking-widget-test"
            className="heiwa-react-widget-container heiwa-position-inline"
            data-widget-id="test-widget"
            data-build-id="react-widget-1757864064024"
          >
            {/* Actual React Widget - Same as the working widget that was there before */}
            <StandaloneWidget
              config={wpConfig}
              containerId="heiwa-booking-widget-test"
              className="wordpress-integration-test"
            />
          </div>
        </div>

        {/* Integration Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            ✅ Integration Status
          </h3>
          <div className="space-y-2 text-green-800">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              React build files created in WordPress plugin directory
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              WordPress shortcode updated to detect and use React build
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              wp_localize_script configuration implemented
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              WordPress theme compatibility styles included
            </div>
          </div>
        </div>
      </main>

      {/* Simulate WordPress footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 Heiwa House Surf Camps - WordPress React Widget Integration Test
          </p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
