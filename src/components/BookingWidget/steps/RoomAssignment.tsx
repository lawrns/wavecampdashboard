// WordPress-compatible React imports with runtime binding
let useState: any, useEffect: any;

// Function to get React hooks at runtime (ensures proper binding)
function getReactHooks() {
  if (typeof window !== 'undefined' && (window as any).React) {
    const React = (window as any).React;
    return {
      useState: React.useState,
      useEffect: React.useEffect
    };
  } else {
    // Fallback to normal imports for Next.js environment
    const reactModule = require('react');
    return {
      useState: reactModule.useState,
      useEffect: reactModule.useEffect
    };
  }
}

// Get hooks at runtime to ensure proper React instance binding
const hooks = getReactHooks();
useState = hooks.useState;
useEffect = hooks.useEffect;
import { Users, Bed, ArrowRight, Check } from 'lucide-react';
import { BookingState, RoomAssignment as RoomAssignmentType } from '../types';
import { useRooms } from '../hooks/useRooms';
import { RoomImageGallery, RoomThumbnail } from '../components/RoomImageGallery';

interface RoomAssignmentProps {
  state: BookingState;
  actions: {
    setRoomAssignments: (assignments: RoomAssignmentType[]) => void;
    addRoomAssignment: (assignment: RoomAssignmentType) => void;
    removeRoomAssignment: (assignmentId: string) => void;
  };
}

