// WordPress-compatible React imports with runtime binding
let useEffect: any, useState: any;

// Function to get React hooks at runtime (ensures proper binding)
function getReactHooks() {
  if (typeof window !== 'undefined' && (window as any).React) {
    const React = (window as any).React;
    return {
      useEffect: React.useEffect,
      useState: React.useState
    };
  } else {
    // Fallback to normal imports for Next.js environment
    const reactModule = require('react');
    return {
      useEffect: reactModule.useEffect,
      useState: reactModule.useState
    };
  }
}

// Get hooks at runtime to ensure proper React instance binding
const hooks = getReactHooks();
useEffect = hooks.useEffect;
useState = hooks.useState;
import { MapPin, Users, Star, Check, Clock, Wifi, Car, Utensils, Calendar, Minus, Plus } from 'lucide-react';
import { BookingState, PricingBreakdown } from '../types';
import { useRooms } from '../hooks/useRooms';
import { useSurfCamps } from '../hooks/useSurfCamps';
import { useDateAvailability } from '../hooks/useDateAvailability';
import { RoomImageGallery, RoomHeroImage } from '../components/RoomImageGallery';

interface OptionSelectionProps {
  state: BookingState;
  actions: {
    selectOption: (optionId: string) => void;
    setSurfWeek: (surfWeekId: string) => void;
    setDates: (checkIn: Date, checkOut: Date) => void;
    setGuests: (count: number) => void;
    updatePricing: (pricing: PricingBreakdown) => void;
  };
}

