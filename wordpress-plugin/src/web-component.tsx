// WordPress-compatible Web Component wrapper for React Booking Widget
// Uses Shadow DOM for complete isolation from WordPress environment

// Use global React instances provided by WordPress
declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const ReactDOM = window.ReactDOM;

// Simple test component first
function TestBookingWidget() {
  const [step, setStep] = React.useState(1);
  const [experience, setExperience] = React.useState(null);

  return React.createElement('div', { style: { padding: '20px', border: '1px solid #ccc' } },
    React.createElement('h2', null, 'Test Booking Widget'),
    React.createElement('p', null, 'Step: ' + step),
    React.createElement('p', null, 'Experience: ' + (experience || 'None selected')),
    React.createElement('button', {
      onClick: () => setExperience('room'),
      style: { margin: '5px', padding: '10px' }
    }, 'Select Room'),
    React.createElement('button', {
      onClick: () => setStep(step + 1),
      disabled: !experience,
      style: { margin: '5px', padding: '10px', opacity: experience ? 1 : 0.5 }
    }, 'Next')
  );
}

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
      this.root.render(React.createElement(TestBookingWidget));

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
