// WordPress-compatible Booking Provider
// Full state management for the booking widget

declare global {
  interface Window {
    React: any;
    ReactDOM: any;
  }
}

const React = window.React;
const { createContext, useContext, useReducer, useCallback } = React;

export interface BookingState {
  // Navigation
  currentStep: number;
  
  // Experience Selection
  experienceType: 'room' | 'surf-week' | null;
  
  // Surf Week specific
  selectedSurfCamp: any;
  selectedSurfWeekRoom: string | null;
  
  // Room booking
  dates: {
    checkIn: Date | null;
    checkOut: Date | null;
  };
  guests: number;
  
  // Room assignment
  roomAssignments: Record<string, string[]>; // roomId -> guestIds
  
  // Add-ons
  addOns: any[];
  
  // Payment
  paymentMethod: string;
  bookingSuccess: any;
  
  // UI state
  isLoading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  currentStep: 1,
  experienceType: null,
  selectedSurfCamp: null,
  selectedSurfWeekRoom: null,
  dates: { checkIn: null, checkOut: null },
  guests: 1,
  roomAssignments: {},
  addOns: [],
  paymentMethod: 'stripe',
  bookingSuccess: null,
  isLoading: false,
  error: null,
};

type BookingAction =
  | { type: 'SET_EXPERIENCE_TYPE'; payload: 'room' | 'surf-week' }
  | { type: 'SET_SURF_CAMP'; payload: any }
  | { type: 'SET_SURF_WEEK_ROOM'; payload: string }
  | { type: 'SET_DATES'; payload: { checkIn: Date | null; checkOut: Date | null } }
  | { type: 'SET_GUESTS'; payload: number }
  | { type: 'SET_ROOM_ASSIGNMENTS'; payload: Record<string, string[]> }
  | { type: 'SET_ADD_ONS'; payload: any[] }
  | { type: 'SET_PAYMENT_METHOD'; payload: string }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'COMPLETE_BOOKING'; payload: any }
  | { type: 'RESET_BOOKING' };

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_EXPERIENCE_TYPE':
      return { ...state, experienceType: action.payload, currentStep: 2 };
    case 'SET_SURF_CAMP':
      return { ...state, selectedSurfCamp: action.payload };
    case 'SET_SURF_WEEK_ROOM':
      return { ...state, selectedSurfWeekRoom: action.payload };
    case 'SET_DATES':
      return { ...state, dates: action.payload };
    case 'SET_GUESTS':
      return { ...state, guests: action.payload };
    case 'SET_ROOM_ASSIGNMENTS':
      return { ...state, roomAssignments: action.payload };
    case 'SET_ADD_ONS':
      return { ...state, addOns: action.payload };
    case 'SET_PAYMENT_METHOD':
      return { ...state, paymentMethod: action.payload };
    case 'NEXT_STEP':
      return { ...state, currentStep: Math.min(state.currentStep + 1, 6) };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 1) };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'COMPLETE_BOOKING':
      return { ...state, bookingSuccess: action.payload, currentStep: 7 };
    case 'RESET_BOOKING':
      return initialState;
    default:
      return state;
  }
}

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
  actions: {
    setExperienceType: (type: 'room' | 'surf-week') => void;
    setSurfCamp: (camp: any) => void;
    setSurfWeekRoom: (roomId: string) => void;
    setDates: (dates: { checkIn: Date | null; checkOut: Date | null }) => void;
    setGuests: (guests: number) => void;
    setRoomAssignments: (assignments: Record<string, string[]>) => void;
    setAddOns: (addOns: any[]) => void;
    setPaymentMethod: (method: string) => void;
    nextStep: () => void;
    prevStep: () => void;
    setStep: (step: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    completeBooking: (booking: any) => void;
    resetBooking: () => void;
    canProceedToNextStep: () => boolean;
  };
} | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const actions = {
    setExperienceType: useCallback((type: 'room' | 'surf-week') => {
      dispatch({ type: 'SET_EXPERIENCE_TYPE', payload: type });
    }, []),

    setSurfCamp: useCallback((camp: any) => {
      dispatch({ type: 'SET_SURF_CAMP', payload: camp });
    }, []),

    setSurfWeekRoom: useCallback((roomId: string) => {
      dispatch({ type: 'SET_SURF_WEEK_ROOM', payload: roomId });
    }, []),

    setDates: useCallback((dates: { checkIn: Date | null; checkOut: Date | null }) => {
      dispatch({ type: 'SET_DATES', payload: dates });
    }, []),

    setGuests: useCallback((guests: number) => {
      dispatch({ type: 'SET_GUESTS', payload: guests });
    }, []),

    setRoomAssignments: useCallback((assignments: Record<string, string[]>) => {
      dispatch({ type: 'SET_ROOM_ASSIGNMENTS', payload: assignments });
    }, []),

    setAddOns: useCallback((addOns: any[]) => {
      dispatch({ type: 'SET_ADD_ONS', payload: addOns });
    }, []),

    setPaymentMethod: useCallback((method: string) => {
      dispatch({ type: 'SET_PAYMENT_METHOD', payload: method });
    }, []),

    nextStep: useCallback(() => {
      dispatch({ type: 'NEXT_STEP' });
    }, []),

    prevStep: useCallback(() => {
      dispatch({ type: 'PREV_STEP' });
    }, []),

    setStep: useCallback((step: number) => {
      dispatch({ type: 'SET_STEP', payload: step });
    }, []),

    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    }, []),

    completeBooking: useCallback((booking: any) => {
      dispatch({ type: 'COMPLETE_BOOKING', payload: booking });
    }, []),

    resetBooking: useCallback(() => {
      dispatch({ type: 'RESET_BOOKING' });
    }, []),

    canProceedToNextStep: useCallback(() => {
      switch (state.currentStep) {
        case 1:
          return !!state.experienceType;
        case 2:
          if (state.experienceType === 'surf-week') {
            return !!state.selectedSurfCamp;
          } else {
            return !!state.dates.checkIn && !!state.dates.checkOut;
          }
        case 3:
          return state.experienceType === 'surf-week' ? !!state.selectedSurfWeekRoom : true;
        case 4:
          return Object.keys(state.roomAssignments).length > 0 || state.experienceType === 'surf-week';
        case 5:
          return true; // Add-ons are optional
        case 6:
          return true; // Payment step
        default:
          return false;
      }
    }, [state])
  };

  return React.createElement(BookingContext.Provider, {
    value: { state, dispatch, actions }
  }, children);
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
