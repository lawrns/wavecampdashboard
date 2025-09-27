// WordPress-compatible Date Availability Hook
// Manages calendar dates and room availability validation

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { useState, useEffect, useCallback } = React;

export interface AvailabilityData {
  date: string;
  available: boolean;
  roomsLeft: number;
  price?: number;
}

export function useDateAvailability(apiUrl?: string) {
  const [availability, setAvailability] = useState<AvailabilityData[]>([]);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate mock availability data for next 90 days
  const generateMockAvailability = useCallback(() => {
    const data: AvailabilityData[] = [];
    const today = new Date();
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Simulate some dates as unavailable
      const isAvailable = Math.random() > 0.1; // 10% chance of being unavailable
      const roomsLeft = isAvailable ? Math.floor(Math.random() * 5) + 1 : 0;
      
      data.push({
        date: dateString,
        available: isAvailable,
        roomsLeft,
        price: isAvailable ? 80 + Math.floor(Math.random() * 40) : undefined
      });
    }
    
    return data;
  }, []);

  // Fetch availability when dates or guests change
  const fetchAvailability = useCallback(async (startDate?: string, endDate?: string, guestCount?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = generateMockAvailability();
      setAvailability(data);
    } catch (err) {
      setError('Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  }, [generateMockAvailability]);

  // Initialize with mock data
  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const isDateAvailable = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayData = availability.find(d => d.date === dateString);
    return dayData?.available && (dayData.roomsLeft >= guests) || false;
  }, [availability, guests]);

  const getDatePrice = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dayData = availability.find(d => d.date === dateString);
    return dayData?.price || 0;
  }, [availability]);

  const calculateTotalPrice = useCallback(() => {
    if (!checkIn || !checkOut) return 0;
    
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    let total = 0;
    
    for (let i = 0; i < nights; i++) {
      const date = new Date(checkIn);
      date.setDate(checkIn.getDate() + i);
      total += getDatePrice(date);
    }
    
    return total;
  }, [checkIn, checkOut, getDatePrice]);

  const setCheckInDate = useCallback((date: Date | null) => {
    setCheckIn(date);
    if (date && checkOut && date >= checkOut) {
      setCheckOut(null); // Reset checkout if checkin is after checkout
    }
  }, [checkOut]);

  const setCheckOutDate = useCallback((date: Date | null) => {
    setCheckOut(date);
  }, []);

  const setGuestCount = useCallback((count: number) => {
    setGuests(Math.max(1, count));
  }, []);

  const isValidSelection = useCallback(() => {
    return checkIn && checkOut && checkIn < checkOut && guests > 0;
  }, [checkIn, checkOut, guests]);

  const getMinimumStay = useCallback(() => {
    // Mock minimum stay logic
    return 1; // 1 night minimum
  }, []);

  const getMaximumStay = useCallback(() => {
    // Mock maximum stay logic
    return 30; // 30 nights maximum
  }, []);

  return {
    availability,
    checkIn,
    checkOut,
    guests,
    loading,
    error,
    isDateAvailable,
    getDatePrice,
    calculateTotalPrice,
    setCheckInDate,
    setCheckOutDate,
    setGuestCount,
    isValidSelection,
    getMinimumStay,
    getMaximumStay,
    refetch: fetchAvailability
  };
}
