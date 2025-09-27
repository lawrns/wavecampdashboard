// WordPress-compatible Room Assignment Component
// Assigns guests to available rooms

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState, useEffect } = React;

interface Room {
  id: string;
  name: string;
  type: 'single' | 'double' | 'twin';
  capacity: number;
  price: number;
  available: boolean;
}

interface Guest {
  id: string;
  name: string;
  age?: number;
}

interface RoomAssignmentProps {
  state: any;
  actions: any;
}

export function RoomAssignment({ state, actions }: RoomAssignmentProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, fetch from API
  useEffect(() => {
    setTimeout(() => {
      setRooms([
        { id: 'room1', name: 'Ocean View Double', type: 'double', capacity: 2, price: 120, available: true },
        { id: 'room2', name: 'Garden Single', type: 'single', capacity: 1, price: 80, available: true },
        { id: 'room3', name: 'Twin Room', type: 'twin', capacity: 2, price: 100, available: true }
      ]);

      // Create guest objects based on number of guests
      const guestList = Array.from({ length: state.guests }, (_, i) => ({
        id: `guest-${i + 1}`,
        name: `Guest ${i + 1}`
      }));
      setGuests(guestList);

      setLoading(false);
    }, 500);
  }, [state.guests]);

  const assignGuestToRoom = (guestId: string, roomId: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      // Remove guest from any existing room
      Object.keys(newAssignments).forEach(room => {
        newAssignments[room] = newAssignments[room].filter(id => id !== guestId);
      });
      
      // Add to new room if not null
      if (roomId) {
        if (!newAssignments[roomId]) {
          newAssignments[roomId] = [];
        }
        newAssignments[roomId].push(guestId);
      }
      
      return newAssignments;
    });
  };

  const getAssignedRoom = (guestId: string) => {
    for (const [roomId, guestIds] of Object.entries(assignments)) {
      if (guestIds.includes(guestId)) {
        return roomId;
      }
    }
    return null;
  };

  const getRoomOccupancy = (roomId: string) => {
    return assignments[roomId]?.length || 0;
  };

  if (loading) {
    return React.createElement('div', { 
      style: { textAlign: 'center', padding: '40px' }
    }, 'Loading room options...');
  }

  return React.createElement('div', { className: 'room-assignment' }, [
    React.createElement('h3', {
      key: 'title',
      style: { fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }
    }, 'Assign Guests to Rooms'),
    
    React.createElement('p', {
      key: 'desc',
      style: { color: '#6b7280', marginBottom: '24px' }
    }, 'Assign each guest to their preferred room.'),
    
    React.createElement('div', {
      key: 'content',
      style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }
    }, [
      // Guests Column
      React.createElement('div', { key: 'guests' }, [
        React.createElement('h4', {
          key: 'guests-title',
          style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }
        }, 'Guests'),
        React.createElement('div', {
          key: 'guests-list',
          style: { display: 'flex', flexDirection: 'column', gap: '8px' }
        }, guests.map(guest => 
          React.createElement('div', {
            key: guest.id,
            style: { 
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white'
            }
          }, [
            React.createElement('span', {
              key: 'name',
              style: { fontWeight: '500' }
            }, guest.name),
            getAssignedRoom(guest.id) && React.createElement('span', {
              key: 'assigned',
              style: { 
                marginLeft: '8px',
                fontSize: '12px',
                color: '#10b981',
                backgroundColor: '#d1fae5',
                padding: '2px 6px',
                borderRadius: '4px'
              }
            }, `Room ${getAssignedRoom(guest.id)}`)
          ])
        ))
      ]),
      
      // Rooms Column
      React.createElement('div', { key: 'rooms' }, [
        React.createElement('h4', {
          key: 'rooms-title',
          style: { fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }
        }, 'Available Rooms'),
        React.createElement('div', {
          key: 'rooms-list',
          style: { display: 'flex', flexDirection: 'column', gap: '12px' }
        }, rooms.map(room => {
          const occupancy = getRoomOccupancy(room.id);
          const isFull = occupancy >= room.capacity;
          
          return React.createElement('div', {
            key: room.id,
            style: { 
              padding: '16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: isFull ? '#f9fafb' : 'white',
              opacity: isFull ? 0.6 : 1
            }
          }, [
            React.createElement('div', {
              key: 'header',
              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }
            }, [
              React.createElement('h5', {
                key: 'name',
                style: { fontSize: '16px', fontWeight: '600', color: '#111827' }
              }, room.name),
              React.createElement('span', {
                key: 'price',
                style: { color: '#f97316', fontWeight: '600' }
              }, `€${room.price}`)
            ]),
            
            React.createElement('p', {
              key: 'capacity',
              style: { fontSize: '14px', color: '#6b7280', marginBottom: '12px' }
            }, `Capacity: ${room.capacity} guests (${occupancy}/${room.capacity} assigned)`),
            
            // Assignment buttons for each guest
            React.createElement('div', {
              key: 'assignments',
              style: { display: 'flex', flexDirection: 'column', gap: '6px' }
            }, guests.map(guest => {
              const isAssigned = getAssignedRoom(guest.id) === room.id;
              
              return React.createElement('button', {
                key: guest.id,
                onClick: () => assignGuestToRoom(guest.id, isAssigned ? null : room.id),
                disabled: isFull && !isAssigned,
                style: {
                  padding: '6px 12px',
                  border: isAssigned ? '2px solid #10b981' : '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: isAssigned ? '#d1fae5' : 'white',
                  color: isAssigned ? '#065f46' : '#374151',
                  cursor: (isFull && !isAssigned) ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s'
                }
              }, isAssigned ? `✓ ${guest.name}` : `Assign ${guest.name}`);
            }))
          ]);
        }))
      ])
    ])
  ]);
}
