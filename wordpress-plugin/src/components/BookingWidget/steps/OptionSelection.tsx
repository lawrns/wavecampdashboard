// WordPress-compatible Option Selection Component
// Select dates, guests, and basic options

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState } = React;

interface OptionSelectionProps {
  state: any;
  actions: any;
}

export function OptionSelection({ state, actions }: OptionSelectionProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const handleCheckInChange = (e: any) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setCheckIn(e.target.value);
    actions.setDates({
      checkIn: date,
      checkOut: state.dates.checkOut
    });
  };

  const handleCheckOutChange = (e: any) => {
    const date = e.target.value ? new Date(e.target.value) : null;
    setCheckOut(e.target.value);
    actions.setDates({
      checkIn: state.dates.checkIn,
      checkOut: date
    });
  };

  const handleGuestsChange = (e: any) => {
    const count = parseInt(e.target.value);
    setGuests(count);
    actions.setGuests(count);
  };

  return React.createElement('div', { className: 'option-selection' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Select Your Options'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Choose your dates, number of guests, and accommodation options.'),
    
    React.createElement('div', {
      key: 'form',
      style: { display: 'grid', gap: '16px' }
    }, [
      React.createElement('div', {
        key: 'dates',
        style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }
      }, [
        React.createElement('div', { key: 'checkin' }, [
          React.createElement('label', {
            key: 'label',
            style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }
          }, 'Check-in Date'),
          React.createElement('input', {
            key: 'input',
            type: 'date',
            value: checkIn,
            onChange: handleCheckInChange,
            style: {
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }
          })
        ]),
        
        React.createElement('div', { key: 'checkout' }, [
          React.createElement('label', {
            key: 'label',
            style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }
          }, 'Check-out Date'),
          React.createElement('input', {
            key: 'input',
            type: 'date',
            value: checkOut,
            onChange: handleCheckOutChange,
            style: {
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }
          })
        ])
      ]),
      
      React.createElement('div', { key: 'guests' }, [
        React.createElement('label', {
          key: 'label',
          style: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }
        }, 'Number of Guests'),
        React.createElement('select', {
          key: 'select',
          value: guests,
          onChange: handleGuestsChange,
          style: {
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: 'white'
          }
        }, [1,2,3,4,5,6].map(num => 
          React.createElement('option', { key: num, value: num }, `${num} Guest${num > 1 ? 's' : ''}`)
        ))
      ]),
      
      state.experienceType === 'room' && React.createElement('div', {
        key: 'room-type',
        style: { marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }
      }, [
        React.createElement('h4', {
          key: 'title',
          style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
        }, 'Room Type'),
        React.createElement('div', {
          key: 'options',
          style: { display: 'grid', gap: '8px' }
        }, [
          { id: 'standard', name: 'Standard Room', price: 80 },
          { id: 'deluxe', name: 'Deluxe Room', price: 120 },
          { id: 'suite', name: 'Suite', price: 180 }
        ].map(room => 
          React.createElement('label', {
            key: room.id,
            style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }
          }, [
            React.createElement('input', {
              key: 'radio',
              type: 'radio',
              name: 'roomType',
              value: room.id,
              style: { margin: 0 }
            }),
            React.createElement('span', { key: 'name' }, room.name),
            React.createElement('span', {
              key: 'price',
              style: { marginLeft: 'auto', color: '#f97316', fontWeight: '600' }
            }, `€${room.price}/night`)
          ])
        ))
      ])
    ])
  ]);
}
