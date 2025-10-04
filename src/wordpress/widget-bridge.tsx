// WordPress React Integration Bridge
// This ensures we use the WordPress-provided React instance consistently

import React from 'react';
import ReactDOM from 'react-dom';
import { StandaloneWidget } from '../components/BookingWidget/StandaloneWidget';

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
    heiwaWidgetConfig: any;
    HeiwaWidget: any;
    initHeiwaWidget: any;
  }
}

// Validate React availability
function validateReactEnvironment(): boolean {
  if (typeof window === 'undefined') {
    console.error('HeiwaWidget: Window not available');
    return false;
  }

  if (!window.React) {
    console.error('HeiwaWidget: React not available on window');
    return false;
  }

  if (!window.ReactDOM) {
    console.error('HeiwaWidget: ReactDOM not available on window');
    return false;
  }

  // Verify essential React hooks are available
  if (!window.React.useReducer || !window.React.useCallback || !window.React.useEffect) {
    console.error('HeiwaWidget: React hooks not available');
    return false;
  }

  return true;
}

// Use WordPress-provided React globals with validation
function getReactInstance() {
  if (!validateReactEnvironment()) {
    throw new Error('React environment not properly initialized');
  }
  return window.React;
}

function getReactDOMInstance() {
  if (!validateReactEnvironment()) {
    throw new Error('ReactDOM environment not properly initialized');
  }
  return window.ReactDOM;
}

// Include vanilla JavaScript booking widget directly
// This completely replaces React state management with direct DOM manipulation

export type HeiwaWidgetConfig = any;
export type HeiwaWidgetContainer = string | HTMLElement;

function resolveContainer(target: HeiwaWidgetContainer): HTMLElement | null {
  if (typeof target === "string") return document.getElementById(target);
  return (target as HTMLElement) || null;
}

function mount(target: HeiwaWidgetContainer, config?: HeiwaWidgetConfig) {
  try {
    const el = resolveContainer(target);
    if (!el) {
      console.error("HeiwaWidget: container not found", target);
      return null;
    }

    const cfg = config || window.heiwaWidgetConfig || {};
    const containerId = el.id || "heiwa-widget";

    console.log('🎯 HeiwaWidget: Mounting React StandaloneWidget to:', containerId);

    // Use WordPress-provided React to mount StandaloneWidget
    const React = getReactInstance();
    const ReactDOM = getReactDOMInstance();

    // Create React element with simplified config
    const widgetConfig = {
      apiEndpoint: cfg.apiEndpoint || cfg.settings?.apiEndpoint,
      apiKey: cfg.apiKey || cfg.settings?.apiKey,
      position: cfg.position || cfg.settings?.position || 'right',
      primaryColor: cfg.primaryColor || cfg.settings?.primaryColor || '#f97316',
      triggerText: cfg.triggerText || cfg.settings?.triggerText || 'Book Your Surf Trip',
      maxGuests: cfg.maxGuests || cfg.settings?.maxGuests || 10
    };

    // Use StandaloneWidget for WordPress integration with proper config structure
    const standaloneConfig = {
      ajaxUrl: cfg.ajaxUrl || '',
      nonce: cfg.nonce || 'wp_rest',
      restBase: cfg.restBase || '/wp-json/wp/v2/',
      pluginUrl: cfg.pluginUrl || '',
      buildId: cfg.buildId || 'wp-build',
      settings: {
        apiEndpoint: cfg.apiEndpoint || cfg.settings?.apiEndpoint,
        apiKey: cfg.apiKey || cfg.settings?.apiKey,
        position: cfg.position || cfg.settings?.position || 'right',
        primaryColor: cfg.primaryColor || cfg.settings?.primaryColor || '#f97316',
        triggerText: cfg.triggerText || cfg.settings?.triggerText || 'Book Your Surf Trip'
      }
    };

    const widgetElement = React.createElement(StandaloneWidget, {
      config: standaloneConfig,
      containerId: containerId,
      className: 'heiwa-wordpress-widget'
    });

    // Mount using appropriate React version
    if (ReactDOM.createRoot) {
      // React 18+
      const root = ReactDOM.createRoot(el);
      root.render(widgetElement);
    } else {
      // React 17
      ReactDOM.render(widgetElement, el);
    }

    console.log('✅ HeiwaWidget: Successfully mounted React widget to container:', containerId);
    return el;

  } catch (error) {
    console.error('❌ HeiwaWidget: Mount error:', error);
    return null;
  }
}

function initHeiwaWidget(containerId: string, config?: HeiwaWidgetConfig) {
  // Backwards-compat global, maps to mount
  return mount(containerId, config);
}

// Custom Element for Web Component integration
class HeiwaBookingWidget extends HTMLElement {
  connectedCallback() {
    console.log('🎯 HeiwaBookingWidget: Custom element connected');

    // Get attributes from the element
    const config = {
      ...window.heiwaWidgetConfig,
      position: this.getAttribute('data-position') || 'right',
      primaryColor: this.getAttribute('data-primary-color') || '#f97316',
      triggerText: this.getAttribute('data-trigger-text') || 'Book Your Surf Trip',
      maxGuests: parseInt(this.getAttribute('data-max-guests') || '10'),
      id: this.getAttribute('data-id') || 'heiwa-widget'
    };

    // Mount the React widget
    mount(this, config);
  }
}

// Register the custom element
if (typeof window !== 'undefined' && window.customElements) {
  if (!window.customElements.get('heiwa-booking-widget')) {
    window.customElements.define('heiwa-booking-widget', HeiwaBookingWidget);
    console.log('✅ HeiwaBookingWidget: Custom element registered');
  }
}

// Expose globals for WordPress with validation
if (typeof window !== 'undefined') {
  window.HeiwaWidget = { mount };
  window.initHeiwaWidget = initHeiwaWidget;

  // Debug helper
  window.HeiwaWidget.validateEnvironment = validateReactEnvironment;

  // Debug info
  console.log('🔍 Widget Debug Info:', {
    customElements: !!window.customElements,
    React: !!window.React,
    ReactDOM: !!window.ReactDOM,
    heiwaWidgetConfig: !!window.heiwaWidgetConfig
  });
}

