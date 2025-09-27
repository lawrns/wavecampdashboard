// WordPress-compatible Guest Details Component
// Collect guest information and preferences

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState } = React;

interface GuestDetailsProps {
  state: any;
  actions: any;
}

export function GuestDetails({ state, actions }: GuestDetailsProps) {
  const [guestInfo, setGuestInfo] = useState(
    Array.from({ length: state.guests }, () => ({
      name: '',
      email: '',
      phone: '',
      dietaryRestrictions: '',
      experienceLevel: 'beginner'
    }))
  );

  const updateGuest = (index: number, field: string, value: string) => {
    const updated = [...guestInfo];
    updated[index] = { ...updated[index], [field]: value };
    setGuestInfo(updated);
  };

  return React.createElement('div', { className: 'guest-details' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Guest Information'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Please provide details for all guests.'),
    
    React.createElement('div', {
      key: 'guests',
      style: { display: 'flex', flexDirection: 'column', gap: '24px' }
    }, guestInfo.map((guest: any, index: number) => 
      React.createElement('div', {
        key: index,
        style: { padding: '20px', border: '1px solid #d1d5db', borderRadius: '8px' }
      }, [
        React.createElement('h4', {
          key: 'guest-title',
          style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }
        }, `Guest ${index + 1}`),
        
        React.createElement('div', {
          key: 'form',
          style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }
        }, [
          React.createElement('div', { key: 'name' }, [
            React.createElement('label', {
              key: 'label',
              style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
            }, 'Full Name'),
            React.createElement('input', {
              key: 'input',
              type: 'text',
              value: guest.name,
              onChange: (e: any) => updateGuest(index, 'name', e.target.value),
              placeholder: 'Enter full name',
              style: {
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }
            })
          ]),
          
          React.createElement('div', { key: 'email' }, [
            React.createElement('label', {
              key: 'label',
              style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
            }, 'Email'),
            React.createElement('input', {
              key: 'input',
              type: 'email',
              value: guest.email,
              onChange: (e: any) => updateGuest(index, 'email', e.target.value),
              placeholder: 'Enter email address',
              style: {
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }
            })
          ]),
          
          React.createElement('div', { key: 'phone' }, [
            React.createElement('label', {
              key: 'label',
              style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
            }, 'Phone'),
            React.createElement('input', {
              key: 'input',
              type: 'tel',
              value: guest.phone,
              onChange: (e: any) => updateGuest(index, 'phone', e.target.value),
              placeholder: 'Enter phone number',
              style: {
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }
            })
          ]),
          
          React.createElement('div', { key: 'experience' }, [
            React.createElement('label', {
              key: 'label',
              style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
            }, 'Surfing Experience'),
            React.createElement('select', {
              key: 'select',
              value: guest.experienceLevel,
              onChange: (e: any) => updateGuest(index, 'experienceLevel', e.target.value),
              style: {
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white'
              }
            }, [
              React.createElement('option', { key: 'beginner', value: 'beginner' }, 'Beginner'),
              React.createElement('option', { key: 'intermediate', value: 'intermediate' }, 'Intermediate'),
              React.createElement('option', { key: 'advanced', value: 'advanced' }, 'Advanced')
            ])
          ])
        ]),
        
        React.createElement('div', {
          key: 'dietary',
          style: { marginTop: '16px' }
        }, [
          React.createElement('label', {
            key: 'label',
            style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }
          }, 'Dietary Restrictions (Optional)'),
          React.createElement('textarea', {
            key: 'textarea',
            value: guest.dietaryRestrictions,
            onChange: (e: any) => updateGuest(index, 'dietaryRestrictions', e.target.value),
            placeholder: 'Any allergies or dietary preferences...',
            rows: 2,
            style: {
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }
          })
        ])
      ])
    ))
  ]);
}
