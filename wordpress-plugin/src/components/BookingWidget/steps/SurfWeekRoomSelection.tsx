// WordPress-compatible Surf Week Room Selection Component
// Uses global React references for web component compatibility

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState, useEffect } = React;

interface SurfWeekRoom {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  available: boolean;
}

interface SurfWeekRoomSelectionProps {
  state: any;
  actions: any;
}

export function SurfWeekRoomSelection({ state, actions }: SurfWeekRoomSelectionProps) {
  const [rooms, setRooms] = useState<SurfWeekRoom[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock room data - in real implementation, fetch from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRooms([
        {
          id: 'surf-house-double',
          name: 'Surf House Double Room',
          description: 'Comfortable double room in the main surf house',
          price: 150,
          capacity: 2,
          available: true
        },
        {
          id: 'surf-house-twin',
          name: 'Surf House Twin Room',
          description: 'Twin beds in shared surf house accommodation',
          price: 120,
          capacity: 2,
          available: true
        },
        {
          id: 'beach-bungalow',
          name: 'Beach Bungalow',
          description: 'Private bungalow with ocean views',
          price: 200,
          capacity: 2,
          available: false
        }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const selectRoom = (roomId: string) => {
    actions.setSurfWeekRoom(roomId);
  };

  if (loading) {
    return React.createElement('div', { 
      style: { textAlign: 'center', padding: '40px' }
    }, 'Loading available rooms...');
  }

  return React.createElement('div', { className: 'surf-week-room-selection' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Choose Your Accommodation'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Select your room for the surf week program.'),
    
    React.createElement('div', {
      key: 'rooms',
      style: { display: 'grid', gap: '16px' }
    }, rooms.map((room: SurfWeekRoom) => 
      React.createElement('button', {
        key: room.id,
        onClick: () => room.available && selectRoom(room.id),
        disabled: !room.available,
        style: {
          padding: '20px',
          border: state.selectedSurfWeekRoom === room.id ? '2px solid #f97316' : '2px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: state.selectedSurfWeekRoom === room.id ? '#fff7ed' : room.available ? 'white' : '#f9fafb',
          textAlign: 'left',
          cursor: room.available ? 'pointer' : 'not-allowed',
          opacity: room.available ? 1 : 0.6,
          transition: 'all 0.2s'
        }
      }, [
        React.createElement('div', {
          key: 'header',
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }
        }, [
          React.createElement('h4', {
            key: 'name',
            style: { fontSize: '18px', fontWeight: '600', color: '#111827' }
          }, room.name),
          React.createElement('span', {
            key: 'price',
            style: { color: '#f97316', fontWeight: '600' }
          }, `€${room.price}/night`)
        ]),
        React.createElement('p', {
          key: 'desc',
          style: { color: '#6b7280', marginBottom: '12px' }
        }, room.description),
        React.createElement('div', {
          key: 'meta',
          style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
        }, [
          React.createElement('span', {
            key: 'capacity',
            style: { fontSize: '14px', color: '#6b7280' }
          }, `Capacity: ${room.capacity} guests`),
          !room.available && React.createElement('span', {
            key: 'unavailable',
            style: { fontSize: '14px', color: '#dc2626', fontWeight: '500' }
          }, 'Unavailable')
        ])
      ])
    ))
  ]);
}
