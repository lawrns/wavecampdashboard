import React from 'react';
import ReactDOM from 'react-dom/client';
import { mountWidget } from './mount';

interface HeiwaWidgetConfig {
  settings: {
    apiEndpoint: string;
    apiKey: string;
    position: 'right' | 'left' | 'center';
    primaryColor: string;
    triggerText: string;
  };
  pluginUrl: string;
  ajaxUrl?: string;
  nonce?: string;
  restBase?: string;
  buildId?: string;
}

declare global {
  interface Window {
    heiwaWidgetConfig?: HeiwaWidgetConfig;
  }
}

class HeiwaBookingWidget extends HTMLElement {
  private shadow: ShadowRoot;
  private reactRoot: ReactDOM.Root | null = null;
  private isWidgetInitialized = false;
  private stylesLoaded = false;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this.isWidgetInitialized) return;
    this.isWidgetInitialized = true;

    this.initializeWidget();
  }

  disconnectedCallback() {
    this.isWidgetInitialized = false;
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  private initializeWidget() {
    const startTime = performance.now();

    try {
      // Performance: Use requestIdleCallback if available for non-critical initialization
      const initFn = () => {
        // Get configuration from window or element attributes
        const config = this.getConfiguration();

        // Send initialization telemetry
        this.sendTelemetry('widget_init_start', { hasConfig: !!config });

        // Inject CSS into shadow DOM (async, non-blocking)
        this.injectStylesAsync(config);

        // Create container for React with minimal initial content
        const container = document.createElement('div');
        container.setAttribute('data-heiwa-widget', 'container');
        container.style.minHeight = '40px'; // Prevent layout shift
        this.shadow.appendChild(container);

        // Show loading state immediately
        this.renderLoadingState(container);

        // Set up accessibility features
        this.manageFocus();

        // Mount React widget with slight delay to allow CSS to load
        setTimeout(() => {
          this.reactRoot = mountWidget(container, {
            config,
            elementAttributes: this.getElementAttributes()
          });

          // Send successful initialization telemetry
          const initTime = performance.now() - startTime;
          this.sendTelemetry('widget_init_success', {
            initTime: Math.round(initTime),
            hasConfig: !!config,
            hasElementAttrs: Object.keys(this.getElementAttributes()).length > 0
          });
        }, 50); // Small delay for CSS to start loading
      };

      // Use requestIdleCallback for better performance, fallback to setTimeout
      if ('requestIdleCallback' in window) {
        requestIdleCallback(initFn, { timeout: 2000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(initFn, 1);
      }

    } catch (error) {
      // Send error telemetry
      const initTime = performance.now() - startTime;
      this.sendTelemetry('widget_init_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        initTime: Math.round(initTime),
        userAgent: navigator.userAgent,
        url: window.location.href
      });

      console.error('Heiwa Booking Widget initialization failed:', error);
      this.renderErrorFallback();
    }
  }

  private getConfiguration(): HeiwaWidgetConfig | null {
    // Check browser compatibility first
    if (!this.isBrowserCompatible()) {
      console.warn('Heiwa Widget: Browser not supported, widget disabled');
      this.renderBrowserIncompatibleMessage();
      return null;
    }

    // Primary: Window configuration
    if (window.heiwaWidgetConfig) {
      return window.heiwaWidgetConfig;
    }

    // Fallback: Check if we're in development and create mock config
    if (process.env.NODE_ENV === 'development') {
      console.warn('Heiwa Widget: No configuration found, using development defaults');
      return {
        settings: {
          apiEndpoint: 'http://localhost:3005/api',
          apiKey: 'dev-key-123',
          position: 'right',
          primaryColor: '#f97316',
          triggerText: 'Book Your Surf Trip'
        },
        pluginUrl: ''
      };
    }

    return null;
  }

  private isBrowserCompatible(): boolean {
    // Check for required browser features
    const checks = [
      // Custom Elements v1
      () => 'customElements' in window && 'define' in window.customElements,

      // Shadow DOM
      () => 'attachShadow' in document.createElement('div'),

      // ES6 features
      () => typeof Symbol !== 'undefined',
      () => 'Promise' in window,
      () => 'fetch' in window,

      // Modern DOM APIs
      () => 'classList' in document.createElement('div'),
      () => 'addEventListener' in window,

      // CSS features
      () => CSS.supports('display', 'flex'),
      () => CSS.supports('position', 'sticky'),
    ];

    return checks.every(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
  }

  private renderBrowserIncompatibleMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      padding: 16px;
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      color: #92400e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      text-align: center;
    `;

    message.innerHTML = `
      <strong>Browser Update Required</strong><br>
      Please update your browser to use our booking widget.
      <br><small>Supported: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+</small>
    `;

    this.shadow.appendChild(message);

    // Send telemetry about incompatible browser
    this.sendTelemetry('browser_incompatible', {
      userAgent: navigator.userAgent,
      features: {
        customElements: 'customElements' in window,
        shadowDom: 'attachShadow' in document.createElement('div'),
        promises: 'Promise' in window,
        fetch: 'fetch' in window,
      }
    });
  }

  private getElementAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Extract data attributes from the custom element
    Array.from(this.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        const key = attr.name.replace('data-', '');
        attributes[key] = attr.value;
      }
    });

    return attributes;
  }

  private renderLoadingState(container: HTMLElement) {
    // Show minimal loading state to prevent layout shift
    const loadingDiv = document.createElement('div');
    loadingDiv.setAttribute('data-heiwa-loading', 'true');
    loadingDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      color: #6b7280;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      width: 16px;
      height: 16px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #f97316;
      border-radius: 50%;
      animation: heiwa-spin 1s linear infinite;
      margin-right: 8px;
    `;

    const text = document.createElement('span');
    text.textContent = 'Loading...';

    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(text);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes heiwa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    this.shadow.appendChild(style);
    container.appendChild(loadingDiv);
  }

  private injectStylesAsync(config: HeiwaWidgetConfig | null) {
    if (!config) return;

    const pluginUrl = config.pluginUrl || '';

    // Inject CSS asynchronously without blocking
    const cssFiles = [
      {
        href: `${pluginUrl}assets/build/heiwa-widget.tailwind.css`,
        name: 'Tailwind CSS'
      },
      {
        href: `${pluginUrl}assets/build/heiwa-widget.surf.css`,
        name: 'Surf Enhancements CSS'
      }
    ];

    cssFiles.forEach(({ href, name }) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-heiwa-css', name.toLowerCase().replace(' ', '-'));

      // Load CSS asynchronously
      link.onload = () => {
        console.log(`Heiwa Widget: Successfully loaded ${name}`);
      };

      link.onerror = (error) => {
        console.warn(`Heiwa Widget: Failed to load ${name}`, error);
      };

      this.shadow.appendChild(link);
    });

    // Fallback check (less aggressive timing)
    setTimeout(() => {
      this.checkCssLoadedAndFallback();
    }, 3000);
  }

  private injectStyles(config: HeiwaWidgetConfig | null) {
    // Use global flag to prevent any instance from loading CSS multiple times
    if (!config || (window as any).__heiwaStylesLoaded) return;
    (window as any).__heiwaStylesLoaded = true;

    const pluginUrl = config.pluginUrl || '';

    // Inject CSS in specific order for proper cascading
    const cssFiles = [
      {
        href: `${pluginUrl}assets/build/heiwa-widget.tailwind.css`,
        name: 'Tailwind CSS'
      },
      {
        href: `${pluginUrl}assets/build/heiwa-widget.surf.css`,
        name: 'Surf Enhancements CSS'
      }
    ];

    cssFiles.forEach(({ href, name }) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute('data-heiwa-css', name.toLowerCase().replace(' ', '-'));

      link.onload = () => {
        console.log(`Heiwa Widget: Successfully loaded ${name}`);
      };

      link.onerror = (error) => {
        console.warn(`Heiwa Widget: Failed to load ${name}`, error);
        // Don't inject fallback styles here - let individual failures be handled
        // Fallback styles are only injected if all CSS fails to load
      };

      this.shadow.appendChild(link);
    });

    // Set up fallback styles after a delay to check if CSS loaded
    setTimeout(() => {
      this.checkCssLoadedAndFallback();
    }, 2000);
  }

  private checkCssLoadedAndFallback() {
    // Check if any CSS links successfully loaded
    const cssLinks = this.shadow.querySelectorAll('link[data-heiwa-css]');
    const hasLoadedCss = Array.from(cssLinks).some(link => {
      // Check if stylesheet is loaded by checking if it has a sheet property
      const styleSheet = (link as any).sheet;
      return styleSheet && styleSheet.cssRules && styleSheet.cssRules.length > 0;
    });

    if (!hasLoadedCss) {
      console.warn('Heiwa Widget: No CSS loaded successfully, injecting fallback styles');
      this.injectFallbackStyles();
    }
  }

  private injectFallbackStyles() {
    const fallbackStyles = document.createElement('style');
    fallbackStyles.textContent = `
      :host {
        display: block;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      button {
        background: #f97316;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-size: 16px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      button:hover {
        background: #ea580c;
      }

      button:focus {
        outline: 2px solid #f97316;
        outline-offset: 2px;
      }

      .error-message {
        color: #dc2626;
        background: #fef2f2;
        border: 1px solid #fecaca;
        padding: 12px;
        border-radius: 6px;
        margin: 8px 0;
      }
    `;
    this.shadow.appendChild(fallbackStyles);
  }

  private renderErrorFallback() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'Widget configuration error. Please check your WordPress setup.';
    this.shadow.appendChild(errorDiv);
  }

  // Public API for external control (optional)
  public openBookingModal() {
    // This will be implemented when the React component is mounted
    const event = new CustomEvent('openBookingModal', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  public closeBookingModal() {
    const event = new CustomEvent('closeBookingModal', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // Accessibility: Focus management
  private manageFocus() {
    // Store the previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus trap within shadow DOM when modal is open
    this.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeBookingModal();
        // Return focus to trigger element
        if (previouslyFocused && previouslyFocused !== document.body) {
          previouslyFocused.focus();
        }
      }

      // Focus trap: prevent tabbing outside shadow DOM when modal is open
      if (e.key === 'Tab') {
        const modal = this.shadow.querySelector('[role="dialog"]') as HTMLElement;
        if (modal) {
          const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    });

    // Announce widget to screen readers
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'Heiwa Surf Camp Booking Widget');
    this.setAttribute('aria-live', 'polite');
  }

  // Telemetry and error reporting
  private sendTelemetry(event: string, data: Record<string, any>) {
    try {
      // Only send telemetry if not in development and user hasn't opted out
      const config = this.getConfiguration();
      if (config?.settings?.debug || this.shouldSkipTelemetry()) {
        return;
      }

      const telemetryData = {
        event,
        timestamp: new Date().toISOString(),
        widgetVersion: '2.0.0',
        sessionId: this.getSessionId(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        ...data
      };

      // Send to telemetry endpoint if configured
      const telemetryUrl = config?.settings?.telemetryUrl;
      if (telemetryUrl) {
        fetch(telemetryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telemetryData),
          keepalive: true // Send even if page unloads
        }).catch(() => {
          // Silently fail telemetry - don't break user experience
        });
      }

      // Also send to error tracking services if available
      if (event.includes('error') && window.Sentry) {
        window.Sentry.captureMessage(`Heiwa Widget: ${event}`, {
          level: 'error',
          extra: telemetryData
        });
      }

    } catch (error) {
      // Never let telemetry break the widget
      console.warn('Telemetry failed:', error);
    }
  }

  private shouldSkipTelemetry(): boolean {
    // Check for Do Not Track or telemetry opt-out
    return (
      navigator.doNotTrack === '1' ||
      window.location.search.includes('notrack') ||
      localStorage.getItem('heiwa-widget-no-telemetry') === 'true'
    );
  }

  private getSessionId(): string {
    // Generate or retrieve session ID for telemetry correlation
    let sessionId = sessionStorage.getItem('heiwa-widget-session-id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('heiwa-widget-session-id', sessionId);
    }
    return sessionId;
  }

  // Attribute change handling
  static get observedAttributes() {
    return ['data-primary-color', 'data-trigger-text', 'data-position'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.isConnected) {
      // Re-initialize with new attributes
      this.disconnectedCallback();
      this.initializeWidget();
    }
  }
}

// Register the custom element
if (!customElements.get('heiwa-booking-widget')) {
  customElements.define('heiwa-booking-widget', HeiwaBookingWidget);
}

export default HeiwaBookingWidget;
