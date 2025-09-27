// Vanilla JavaScript state management for WordPress UMD compatibility
// This completely bypasses React hooks which don't work in WordPress UMD environment

(function() {
  'use strict';

  // Global state object - WordPress compatible
  window.heiwaBookingState = {
    currentStep: 1,
    experienceType: null,
    dates: { checkIn: null, checkOut: null },
    guests: 1,
    selectedOption: null,
    selectedSurfWeek: null,
    selectedSurfWeekRoom: null,
    roomAssignments: [],
    selectedAddOns: [],
    paymentMethod: null,
    bankWireDetails: null,
    guestDetails: [],
    pricing: {
      basePrice: 0,
      addOnsSubtotal: 0,
      taxes: 0,
      fees: 0,
      total: 0,
      currency: 'EUR'
    },
    isLoading: false,
    errors: {}
  };

  // State change listeners
  window.heiwaStateListeners = [];

  // Subscribe to state changes
  window.heiwaSubscribeToState = function(listener) {
    window.heiwaStateListeners.push(listener);
    return function() {
      const index = window.heiwaStateListeners.indexOf(listener);
      if (index > -1) {
        window.heiwaStateListeners.splice(index, 1);
      }
    };
  };

  // Update state function
  window.heiwaUpdateState = function(updates) {
    console.log('🎯 heiwaUpdateState called with:', updates);
    Object.assign(window.heiwaBookingState, updates);
    console.log('🎯 New heiwaBookingState:', window.heiwaBookingState);
    
    // Notify all listeners
    window.heiwaStateListeners.forEach(function(listener) {
      try {
        listener(window.heiwaBookingState);
      } catch (e) {
        console.error('Error in state listener:', e);
      }
    });

    // Force DOM updates
    window.heiwaForceUpdate();
  };

  // Get step flow based on current state
  window.heiwaGetStepFlow = function() {
    const baseSteps = ['experience', 'options'];

    if (window.heiwaBookingState.experienceType === 'surf-week') {
      baseSteps.push('surf-week-room-selection');
    }

    if (window.heiwaBookingState.experienceType === 'room') {
      baseSteps.push('guest-details');
      if (window.heiwaBookingState.guests > 1) {
        baseSteps.push('room-assignment');
      }
    } else if (window.heiwaBookingState.experienceType === 'surf-week') {
      baseSteps.push('guest-details');
    }

    baseSteps.push('add-ons', 'review-pay');
    return baseSteps;
  };

  // Get current step type
  window.heiwaGetCurrentStepType = function() {
    const stepFlow = window.heiwaGetStepFlow();
    return stepFlow[window.heiwaBookingState.currentStep - 1] || 'experience';
  };

  // Check if can proceed to next step
  window.heiwaCanProceedToNextStep = function() {
    const currentStepType = window.heiwaGetCurrentStepType();

    switch (currentStepType) {
      case 'experience':
        return true;
      case 'options':
        if (window.heiwaBookingState.experienceType === 'surf-week') {
          return window.heiwaBookingState.selectedSurfWeek !== null;
        }
        return window.heiwaBookingState.dates.checkIn && 
               window.heiwaBookingState.dates.checkOut && 
               window.heiwaBookingState.guests > 0 && 
               window.heiwaBookingState.selectedOption !== null;
      case 'surf-week-room-selection':
        return window.heiwaBookingState.selectedSurfWeekRoom !== null;
      case 'room-assignment':
        return window.heiwaBookingState.roomAssignments.flatMap(function(a) { 
          return a.guestIds; 
        }).length === window.heiwaBookingState.guests;
      case 'add-ons':
        return true;
      case 'guest-details':
        return window.heiwaBookingState.guestDetails.length === window.heiwaBookingState.guests && 
               window.heiwaBookingState.guestDetails.every(function(g) { 
                 return g.firstName && g.lastName && g.email; 
               });
      case 'review-pay':
        return window.heiwaBookingState.paymentMethod !== null;
      default:
        return false;
    }
  };

  // Action functions
  window.heiwaNextStep = function() {
    const stepFlow = window.heiwaGetStepFlow();
    if (window.heiwaBookingState.currentStep < stepFlow.length) {
      console.log('🎯 Next step advanced:', window.heiwaBookingState.currentStep, '→', window.heiwaBookingState.currentStep + 1);
      window.heiwaUpdateState({ currentStep: window.heiwaBookingState.currentStep + 1 });
    }
  };

  window.heiwaPrevStep = function() {
    if (window.heiwaBookingState.currentStep > 1) {
      console.log('🎯 Previous step:', window.heiwaBookingState.currentStep, '→', window.heiwaBookingState.currentStep - 1);
      window.heiwaUpdateState({ currentStep: window.heiwaBookingState.currentStep - 1 });
    }
  };

  window.heiwaSetExperienceType = function(type) {
    console.log('🎯 Experience type set:', type);
    window.heiwaUpdateState({ experienceType: type, selectedOption: null });
  };

  window.heiwaSetDates = function(dates) {
    console.log('🎯 Dates set:', dates);
    window.heiwaUpdateState({ dates: dates, selectedOption: null });
  };

  window.heiwaSetGuests = function(guests) {
    console.log('🎯 Guests set:', guests);
    window.heiwaUpdateState({ guests: guests, selectedOption: null });
  };

  window.heiwaSelectOption = function(option) {
    console.log('🎯 Option selected:', option);
    window.heiwaUpdateState({ selectedOption: option });
  };

  window.heiwaSetSurfWeek = function(surfWeek) {
    console.log('🎯 Surf week set:', surfWeek);
    window.heiwaUpdateState({ selectedSurfWeek: surfWeek });
  };

  window.heiwaSetSurfWeekRoom = function(room) {
    console.log('🎯 Surf week room set:', room);
    window.heiwaUpdateState({ selectedSurfWeekRoom: room });
  };

  window.heiwaSetRoomAssignments = function(assignments) {
    console.log('🎯 Room assignments set:', assignments.length, 'assignments');
    window.heiwaUpdateState({ roomAssignments: assignments });
  };

  window.heiwaAddRoomAssignment = function(assignment) {
    console.log('🎯 Room assignment added:', assignment);
    const newAssignments = [...window.heiwaBookingState.roomAssignments, assignment];
    window.heiwaUpdateState({ roomAssignments: newAssignments });
  };

  window.heiwaRemoveRoomAssignment = function(assignmentId) {
    console.log('🎯 Room assignment removed:', assignmentId);
    const filteredAssignments = window.heiwaBookingState.roomAssignments.filter(function(a) {
      return a.id !== assignmentId;
    });
    window.heiwaUpdateState({ roomAssignments: filteredAssignments });
  };

  window.heiwaSetAddOns = function(addOns) {
    console.log('🎯 Add-ons set:', addOns.length, 'items');
    window.heiwaUpdateState({ selectedAddOns: addOns });
  };

  window.heiwaSetPaymentMethod = function(method) {
    console.log('🎯 Payment method set:', method);
    window.heiwaUpdateState({ paymentMethod: method });
  };

  window.heiwaUpdatePricing = function(pricing) {
    console.log('🎯 Pricing updated:', pricing.total);
    window.heiwaUpdateState({ pricing: pricing });
  };

  window.heiwaReset = function() {
    console.log('🎯 State reset to initial');
    Object.assign(window.heiwaBookingState, {
      currentStep: 1,
      experienceType: null,
      dates: { checkIn: null, checkOut: null },
      guests: 1,
      selectedOption: null,
      selectedSurfWeek: null,
      selectedSurfWeekRoom: null,
      roomAssignments: [],
      selectedAddOns: [],
      paymentMethod: null,
      bankWireDetails: null,
      guestDetails: [],
      pricing: {
        basePrice: 0,
        addOnsSubtotal: 0,
        taxes: 0,
        fees: 0,
        total: 0,
        currency: 'EUR'
      },
      isLoading: false,
      errors: {}
    });
    
    // Notify listeners
    window.heiwaStateListeners.forEach(function(listener) {
      try {
        listener(window.heiwaBookingState);
      } catch (e) {
        console.error('Error in reset listener:', e);
      }
    });

    window.heiwaForceUpdate();
  };

  // Force DOM update function
  window.heiwaForceUpdate = function() {
    // Find all widgets and trigger re-render
    const widgets = document.querySelectorAll('[data-heiwa-widget]');
    widgets.forEach(function(widget) {
      // Trigger custom event to force React re-render if possible
      try {
        const event = new CustomEvent('heiwaStateUpdate', { 
          detail: window.heiwaBookingState 
        });
        widget.dispatchEvent(event);
      } catch (e) {
        console.log('Custom event failed, trying direct DOM manipulation');
      }

      // Direct DOM manipulation fallback
      const nextButtons = widget.querySelectorAll('[data-testid="next-button"]');
      nextButtons.forEach(function(button) {
        if (window.heiwaCanProceedToNextStep()) {
          button.removeAttribute('disabled');
          button.classList.remove('opacity-50', 'cursor-not-allowed');
          button.classList.add('hover:scale-105');
        } else {
          button.setAttribute('disabled', 'true');
          button.classList.add('opacity-50', 'cursor-not-allowed');
          button.classList.remove('hover:scale-105');
        }
      });

      // Update step indicators
      const stepIndicators = widget.querySelectorAll('[data-step-indicator]');
      stepIndicators.forEach(function(indicator, index) {
        const stepNumber = index + 1;
        if (stepNumber === window.heiwaBookingState.currentStep) {
          indicator.classList.add('bg-orange-500', 'text-white');
          indicator.classList.remove('bg-gray-200', 'text-gray-600');
        } else if (stepNumber < window.heiwaBookingState.currentStep) {
          indicator.classList.add('bg-green-500', 'text-white');
          indicator.classList.remove('bg-gray-200', 'text-gray-600', 'bg-orange-500');
        } else {
          indicator.classList.add('bg-gray-200', 'text-gray-600');
          indicator.classList.remove('bg-orange-500', 'bg-green-500', 'text-white');
        }
      });
    });
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🎯 Vanilla booking flow initialized');
    });
  } else {
    console.log('🎯 Vanilla booking flow initialized');
  }

})();
