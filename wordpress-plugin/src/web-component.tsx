// WordPress-compatible Web Component wrapper for React Booking Widget
// Uses Shadow DOM for complete isolation from WordPress environment

import React from "react";
import ReactDOM from "react-dom/client";
import { BookingWidget } from "./components/BookingWidget/BookingWidget";

class HeiwaBookingWidget extends HTMLElement {
  private root: ReactDOM.Root | null = null;

  connectedCallback() {
    this.initializeWidget();
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private initializeWidget() {
    try {
      // Create shadow DOM for complete isolation
      const shadowRoot = this.attachShadow({ mode: "open" });
      
      // Create mount point
      const mountPoint = document.createElement("div");
      mountPoint.setAttribute("data-heiwa-widget", "web-component");
      shadowRoot.appendChild(mountPoint);

      // Add isolated styles to prevent WordPress CSS conflicts
      const style = document.createElement("style");
      style.textContent = `
        :host {
          display: inline-block;
          width: 100%;
          font-family: inherit;
        }
        
        /* Reset any WordPress styles that might bleed in */
        * {
          box-sizing: border-box;
        }
        
        /* Ensure our widget is properly contained */
        div[data-heiwa-widget] {
          width: 100%;
          min-height: 200px;
        }
      `;
      shadowRoot.appendChild(style);

      // Mount React widget in shadow DOM
      console.log("🎯 Mounting React BookingWidget in Shadow DOM");
      this.root = ReactDOM.createRoot(mountPoint);
      this.root.render(React.createElement(BookingWidget));

    } catch (error) {
      console.error("❌ Failed to initialize Heiwa Booking Widget:", error);
      
      // Fallback: show error in shadow DOM
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.innerHTML = `
        <div style="padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: #f8f9fa; color: #dc3545;">
          <h3>Widget Error</h3>
          <p>Failed to load booking widget. Please try refreshing the page.</p>
        </div>
      `;
    }
  }
}

// Define the custom element only once
if (!customElements.get("heiwa-booking-widget")) {
  console.log("🎯 Registering heiwa-booking-widget custom element");
  customElements.define("heiwa-booking-widget", HeiwaBookingWidget);
}

export default HeiwaBookingWidget;
