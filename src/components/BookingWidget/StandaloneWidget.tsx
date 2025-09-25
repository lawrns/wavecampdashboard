'use client';

import React, { useEffect, useState } from 'react';
import { BookingWidget } from './BookingWidget';

// WordPress configuration interface
interface WordPressConfig {
  ajaxUrl: string;
  nonce: string;
  restBase: string;
  pluginUrl: string;
  buildId: string;
  settings: {
    apiEndpoint: string;
    apiKey: string;
    position: string;
    primaryColor: string;
    triggerText: string;
  };
}

interface StandaloneWidgetProps {
  config?: WordPressConfig;
  containerId?: string;
  className?: string;
}

/**
 * Standalone React Widget for WordPress Integration
 * 
 * This component wraps the main BookingWidget and provides WordPress-specific
 * configuration and initialization logic.
 */
export function StandaloneWidget({ 
  config, 
  containerId = 'heiwa-widget',
  className = '' 
}: StandaloneWidgetProps) {
  const [isConfigured, setIsConfigured] = useState(false);
  const [wpConfig, setWpConfig] = useState<WordPressConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize WordPress configuration
    const initializeConfig = () => {
      try {
        // Get config from props or global WordPress object
        let finalConfig = config;
        
        if (!finalConfig && typeof window !== 'undefined') {
          // Try to get config from WordPress localized script
          const globalConfig = (window as any).heiwaWidgetConfig;
          if (globalConfig) {
            finalConfig = globalConfig;
          }
        }

        if (!finalConfig) {
          throw new Error('WordPress configuration not found. Ensure wp_localize_script is properly configured.');
        }

        // Validate required configuration
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
    return (
      <div className="heiwa-widget-error" style={{
        padding: '20px',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
          Heiwa Booking Widget Error
        </h4>
        <p style={{ margin: '0', fontSize: '14px' }}>
          {error}
        </p>
        <details style={{ marginTop: '10px', fontSize: '12px' }}>
          <summary style={{ cursor: 'pointer' }}>Technical Details</summary>
          <pre style={{ 
            marginTop: '5px', 
            padding: '10px', 
            backgroundColor: '#fee2e2', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            Container ID: {containerId}
            {wpConfig && `
Build ID: ${wpConfig.buildId}
REST Base: ${wpConfig.restBase}
Plugin URL: ${wpConfig.pluginUrl}`}
          </pre>
        </details>
      </div>
    );
  }

  // Loading state
  if (!isConfigured || !wpConfig) {
    return (
      <div className="heiwa-widget-loading" style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#6b7280',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e5e7eb',
          borderTop: '3px solid #f97316',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 15px'
        }}></div>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Loading Heiwa Booking Widget...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render the main BookingWidget with WordPress configuration
  return (
    <div 
      id={containerId}
      className={`heiwa-react-widget-container ${className}`}
      data-widget-id={containerId}
      data-build-id={wpConfig.buildId}
    >
      <BookingWidget 
        className="heiwa-wordpress-widget"
      />
      
      {/* WordPress integration styles */}
      <style>{`
        .heiwa-react-widget-container {
          position: relative;
          z-index: 999999;
        }
        
        .heiwa-wordpress-widget {
          /* Ensure widget works in WordPress themes */
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        /* WordPress theme compatibility */
        .heiwa-react-widget-container *,
        .heiwa-react-widget-container *::before,
        .heiwa-react-widget-container *::after {
          box-sizing: border-box;
        }
        
        /* Override WordPress theme styles that might interfere */
        .heiwa-react-widget-container button {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          outline: inherit;
        }

        /* Enhanced CTA buttons with premium styling */
        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500 {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%) !important;
          padding: revert !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 4px 14px 0 rgba(249, 115, 22, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          position: relative !important;
          overflow: hidden !important;
          transform: translateY(0) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: -100% !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent) !important;
          transition: left 0.6s ease !important;
        }

        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500:hover {
          background: linear-gradient(135deg, #ea580c 0%, #dc2626 50%, #b91c1c 100%) !important;
          box-shadow: 0 8px 25px 0 rgba(249, 115, 22, 0.4), 0 4px 12px 0 rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px) scale(1.02) !important;
        }

        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500:hover::before {
          left: 100% !important;
        }

        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500:active {
          transform: translateY(0) scale(1.01) !important;
          transition: all 0.1s ease !important;
        }

        .heiwa-react-widget-container button.bg-gradient-to-r.from-orange-500:disabled {
          background: linear-gradient(135deg, #d1d5db 0%, #9ca3af 50%, #6b7280 100%) !important;
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1) !important;
          transform: none !important;
          cursor: not-allowed !important;
        }

        /* Restore proper padding for card components */
        .heiwa-react-widget-container button.p-4 {
          padding: 1rem !important;
        }

        .heiwa-react-widget-container button.p-6 {
          padding: 1.5rem !important;
        }
        
        /* Ensure proper z-index stacking and modal behavior */
        .heiwa-booking-widget {
          z-index: 999999 !important;
        }

        /* Force modal overlay to work in WordPress */
        .heiwa-react-widget-container .fixed.inset-0 {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 999999 !important;
        }

        /* Ensure backdrop works */
        .heiwa-react-widget-container .bg-black\\/50 {
          background-color: rgba(0, 0, 0, 0.5) !important;
        }

        /* Ensure modal panel positioning */
        .heiwa-react-widget-container .slide-in-from-right {
          transform: translateX(0) !important;
        }
        
        /* Force widget container to not create stacking context */
        .heiwa-react-widget-container {
          position: static !important;
          z-index: auto !important;
          transform: none !important;
        }

        /* Modal overlay styling - force break out of container */
        .heiwa-modal-overlay {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          background-color: rgba(0, 0, 0, 0.5) !important;
          backdrop-filter: blur(4px) !important;
          /* Force new stacking context */
          transform: translateZ(0) !important;
          will-change: transform !important;
        }

        /* Ensure modal works when body has modal open class */
        body.heiwa-modal-open {
          overflow: hidden !important;
        }

        /* WordPress admin bar compatibility */
        @media screen and (max-width: 782px) {
          .admin-bar .heiwa-booking-widget {
            top: 46px !important;
          }
        }

        @media screen and (min-width: 783px) {
          .admin-bar .heiwa-booking-widget {
            top: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Global export for WordPress
if (typeof window !== 'undefined') {
  (window as any).HeiwaStandaloneWidget = StandaloneWidget;
}

export default StandaloneWidget;
