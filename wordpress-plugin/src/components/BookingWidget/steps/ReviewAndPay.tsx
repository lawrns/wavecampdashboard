// WordPress-compatible Review and Payment Component
// Final checkout step with booking summary and payment form

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState } = React;

interface ReviewAndPayProps {
  state: any;
  actions: any;
}

export function ReviewAndPay({ state, actions }: ReviewAndPayProps) {
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [processing, setProcessing] = useState(false);

  const calculateTotal = () => {
    let total = 0;
    
    // Base accommodation cost
    if (state.experienceType === 'room') {
      total += 120; // Mock room price
    } else if (state.experienceType === 'surf-week') {
      total += 599; // Mock surf week price
    }
    
    // Add-ons
    if (state.addOns) {
      state.addOns.forEach((addon: any) => {
        total += addon.price;
      });
    }
    
    return total;
  };

  const handlePayment = async () => {
    if (!acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }

    setProcessing(true);
    
    // Mock payment processing
    setTimeout(() => {
      actions.completeBooking({
        bookingNumber: `HW${Date.now()}`,
        total: calculateTotal(),
        paymentMethod
      });
      setProcessing(false);
    }, 2000);
  };

  const total = calculateTotal();

  return React.createElement('div', { className: 'review-and-pay' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Review Your Booking'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Please review your booking details and complete payment.'),
    
    React.createElement('div', {
      key: 'summary',
      style: { backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '24px' }
    }, [
      React.createElement('h4', {
        key: 'summary-title',
        style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }
      }, 'Booking Summary'),
      
      React.createElement('div', {
        key: 'details',
        style: { display: 'grid', gap: '12px' }
      }, [
        React.createElement('div', {
          key: 'experience',
          style: { display: 'flex', justifyContent: 'space-between' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: '500' } }, 'Experience:'),
          React.createElement('span', { key: 'value' }, 
            state.experienceType === 'room' ? 'Room Booking' : 'Surf Week'
          )
        ]),
        
        React.createElement('div', {
          key: 'guests',
          style: { display: 'flex', justifyContent: 'space-between' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: '500' } }, 'Guests:'),
          React.createElement('span', { key: 'value' }, state.guests)
        ]),
        
        React.createElement('div', {
          key: 'dates',
          style: { display: 'flex', justifyContent: 'space-between' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: '500' } }, 'Dates:'),
          React.createElement('span', { key: 'value' }, 
            state.dates?.checkIn && state.dates?.checkOut 
              ? `${new Date(state.dates.checkIn).toLocaleDateString()} - ${new Date(state.dates.checkOut).toLocaleDateString()}`
              : 'Not selected'
          )
        ]),
        
        state.addOns && state.addOns.length > 0 && React.createElement('div', {
          key: 'addons',
          style: { display: 'flex', justifyContent: 'space-between' }
        }, [
          React.createElement('span', { key: 'label', style: { fontWeight: '500' } }, 'Add-ons:'),
          React.createElement('span', { key: 'value' }, 
            state.addOns.map((addon: any) => addon.name).join(', ')
          )
        ]),
        
        React.createElement('div', {
          key: 'divider',
          style: { borderTop: '1px solid #e5e7eb', margin: '12px 0' }
        }),
        
        React.createElement('div', {
          key: 'total',
          style: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }
        }, [
          React.createElement('span', { key: 'label' }, 'Total:'),
          React.createElement('span', { key: 'value', style: { color: '#f97316' } }, `€${total}`)
        ])
      ])
    ]),
    
    React.createElement('div', {
      key: 'payment',
      style: { marginBottom: '24px' }
    }, [
      React.createElement('h4', {
        key: 'payment-title',
        style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }
      }, 'Payment Method'),
      
      React.createElement('div', {
        key: 'payment-options',
        style: { display: 'flex', flexDirection: 'column', gap: '12px' }
      }, [
        React.createElement('label', {
          key: 'stripe',
          style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
        }, [
          React.createElement('input', {
            key: 'radio',
            type: 'radio',
            name: 'payment',
            value: 'stripe',
            checked: paymentMethod === 'stripe',
            onChange: (e) => setPaymentMethod(e.target.value),
            style: { margin: 0 }
          }),
          React.createElement('span', { key: 'label' }, '💳 Credit Card (Stripe) - Secure payment')
        ]),
        
        React.createElement('label', {
          key: 'paypal',
          style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
        }, [
          React.createElement('input', {
            key: 'radio',
            type: 'radio',
            name: 'payment',
            value: 'paypal',
            checked: paymentMethod === 'paypal',
            onChange: (e) => setPaymentMethod(e.target.value),
            style: { margin: 0 }
          }),
          React.createElement('span', { key: 'label' }, '🅿️ PayPal')
        ]),
        
        React.createElement('label', {
          key: 'bank',
          style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
        }, [
          React.createElement('input', {
            key: 'radio',
            type: 'radio',
            name: 'payment',
            value: 'bank',
            checked: paymentMethod === 'bank',
            onChange: (e) => setPaymentMethod(e.target.value),
            style: { margin: 0 }
          }),
          React.createElement('span', { key: 'label' }, '🏦 Bank Transfer (Invoice)')
        ])
      ])
    ]),
    
    React.createElement('div', {
      key: 'terms',
      style: { marginBottom: '24px' }
    }, [
      React.createElement('label', {
        key: 'terms-label',
        style: { display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }
      }, [
        React.createElement('input', {
          key: 'checkbox',
          type: 'checkbox',
          checked: acceptTerms,
          onChange: (e) => setAcceptTerms(e.target.checked),
          style: { marginTop: '2px' }
        }),
        React.createElement('span', {
          key: 'text',
          style: { fontSize: '14px', color: '#6b7280' }
        }, 'I accept the Terms and Conditions and Privacy Policy')
      ])
    ]),
    
    React.createElement('button', {
      key: 'complete',
      onClick: handlePayment,
      disabled: processing || !acceptTerms,
      style: {
        width: '100%',
        padding: '12px',
        backgroundColor: (processing || !acceptTerms) ? '#d1d5db' : '#f97316',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: (processing || !acceptTerms) ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background-color 0.2s'
      }
    }, processing ? [
      React.createElement('span', { key: 'spinner', style: { 
        width: '16px', 
        height: '16px', 
        border: '2px solid #ffffff', 
        borderTop: '2px solid transparent', 
        borderRadius: '50%', 
        animation: 'spin 1s linear infinite' 
      }}),
      React.createElement('span', { key: 'text' }, 'Processing Payment...')
    ] : 'Complete Booking')
  ]);
}