export function OptionSelection({ state, actions }: OptionSelectionProps) {
  // Only fetch data for the selected experience type to improve performance
  const { rooms, loading: roomsLoading, error: roomsError, refetch: refetchRooms } = useRooms({
    checkIn: state.experienceType === 'room' ? state.dates.checkIn : null,
    checkOut: state.experienceType === 'room' ? state.dates.checkOut : null,
    guests: state.experienceType === 'room' ? state.guests : 1,
  });
  const { surfCamps, loading: campsLoading, error: campsError, refetch: refetchSurfCamps } = useSurfCamps();
  const {
    fetchDateAvailability,
    isDateSoldOut,
    loading: dateAvailabilityLoading
  } = useDateAvailability({ participants: state.guests });
  const [selectedOption, setSelectedOption] = useState<string | null>(state.selectedOption);

  // Image gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryRoomName, setGalleryRoomName] = useState('');
  const [galleryRoom, setGalleryRoom] = useState<any>(null);

  // Local state for room booking dates
  const [checkInDate, setCheckInDate] = useState(
    state.dates.checkIn?.toISOString().split('T')[0] || ''
  );
  const [checkOutDate, setCheckOutDate] = useState(
    state.dates.checkOut?.toISOString().split('T')[0] || ''
  );

  // Fetch date availability only when both dates are selected
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      // Only check availability for the selected date range
      fetchDateAvailability(checkInDate, checkOutDate);
    }
  }, [checkInDate, checkOutDate, fetchDateAvailability]);

  // For surf weeks, if a surf week was already selected in step 2, auto-select it here
  if (state.experienceType === 'surf-week' && state.selectedSurfWeek && !state.selectedOption) {
    actions.selectOption(state.selectedSurfWeek);
  }

  const loading = state.experienceType === 'room' ? roomsLoading : campsLoading;
  const error = state.experienceType === 'room' ? roomsError : campsError;
  const options = state.experienceType === 'room' ? rooms : surfCamps;

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    actions.selectOption(optionId);

    // For surf weeks, also set the surf week state
    if (state.experienceType === 'surf-week') {
      actions.setSurfWeek(optionId);
    }
  };

  const handleCheckInChange = (dateStr: string) => {
    setCheckInDate(dateStr);
    if (dateStr && checkOutDate) {
      const checkIn = new Date(dateStr);
      const checkOut = new Date(checkOutDate);
      if (checkIn < checkOut) {
        actions.setDates(checkIn, checkOut);
      }
    }
  };

  const handleCheckOutChange = (dateStr: string) => {
    setCheckOutDate(dateStr);
    if (checkInDate && dateStr) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(dateStr);
      if (checkIn < checkOut) {
        actions.setDates(checkIn, checkOut);
      }
    }
  };

  // Auto-select for room bookings when dates and guests are set
  useEffect(() => {
    if (state.experienceType === 'room' && state.dates.checkIn && state.dates.checkOut && state.guests > 0 && !selectedOption) {
      // Auto-select a dummy option for room bookings to allow progression
      const dummyOptionId = 'room-dates-selected';
      setSelectedOption(dummyOptionId);
      actions.selectOption(dummyOptionId);
    }
  }, [state.experienceType, state.dates.checkIn, state.dates.checkOut, state.guests, selectedOption, actions]);

  // Recompute base price and totals when selection/dates/guests change
  useEffect(() => {
    if (!selectedOption) return;
    const opt: any = (options as any[]).find((o) => o.id === selectedOption);
    if (!opt) return;

    let basePrice = 0;
    if (state.experienceType === 'room') {
      if (state.dates.checkIn && state.dates.checkOut) {
        const nights = Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const unit = typeof opt.pricePerNight === 'number' ? opt.pricePerNight : (opt.price ?? 0);

        // Calculate room quantity based on guest count and room capacity
        const roomCapacity = opt.capacity || 2;
        const roomQuantity = Math.ceil(state.guests / roomCapacity);

        basePrice = unit * nights * roomQuantity;
      }
    } else if (state.experienceType === 'surf-week') {
      const unit = typeof opt.price === 'number' ? opt.price : (opt.priceFrom ?? 0);
      basePrice = unit * Math.max(1, state.guests);
    }

    if (basePrice > 0) {
      const addOnsSubtotal = state.pricing.addOnsSubtotal || 0;
      const taxes = Math.round((basePrice + addOnsSubtotal) * 0.1);
      const fees = Math.round((basePrice + addOnsSubtotal) * 0.05);
      const total = basePrice + addOnsSubtotal + taxes + fees;
      actions.updatePricing({ ...state.pricing, basePrice, taxes, fees, total, currency: 'EUR' });
    }
  }, [selectedOption, state.dates.checkIn, state.dates.checkOut, state.guests, state.experienceType, options]);

  const adjustGuests = (delta: number) => {
    const newCount = Math.max(1, Math.min(12, state.guests + delta));
    actions.setGuests(newCount);
  };

  // Open image gallery
  const openGallery = (room: any) => {
    setGalleryImages(room.images || []);
    setGalleryRoomName(room.name);
    setGalleryRoom(room);
    setGalleryOpen(true);
  };

  // Enhanced room assignment: Remove capacity restrictions - all rooms show normally
  const canAccommodateGuests = (room: any) => {
    return true; // Always return true to show all rooms normally
  };

  // Enhanced room assignment: No capacity warnings needed
  const getRoomsExceedingCapacity = () => {
    return []; // Always return empty array to remove capacity warnings
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={16} />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('transport')) return <Car size={16} />;
    if (lowerAmenity.includes('meal') || lowerAmenity.includes('food')) return <Utensils size={16} />;
    return <Check size={16} />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateTotalPrice = (option: any) => {
    if (state.experienceType === 'room') {
      if (state.dates.checkIn && state.dates.checkOut) {
        const nights = Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return option.pricePerNight * nights;
      }
      return undefined; // Wait for dates to avoid NaN
    }
    return option.price ?? undefined;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">
            Choose Your {state.experienceType === 'room' ? 'Room' : 'Surf Week'}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">
              Loading available {state.experienceType === 'room' ? 'rooms' : 'surf weeks'}...
            </p>
          </div>
          <p className="text-sm text-gray-500">
            This may take up to 15 seconds
          </p>
        </div>

        {/* Loading skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl h-48 w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    const handleRetry = () => {
      if (state.experienceType === 'room') {
        refetchRooms();
      } else {
        refetchSurfCamps();
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">
            Choose Your {state.experienceType === 'room' ? 'Room' : 'Surf Week'}
          </h3>
          <div className="space-y-2">
            <p className="text-red-600">
              Error loading {state.experienceType === 'room' ? 'rooms' : 'surf weeks'}: {error}
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          Choose Your {state.experienceType === 'room' ? 'Room' : 'Surf Week'}
        </h3>
        <p className="text-gray-600">
          {state.experienceType === 'room'
            ? 'Select your dates and find the perfect room'
            : 'Select your perfect surf adventure'
          }
        </p>
      </div>

      {/* Inline Date Picker and Guest Counter for Rooms */}
      {state.experienceType === 'room' && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
          {/* Date Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={20} className="text-orange-500" />
              Select Dates
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="check-in" className="block text-sm font-medium text-gray-700">
                  Check-in
                </label>
                <div className="relative">
                  <input
                    id="check-in"
                    type="date"
                    value={checkInDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                      checkInDate && isDateSoldOut(checkInDate)
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-300'
                    }`}
                    required
                  />
                  {checkInDate && isDateSoldOut(checkInDate) && (
                    <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none">
                      <span className="text-red-500 text-sm font-medium">Sold Out</span>
                    </div>
                  )}
                </div>
                {checkInDate && isDateSoldOut(checkInDate) && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    This date is fully booked. Please select another date.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="check-out" className="block text-sm font-medium text-gray-700">
                  Check-out
                </label>
                <div className="relative">
                  <input
                    id="check-out"
                    type="date"
                    value={checkOutDate}
                    min={checkInDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                      checkOutDate && isDateSoldOut(checkOutDate)
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-300'
                    }`}
                    required
                  />
                  {checkOutDate && isDateSoldOut(checkOutDate) && (
                    <div className="absolute inset-y-0 right-12 flex items-center pointer-events-none">
                      <span className="text-red-500 text-sm font-medium">Sold Out</span>
                    </div>
                  )}
                </div>
                {checkOutDate && isDateSoldOut(checkOutDate) && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    This date is fully booked. Please select another date.
                  </p>
                )}
              </div>
            </div>

            {/* Date Availability Loading Indicator - Only show when dates are selected */}
            {dateAvailabilityLoading && checkInDate && checkOutDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                Checking availability for selected dates...
              </div>
            )}
          </div>

          {/* Guest Counter */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-orange-500" />
              Number of Guests
            </h4>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">Guests</div>
                <div className="text-sm text-gray-600">How many people will be staying?</div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => adjustGuests(-1)}
                  disabled={state.guests <= 1}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  aria-label="Decrease guest count"
                >
                  <Minus size={16} />
                </button>

                <span className="w-12 text-center text-lg font-semibold text-gray-900">
                  {state.guests}
                </span>

                <button
                  onClick={() => adjustGuests(1)}
                  disabled={state.guests >= 12}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  aria-label="Increase guest count"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Counter for Surf Weeks */}
      {state.experienceType === 'surf-week' && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-orange-500" />
            Number of Participants
          </h4>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
            <div>
              <div className="font-medium text-gray-900">Participants</div>
              <div className="text-sm text-gray-600">How many people will join the surf camp?</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => adjustGuests(-1)}
                disabled={state.guests <= 1}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                aria-label="Decrease participant count"
              >
                <Minus size={16} />
              </button>

              <span className="w-12 text-center text-lg font-semibold text-gray-900">
                {state.guests}
              </span>

              <button
                onClick={() => adjustGuests(1)}
                disabled={state.guests >= 12}
                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                aria-label="Increase participant count"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Date Summary */}
          {state.dates.checkIn && state.dates.checkOut && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">
                  Duration: {Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights
                </span>
                <span className="text-sm text-orange-600">
                  {state.dates.checkIn.toLocaleDateString()} - {state.dates.checkOut.toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced room assignment: Removed capacity warnings - all rooms show normally */}

      {/* Options Grid */}
      {state.experienceType === 'surf-week' ? (
        <div className="space-y-4">
          {options.map((w: any, index: number) => {
            const isSelected = selectedOption === w.id;
            const from = typeof w.priceFrom === 'number' ? w.priceFrom : w.price;
            const start = new Date(w.startDate);
            const end = new Date(w.endDate);
            const dateText = `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} > ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;

            // Enhanced occupancy display logic
            let occupancyText = '';
            if (typeof w.confirmedBooked === 'number' && typeof w.maxParticipants === 'number') {
              occupancyText = `${w.confirmedBooked}/${w.maxParticipants} booked`;
            } else if (typeof w.availableSpots === 'number') {
              occupancyText = w.availableSpots > 0 ? `${w.availableSpots} spots left` : 'Fully booked';
            }

            const isFullyBooked = w.availableSpots === 0;

            return (
              <button
                key={w.id}
                data-testid="surf-week-row"
                onClick={() => handleOptionSelect(w.id)}
                className={`w-full p-6 rounded-xl border-2 bg-white text-left transition-all duration-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 relative
                  ${isSelected ? 'border-orange-500 bg-orange-50 shadow-md ring-2 ring-orange-500/30' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}
                  ${isFullyBooked ? 'opacity-60 cursor-not-allowed' : ''}`}
                style={{ animationDelay: `${index * 80}ms` }}
                disabled={isFullyBooked}
              >
                <div className="flex gap-6">
                  {/* Surf Week Hero Image */}
                  <div className="flex-shrink-0">
                    {w.images && w.images.length > 0 ? (
                      <RoomHeroImage
                        image={w.images[0]}
                        roomName={w.name}
                        onClick={() => openGallery(w)}
                        className="w-32 h-24"
                      />
                    ) : (
                      <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                        <div className="text-white text-2xl font-bold">🏄‍♂️</div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Title and Price */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{dateText}</div>
                        <div className="text-orange-500 font-extrabold uppercase tracking-wide text-sm mt-1" data-testid="surf-week-title">{w.name}</div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {w.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-orange-600">
                          {`from €${Math.round(from)}`}
                        </div>
                        <div className="text-xs text-gray-500">per person</div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>Up to {w.maxParticipants} participants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} />
                        <span className="capitalize">{w.level} level</span>
                      </div>
                    </div>

                    {/* Includes */}
                    {w.includes && w.includes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {w.includes.slice(0, 3).map((include: string, index: number) => (
                          <span
                            key={index}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                          >
                            <Check size={10} />
                            {include}
                          </span>
                        ))}
                        {w.includes.length > 3 && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                            +{w.includes.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Occupancy and View Photos */}
                    <div className="flex items-center justify-between">
                      <div className={`text-xs ${isFullyBooked ? 'text-red-500 font-medium' : 'text-gray-500'}`} data-testid="surf-week-occupancy">
                        {occupancyText}
                      </div>

                      {/* View Photos Link */}
                      {w.images && w.images.length > 0 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            openGallery(w);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors duration-200 cursor-pointer select-none"
                        >
                          📸 View {w.images.length} Photo{w.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-orange-600">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Room Booking - Show available rooms for selection */
        <div className="space-y-6">
          {state.dates.checkIn && state.dates.checkOut && state.guests > 0 ? (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Your Selection</h4>
                <p className="text-blue-700 text-sm">
                  {state.guests} guest{state.guests !== 1 ? 's' : ''} • {Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24))} night{Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''} • {state.dates.checkIn.toLocaleDateString()} - {state.dates.checkOut.toLocaleDateString()}
                </p>
              </div>

              {/* Room Selection */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading available rooms...</p>
                </div>
              ) : options.length > 0 ? (
                <div className="space-y-4">
                  {(options as any[]).map((option: any, index: number) => {
                    const isSelected = selectedOption === option.id;
                    const totalPrice = calculateTotalPrice(option);
                    const amenities = option.amenities;
                    // Enhanced room assignment: All rooms are selectable regardless of capacity
                    const canAccommodate = true;
                    const exceedsCapacity = false;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={false}
                        className={`
                          w-full p-6 rounded-xl border-2 text-left
                          transition-all duration-300 ease-out
                          focus:outline-none focus:ring-4 focus:ring-orange-500/30
                          animate-in fade-in-0 slide-in-from-bottom-4
                          ${isSelected
                            ? 'border-orange-500 bg-orange-50 shadow-lg shadow-orange-500/20 animate-in zoom-in-95 duration-300'
                            : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/50 hover:scale-[1.02] hover:shadow-xl hover:-translate-y-1'
                          }
                        `}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex gap-6">
                          {/* Enhanced Hero Image */}
                          <div className="flex-shrink-0">
                            {option.images && option.images.length > 0 ? (
                              <RoomHeroImage
                                image={option.images[0]}
                                roomName={option.name}
                                onClick={() => openGallery(option)}
                                className="w-32 h-24"
                              />
                            ) : (
                              <div className="w-32 h-24 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                                <div className="text-white text-2xl font-bold">
                                  {state.experienceType === 'room' ? '🏠' : '🏄‍♂️'}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            {/* Title and Price */}
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                  {option.name}
                                </h4>
                                <p className="text-sm text-gray-600 line-clamp-2">
                                  {option.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-orange-600">
                                  {typeof totalPrice === 'number' && !Number.isNaN(totalPrice)
                                    ? formatPrice(totalPrice)
                                    : (state.experienceType === 'room' ? 'Select dates' : (option.price ? formatPrice(option.price) : '—'))}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {state.experienceType === 'room'
                                    ? (state.dates.checkIn && state.dates.checkOut ? `for ${Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24))} night${Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}` : 'per night')
                                    : 'per person'
                                  }
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <>
                                <div className="flex items-center gap-1">
                                  <Users size={14} />
                                  <span>Up to {option.maxOccupancy} guests</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} />
                                  <span className="capitalize">{option.type} room</span>
                                </div>
                              </>
                            </div>

                            {/* Amenities/Includes */}
                            {amenities && amenities.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {amenities.slice(0, 4).map((amenity: string, index: number) => (
                                  <span
                                    key={index}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                                  >
                                    {getAmenityIcon(amenity)}
                                    {amenity}
                                  </span>
                                ))}
                                {amenities.length > 4 && (
                                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                    +{amenities.length - 4} more
                                  </span>
                                )}
                                {/* View Photos Link */}
                                {option.images && option.images.length > 0 && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGallery(option);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-full cursor-pointer transition-colors duration-200 select-none"
                                  >
                                    📸 {option.images.length} Photo{option.images.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="mt-4 flex items-center gap-2 text-orange-600">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                            <span className="text-sm font-medium">Selected</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Rooms Available</h4>
                  <p className="text-gray-600">
                    No rooms are available for your selected dates. Please try different dates.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar size={24} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Selection</h4>
              <p className="text-gray-600">
                Please select your check-in/check-out dates and number of guests above to continue.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Options Message */}
      {options.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            No {state.experienceType === 'room' ? 'rooms' : 'surf weeks'} available for your selected dates.
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {state.experienceType === 'room'
            ? 'All rooms include WiFi, linens, and access to common areas.'
            : 'All surf weeks include accommodation, meals, equipment, and professional coaching.'
          }
        </p>
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
