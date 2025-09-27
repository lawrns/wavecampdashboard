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

// Import components and hooks
import { ExperienceSelection } from "./components/BookingWidget/steps/ExperienceSelection";
import { OptionSelection } from "./components/BookingWidget/steps/OptionSelection";
import { SurfWeekRoomSelection } from "./components/BookingWidget/steps/SurfWeekRoomSelection";
import { GuestDetails } from "./components/BookingWidget/steps/GuestDetails";
import { RoomAssignment } from "./components/BookingWidget/steps/RoomAssignment";
import { AddOns } from "./components/BookingWidget/steps/AddOns";
import { ReviewAndPay } from "./components/BookingWidget/steps/ReviewAndPay";
import { BookingProvider, useBooking } from "./components/BookingWidget/hooks/BookingProvider";

// Main BookingWidget component
function BookingWidgetInner() {
  const { state, actions } = useBooking();

  if (!state || !actions) {
    return React.createElement('div', null, 'Loading...');
  }

  // Render different steps based on current step and experience type
  const renderCurrentStep = () => {
    const stepComponents = {
      1: ExperienceSelection,
      2: state.experienceType === 'surf-week' ? SurfWeekRoomSelection : OptionSelection,
      3: state.experienceType === 'surf-week' ? GuestDetails : RoomAssignment,
      4: state.experienceType === 'surf-week' ? AddOns : GuestDetails,
      5: state.experienceType === 'surf-week' ? ReviewAndPay : AddOns,
      6: ReviewAndPay,
      7: () => React.createElement('div', {
        style: { textAlign: 'center', padding: '40px' }
      }, [
        React.createElement('div', {
          key: 'success',
          style: {
            width: '64px',
            height: '64px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: '32px'
          }
        }, '✓'),
        React.createElement('h3', {
          key: 'title',
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }
        }, 'Booking Confirmed!'),
        React.createElement('p', {
          key: 'message',
          style: { color: '#6b7280', fontSize: '16px' }
        }, `Your booking #${state.bookingSuccess?.bookingNumber} has been confirmed.`)
      ])
    };

    const StepComponent = stepComponents[state.currentStep as keyof typeof stepComponents];
    return StepComponent ? React.createElement(StepComponent, { state, actions }) : null;
  };

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px'
    }
  },
    React.createElement('div', {
      style: {
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }
    }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid #e5e7eb',
          flexShrink: 0
        }
      }, [
        React.createElement('h2', {
          key: 'title',
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111827' }
        }, 'Book Your Surf Adventure'),
        React.createElement('button', {
          key: 'close',
          onClick: () => window.location.reload(), // Simple close for demo
          style: {
            color: '#6b7280',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '6px',
            border: 'none',
            background: 'none',
            transition: 'all 0.2s'
          }
        }, '✕')
      ]),

      // Progress Indicator
      state.currentStep < 7 && React.createElement('div', {
        key: 'progress',
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #f3f4f6',
          flexShrink: 0
        }
      },
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        }, [
          ['Experience', 'Options', 'Details', 'Add-ons', 'Review'].map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === state.currentStep;
            const isCompleted = stepNum < state.currentStep;
            return React.createElement('div', {
              key: label,
              style: { display: 'flex', alignItems: 'center' }
            }, [
              React.createElement('div', {
                key: 'circle',
                style: {
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  backgroundColor: isCompleted ? '#10b981' : isActive ? '#f97316' : '#d1d5db',
                  color: isCompleted || isActive ? 'white' : '#6b7280',
                  transition: 'all 0.3s'
                }
              }, isCompleted ? '✓' : stepNum),
              React.createElement('span', {
                key: 'label',
                style: {
                  marginLeft: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: isActive ? '#f97316' : isCompleted ? '#10b981' : '#6b7280'
                }
              }, label),
              index < 4 && React.createElement('div', {
                key: 'line',
                style: {
                  width: '32px',
                  height: '1px',
                  backgroundColor: '#d1d5db',
                  margin: '0 16px'
                }
              })
            ]);
          })
        ])
      ),

      // Content
      React.createElement('div', {
        key: 'content',
        style: {
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }
      }, renderCurrentStep()),

      // Footer
      state.currentStep < 7 && React.createElement('div', {
        key: 'footer',
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }
      }, [
        React.createElement('button', {
          key: 'back',
          onClick: actions.prevStep,
          disabled: state.currentStep === 1,
          style: {
            padding: '8px 16px',
            color: state.currentStep === 1 ? '#9ca3af' : '#374151',
            background: 'none',
            border: 'none',
            cursor: state.currentStep === 1 ? 'not-allowed' : 'pointer',
            transition: 'color 0.2s'
          }
        }, 'Back'),

        React.createElement('span', {
          key: 'step-info',
          style: { fontSize: '14px', color: '#6b7280' }
        }, `Step ${state.currentStep} of 6`),

        React.createElement('button', {
          key: 'next',
          onClick: actions.nextStep,
          disabled: !actions.canProceedToNextStep(),
          style: {
            padding: '8px 24px',
            backgroundColor: actions.canProceedToNextStep() ? '#f97316' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: actions.canProceedToNextStep() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, [
          React.createElement('span', { key: 'text' },
            state.currentStep === 6 ? 'Complete Booking' : 'Next'
          ),
          state.currentStep < 6 && React.createElement('span', { key: 'arrow' }, '→')
        ])
      ])
    ])
  );
}

function BookingWidget() {
  return React.createElement(BookingProvider, null,
    React.createElement(BookingWidgetInner)
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