export function RoomAssignment({ state, actions }: RoomAssignmentProps) {
  const { rooms, loading, error } = useRooms({
    checkIn: state.dates.checkIn,
    checkOut: state.dates.checkOut,
    guests: state.guests,
  });

  const [unassignedGuests, setUnassignedGuests] = useState<string[]>([]);

  // Image gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryRoomName, setGalleryRoomName] = useState('');
  const [galleryRoom, setGalleryRoom] = useState<any>(null);

  // Initialize guest IDs
  useEffect(() => {
    const guestIds = Array.from({ length: state.guests }, (_, i) => `guest-${i + 1}`);
    const assignedGuestIds = state.roomAssignments.flatMap(a => a.guestIds);
    const unassigned = guestIds.filter(id => !assignedGuestIds.includes(id));
    setUnassignedGuests(unassigned);
  }, [state.guests, state.roomAssignments]);

  const handleAssignGuestToRoom = (roomId: string, guestId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    // Check if room has capacity
    const currentAssignment = state.roomAssignments.find(a => a.roomId === roomId);
    const currentOccupancy = currentAssignment ? currentAssignment.guestIds.length : 0;
    
    if (currentOccupancy >= room.maxOccupancy) {
      return; // Room is full
    }

    if (currentAssignment) {
      // Add guest to existing assignment
      const updatedAssignment = {
        ...currentAssignment,
        guestIds: [...currentAssignment.guestIds, guestId]
      };
      
      const updatedAssignments = state.roomAssignments.map(a => 
        a.id === currentAssignment.id ? updatedAssignment : a
      );
      actions.setRoomAssignments(updatedAssignments);
    } else {
      // Create new assignment
      const newAssignment: RoomAssignmentType = {
        id: `assignment-${Date.now()}`,
        roomId,
        guestIds: [guestId]
      };
      actions.addRoomAssignment(newAssignment);
    }
  };

  const handleRemoveGuestFromRoom = (assignmentId: string, guestId: string) => {
    const assignment = state.roomAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const updatedGuestIds = assignment.guestIds.filter(id => id !== guestId);
    
    if (updatedGuestIds.length === 0) {
      // Remove assignment if no guests left
      actions.removeRoomAssignment(assignmentId);
    } else {
      // Update assignment with remaining guests
      const updatedAssignment = {
        ...assignment,
        guestIds: updatedGuestIds
      };
      
      const updatedAssignments = state.roomAssignments.map(a => 
        a.id === assignmentId ? updatedAssignment : a
      );
      actions.setRoomAssignments(updatedAssignments);
    }
  };

  const getRoomOccupancy = (roomId: string) => {
    const assignment = state.roomAssignments.find(a => a.roomId === roomId);
    return assignment ? assignment.guestIds.length : 0;
  };

  // Enhanced room assignment: Display actual guest names instead of "Guest 1, Guest 2"
  const getGuestName = (guestId: string) => {
    const guestNumber = parseInt(guestId.split('-')[1]) - 1; // Convert to 0-based index
    const guest = state.guestDetails[guestNumber];

    if (guest && guest.firstName && guest.lastName) {
      return `${guest.firstName} ${guest.lastName}`;
    }

    // Fallback to generic name if guest details not available
    return `Guest ${guestNumber + 1}`;
  };

  // Open image gallery
  const openGallery = (room: any) => {
    setGalleryImages(room.images || []);
    setGalleryRoomName(room.name);
    setGalleryRoom(room);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading room options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center text-red-600">
          <p>Error loading rooms: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Assign Guests to Rooms
        </h3>
        <p className="text-gray-600">
          Assign each guest to their preferred room and bed
        </p>
      </div>

      {/* Unassigned Guests */}
      {unassignedGuests.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
            <Users size={18} />
            Unassigned Guests ({unassignedGuests.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {unassignedGuests.map(guestId => (
              <span
                key={guestId}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
              >
                {getGuestName(guestId)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Room Assignment Cards */}
      <div className="space-y-4">
        {rooms.map(room => {
          const occupancy = getRoomOccupancy(room.id);
          const assignment = state.roomAssignments.find(a => a.roomId === room.id);
          const isFull = occupancy >= room.maxOccupancy;

          return (
            <div
              key={room.id}
              className={`border-2 rounded-xl p-6 transition-all duration-300 ${
                assignment ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Room Thumbnail */}
                <div className="flex-shrink-0">
                  {room.images && room.images.length > 0 ? (
                    <RoomThumbnail
                      image={room.images[0]}
                      roomName={room.name}
                      onClick={() => openGallery(room)}
                      className="w-20 h-15"
                    />
                  ) : (
                    <div className="w-20 h-15 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">🏠</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{room.name}</h4>
                      <p className="text-gray-600 text-sm">{room.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        €{room.pricePerNight}
                      </div>
                      <div className="text-sm text-gray-600">per night</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bed size={16} />
                  <span>Up to {room.maxOccupancy} guests</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} />
                  <span className={occupancy > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                    {occupancy}/{room.maxOccupancy} assigned
                  </span>
                </div>
              </div>

              {/* Assigned Guests */}
              {assignment && assignment.guestIds.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned Guests:</h5>
                  <div className="flex flex-wrap gap-2">
                    {assignment.guestIds.map(guestId => (
                      <div
                        key={guestId}
                        className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        <Check size={14} />
                        <span>{getGuestName(guestId)}</span>
                        <button
                          onClick={() => handleRemoveGuestFromRoom(assignment.id, guestId)}
                          className="ml-1 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment Actions */}
              {!isFull && unassignedGuests.length > 0 && (
                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Assign Guest:</h5>
                  <div className="flex flex-wrap gap-2">
                    {unassignedGuests.map(guestId => (
                      <button
                        key={guestId}
                        onClick={() => handleAssignGuestToRoom(room.id, guestId)}
                        className="flex items-center gap-2 px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ArrowRight size={14} />
                        {getGuestName(guestId)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isFull && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 italic">Room is at full capacity</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">Assignment Summary</h4>
        <div className="text-sm text-gray-600">
          <p>Total Guests: {state.guests}</p>
          <p>Assigned: {state.roomAssignments.flatMap(a => a.guestIds).length}</p>
          <p>Unassigned: {unassignedGuests.length}</p>
        </div>
      </div>

      {/* Room Image Gallery Modal */}
      <RoomImageGallery
        images={galleryImages}
        roomName={galleryRoomName}
        roomDescription={galleryRoom?.description}
        roomAmenities={galleryRoom?.amenities}
        roomType={galleryRoom?.type}
        maxOccupancy={galleryRoom?.maxOccupancy}
        pricePerNight={galleryRoom?.pricePerNight}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />
    </div>
  );
}
