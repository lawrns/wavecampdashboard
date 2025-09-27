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

// Self-contained BookingWidget for web component
function BookingWidget() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [experience, setExperience] = React.useState(null);

  const openWidget = React.useCallback(() => setIsOpen(true), []);
  const closeWidget = React.useCallback(() => setIsOpen(false), []);

  const selectExperience = React.useCallback((type) => {
    setExperience(type);
  }, []);

  const nextStep = React.useCallback(() => {
    if (step < 4 && experience) {
      setStep(step + 1);
    }
  }, [step, experience]);

  const canProceed = React.useCallback(() => {
    return step === 1 ? !!experience : true;
  }, [step, experience]);

  if (!isOpen) {
    return React.createElement('button', {
      onClick: openWidget,
      style: {
        background: 'linear-gradient(to right, #f97316, #ea580c)',
        color: 'white',
        padding: '12px 24px',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      }
    }, '📅 Book Now');
  }

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
        overflow: 'hidden'
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
          borderBottom: '1px solid #e5e7eb'
        }
      }, [
        React.createElement('h2', {
          key: 'title',
          style: { fontSize: '24px', fontWeight: 'bold', color: '#111827' }
        }, 'Book Your Surf Adventure'),
        React.createElement('button', {
          key: 'close',
          onClick: closeWidget,
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

      // Progress
      React.createElement('div', {
        key: 'progress',
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #f3f4f6'
        }
      },
        React.createElement('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        }, [
          ['Experience', 'Options', 'Add-ons', 'Review'].map((label, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === step;
            const isCompleted = stepNum < step;
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
              index < 3 && React.createElement('div', {
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
        style: { padding: '24px', overflowY: 'auto', maxHeight: '400px' }
      },
        step === 1 ? React.createElement('div', { key: 'step1' }, [
          React.createElement('h3', {
            key: 'title',
            style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
          }, 'Choose Your Adventure'),
          React.createElement('p', {
            key: 'desc',
            style: { color: '#6b7280', marginBottom: '24px' }
          }, 'How would you like to experience Heiwa House?'),

          React.createElement('div', {
            key: 'options',
            style: { display: 'grid', gap: '16px' }
          }, [
            React.createElement('button', {
              key: 'room',
              onClick: () => selectExperience('room'),
              style: {
                padding: '20px',
                border: experience === 'room' ? '2px solid #f97316' : '2px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: experience === 'room' ? '#fff7ed' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }
            }, [
              React.createElement('div', {
                key: 'header',
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }
              }, [
                React.createElement('h4', {
                  key: 'title',
                  style: { fontSize: '18px', fontWeight: '600', color: '#111827' }
                }, 'Book a Room'),
                React.createElement('span', {
                  key: 'price',
                  style: { color: '#f97316', fontWeight: '600' }
                }, 'From €45')
              ]),
              React.createElement('p', {
                key: 'desc',
                style: { color: '#6b7280', marginBottom: '12px' }
              }, 'Choose your dates and accommodation. Perfect for flexible stays.'),
              React.createElement('div', {
                key: 'features',
                style: { display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }
              }, ['🏠 Flexible dates', '🛏️ Choose your room', '🏄 Self-guided experience'].map(feature =>
                React.createElement('span', { key: feature }, feature)
              ))
            ]),

            React.createElement('button', {
              key: 'surf',
              onClick: () => selectExperience('surf-week'),
              style: {
                padding: '20px',
                border: experience === 'surf-week' ? '2px solid #f97316' : '2px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: experience === 'surf-week' ? '#fff7ed' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }
            }, [
              React.createElement('div', {
                key: 'header',
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }
              }, [
                React.createElement('h4', {
                  key: 'title',
                  style: { fontSize: '18px', fontWeight: '600', color: '#111827' }
                }, 'Surf Week'),
                React.createElement('span', {
                  key: 'price',
                  style: { color: '#f97316', fontWeight: '600' }
                }, 'From €599')
              ]),
              React.createElement('p', {
                key: 'desc',
                style: { color: '#6b7280', marginBottom: '12px' }
              }, 'Structured surf camp with coaching and community.'),
              React.createElement('div', {
                key: 'features',
                style: { display: 'flex', gap: '12px', fontSize: '14px', color: '#6b7280' }
              }, ['🏄 Professional coaching', '🍽️ All meals included', '📅 Structured program'].map(feature =>
                React.createElement('span', { key: feature }, feature)
              ))
            ])
          ])
        ]) :

        React.createElement('div', { key: 'other-step' }, [
          React.createElement('h3', {
            key: 'title',
            style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
          }, `Step ${step}`),
          React.createElement('p', {
            key: 'desc',
            style: { color: '#6b7280' }
          }, `This is step ${step}. Experience selected: ${experience || 'None'}`)
        ])
      ),

      // Footer
      React.createElement('div', {
        key: 'footer',
        style: {
          padding: '24px',
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }
      }, [
        React.createElement('button', {
          key: 'back',
          onClick: () => step > 1 && setStep(step - 1),
          disabled: step === 1,
          style: {
            padding: '8px 16px',
            color: step === 1 ? '#9ca3af' : '#374151',
            background: 'none',
            border: 'none',
            cursor: step === 1 ? 'not-allowed' : 'pointer',
            transition: 'color 0.2s'
          }
        }, 'Back'),

        React.createElement('span', {
          key: 'step-info',
          style: { fontSize: '14px', color: '#6b7280' }
        }, `Step ${step} of 4`),

        React.createElement('button', {
          key: 'next',
          onClick: nextStep,
          disabled: !canProceed(),
          style: {
            padding: '8px 24px',
            backgroundColor: canProceed() ? '#f97316' : '#d1d5db',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: canProceed() ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }
        }, [
          React.createElement('span', { key: 'text' }, step === 4 ? 'Complete Booking' : 'Next'),
          step < 4 && React.createElement('span', { key: 'arrow' }, '→')
        ])
      ])
    ])
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
