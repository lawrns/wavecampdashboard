// Pure Vanilla JavaScript Booking Widget for WordPress UMD compatibility
// This completely replaces React state management with direct DOM manipulation

(function() {
  'use strict';

  // Global state - WordPress compatible
  var bookingState = {
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
    guestDetails: [],
    pricing: { basePrice: 0, addOnsSubtotal: 0, taxes: 0, fees: 0, total: 0, currency: 'EUR' },
    isLoading: false,
    errors: {}
  };

  // DOM element references
  var widgetContainer = null;
  var stepContent = null;
  var nextButton = null;
  var backButton = null;
  var stepIndicators = null;

  // Initialize the vanilla booking widget
  function initVanillaBookingWidget(container) {
    console.log('🎯 Initializing Vanilla Booking Widget');
    
    widgetContainer = container;
    widgetContainer.innerHTML = getWidgetHTML();
    
    // Get DOM references
    stepContent = widgetContainer.querySelector('.step-content');
    nextButton = widgetContainer.querySelector('.next-button');
    backButton = widgetContainer.querySelector('.back-button');
    stepIndicators = widgetContainer.querySelectorAll('.step-indicator');
    
    // Attach event listeners
    attachEventListeners();
    
    // Render initial step
    renderCurrentStep();
    
    console.log('✅ Vanilla Booking Widget initialized');
  }

  // Get the complete widget HTML
  function getWidgetHTML() {
    return `
      <div class="vanilla-booking-widget">
        <div class="widget-header">
          <h2>Book Your Surf Adventure</h2>
          <button class="close-button">×</button>
        </div>
        
        <div class="progress-bar">
          <div class="step-indicator active" data-step="1">
            <span class="step-number">1</span>
            <span class="step-label">Experience</span>
          </div>
          <div class="step-indicator" data-step="2">
            <span class="step-number">2</span>
            <span class="step-label">Options</span>
          </div>
          <div class="step-indicator" data-step="3">
            <span class="step-number">3</span>
            <span class="step-label">Add-ons</span>
          </div>
          <div class="step-indicator" data-step="4">
            <span class="step-number">4</span>
            <span class="step-label">Review</span>
          </div>
        </div>
        
        <div class="step-content">
          <!-- Step content will be rendered here -->
        </div>
        
        <div class="widget-footer">
          <button class="back-button" disabled>Back</button>
          <div class="pricing-summary">
            <span class="total-price">€0 Total</span>
          </div>
          <button class="next-button">Next</button>
        </div>
      </div>
    `;
  }

  // Attach event listeners
  function attachEventListeners() {
    if (nextButton) {
      nextButton.addEventListener('click', handleNextClick);
    }
    if (backButton) {
      backButton.addEventListener('click', handleBackClick);
    }
    
    // Close button
    var closeButton = widgetContainer.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        widgetContainer.style.display = 'none';
      });
    }
  }

  // Handle next button click
  function handleNextClick() {
    console.log('🎯 Next button clicked, current step:', bookingState.currentStep);
    
    if (canProceedToNextStep()) {
      bookingState.currentStep++;
      console.log('🎯 Advanced to step:', bookingState.currentStep);
      updateUI();
      renderCurrentStep();
    } else {
      console.log('❌ Cannot proceed to next step');
    }
  }

  // Handle back button click
  function handleBackClick() {
    if (bookingState.currentStep > 1) {
      bookingState.currentStep--;
      updateUI();
      renderCurrentStep();
    }
  }

  // Check if can proceed to next step
  function canProceedToNextStep() {
    var currentStepType = getCurrentStepType();
    
    switch (currentStepType) {
      case 'experience':
        return bookingState.experienceType !== null;
      case 'options':
        if (bookingState.experienceType === 'surf-week') {
          return bookingState.selectedSurfWeek !== null;
        }
        return bookingState.dates.checkIn && bookingState.dates.checkOut && 
               bookingState.guests > 0 && bookingState.selectedOption !== null;
      case 'add-ons':
        return true;
      case 'review-pay':
        return bookingState.paymentMethod !== null;
      default:
        return false;
    }
  }

  // Get current step type
  function getCurrentStepType() {
    var stepFlow = getStepFlow();
    return stepFlow[bookingState.currentStep - 1] || 'experience';
  }

  // Get step flow based on state
  function getStepFlow() {
    var baseSteps = ['experience', 'options'];
    
    if (bookingState.experienceType === 'surf-week') {
      baseSteps.push('surf-week-room-selection');
    }
    
    if (bookingState.experienceType === 'room') {
      baseSteps.push('guest-details');
      if (bookingState.guests > 1) {
        baseSteps.push('room-assignment');
      }
    } else if (bookingState.experienceType === 'surf-week') {
      baseSteps.push('guest-details');
    }
    
    baseSteps.push('add-ons', 'review-pay');
    return baseSteps;
  }

  // Render current step
  function renderCurrentStep() {
    if (!stepContent) return;
    
    var currentStepType = getCurrentStepType();
    var html = '';
    
    switch (currentStepType) {
      case 'experience':
        html = getExperienceStepHTML();
        break;
      case 'options':
        html = getOptionsStepHTML();
        break;
      case 'add-ons':
        html = getAddOnsStepHTML();
        break;
      case 'review-pay':
        html = getReviewStepHTML();
        break;
      default:
        html = '<div class="step-placeholder"><p>Step content coming soon...</p></div>';
    }
    
    stepContent.innerHTML = html;
    
    // Attach step-specific event listeners
    attachStepEventListeners(currentStepType);
  }

  // Get experience selection step HTML
  function getExperienceStepHTML() {
    return `
      <div class="step experience-step">
        <h3>Choose Your Adventure</h3>
        <p>How would you like to experience Heiwa House?</p>
        
        <div class="experience-options">
          <button class="experience-option room-option ${bookingState.experienceType === 'room' ? 'selected' : ''}" 
                  data-experience="room">
            <div class="option-header">
              <h4>Book a Room</h4>
              <div class="price">From €45</div>
            </div>
            <p>Choose your dates and accommodation. Perfect for flexible stays.</p>
            <div class="features">
              <span class="feature">Flexible dates</span>
              <span class="feature">Choose your room</span>
              <span class="feature">Self-guided experience</span>
            </div>
          </button>
          
          <button class="experience-option surf-week-option ${bookingState.experienceType === 'surf-week' ? 'selected' : ''}" 
                  data-experience="surf-week">
            <div class="option-header">
              <h4>All-Inclusive Surf Week</h4>
              <div class="price">From €599</div>
            </div>
            <p>Join our structured surf camp programs with coaching and community.</p>
            <div class="features">
              <span class="feature">Professional coaching</span>
              <span class="feature">All meals included</span>
              <span class="feature">Structured program</span>
            </div>
          </button>
        </div>
        
        <p class="help-text">Not sure which option? Our room booking offers more flexibility, while surf weeks provide a complete guided experience.</p>
      </div>
    `;
  }

  // Get options step HTML (placeholder)
  function getOptionsStepHTML() {
    return `
      <div class="step options-step">
        <h3>Select Your Options</h3>
        <p>Choose your dates, number of guests, and accommodation options.</p>
        
        <div class="options-form">
          <div class="form-group">
            <label>Check-in Date</label>
            <input type="date" class="date-input checkin-date" />
          </div>
          
          <div class="form-group">
            <label>Check-out Date</label>
            <input type="date" class="date-input checkout-date" />
          </div>
          
          <div class="form-group">
            <label>Number of Guests</label>
            <select class="guests-select">
              <option value="1" ${bookingState.guests === 1 ? 'selected' : ''}>1 Guest</option>
              <option value="2" ${bookingState.guests === 2 ? 'selected' : ''}>2 Guests</option>
              <option value="3" ${bookingState.guests === 3 ? 'selected' : ''}>3 Guests</option>
              <option value="4" ${bookingState.guests === 4 ? 'selected' : ''}>4 Guests</option>
            </select>
          </div>
          
          <div class="room-options">
            <h4>Available Rooms</h4>
            <div class="room-list">
              <div class="room-option" data-room-id="standard">
                <h5>Standard Room</h5>
                <p>Comfortable room with garden view</p>
                <div class="room-price">€85/night</div>
              </div>
              <div class="room-option" data-room-id="deluxe">
                <h5>Deluxe Room</h5>
                <p>Spacious room with ocean view</p>
                <div class="room-price">€120/night</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Get add-ons step HTML
  function getAddOnsStepHTML() {
    return `
      <div class="step addons-step">
        <h3>Enhance Your Experience</h3>
        <p>Add optional services to make your stay even better.</p>
        
        <div class="addons-list">
          <div class="addon-item">
            <input type="checkbox" id="surf-lessons" class="addon-checkbox" />
            <label for="surf-lessons" class="addon-label">
              <div class="addon-info">
                <h5>Private Surf Lessons</h5>
                <p>2-hour private surf lesson with our expert instructors</p>
              </div>
              <div class="addon-price">€80</div>
            </label>
          </div>
          
          <div class="addon-item">
            <input type="checkbox" id="yoga-session" class="addon-checkbox" />
            <label for="yoga-session" class="addon-label">
              <div class="addon-info">
                <h5>Beach Yoga Session</h5>
                <p>Relaxing 1-hour yoga session at sunrise</p>
              </div>
              <div class="addon-price">€25</div>
            </label>
          </div>
          
          <div class="addon-item">
            <input type="checkbox" id="airport-transfer" class="addon-checkbox" />
            <label for="airport-transfer" class="addon-label">
              <div class="addon-info">
                <h5>Airport Transfer</h5>
                <p>Round-trip airport transfer service</p>
              </div>
              <div class="addon-price">€45</div>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  // Get review step HTML
  function getReviewStepHTML() {
    return `
      <div class="step review-step">
        <h3>Review Your Booking</h3>
        <p>Please review your booking details and complete payment.</p>
        
        <div class="booking-summary">
          <div class="summary-section">
            <h4>Experience</h4>
            <p>${bookingState.experienceType === 'room' ? 'Room Booking' : 'Surf Week'}</p>
          </div>
          
          <div class="summary-section">
            <h4>Details</h4>
            <p>Check-in: ${bookingState.dates.checkIn || 'Not selected'}</p>
            <p>Check-out: ${bookingState.dates.checkOut || 'Not selected'}</p>
            <p>Guests: ${bookingState.guests}</p>
          </div>
          
          <div class="payment-section">
            <h4>Payment Method</h4>
            <div class="payment-options">
              <button class="payment-option stripe-option" data-payment="card_stripe">
                💳 Credit Card (Stripe)
              </button>
              <button class="payment-option wire-option" data-payment="bank_wire">
                🏦 Bank Transfer
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Attach step-specific event listeners
  function attachStepEventListeners(stepType) {
    switch (stepType) {
      case 'experience':
        attachExperienceListeners();
        break;
      case 'options':
        attachOptionsListeners();
        break;
      case 'add-ons':
        attachAddOnsListeners();
        break;
      case 'review-pay':
        attachPaymentListeners();
        break;
    }
  }

  // Attach experience selection listeners
  function attachExperienceListeners() {
    var options = stepContent.querySelectorAll('.experience-option');
    options.forEach(function(option) {
      option.addEventListener('click', function() {
        var experienceType = this.getAttribute('data-experience');
        bookingState.experienceType = experienceType;
        
        // Update UI
        options.forEach(function(opt) { opt.classList.remove('selected'); });
        this.classList.add('selected');
        
        updateUI();
        console.log('🎯 Experience selected:', experienceType);
      });
    });
  }

  // Attach options listeners
  function attachOptionsListeners() {
    // Date inputs
    var checkinInput = stepContent.querySelector('.checkin-date');
    var checkoutInput = stepContent.querySelector('.checkout-date');
    
    if (checkinInput) {
      checkinInput.addEventListener('change', function() {
        bookingState.dates.checkIn = this.value;
        updateUI();
      });
    }
    
    if (checkoutInput) {
      checkoutInput.addEventListener('change', function() {
        bookingState.dates.checkOut = this.value;
        updateUI();
      });
    }
    
    // Guests select
    var guestsSelect = stepContent.querySelector('.guests-select');
    if (guestsSelect) {
      guestsSelect.addEventListener('change', function() {
        bookingState.guests = parseInt(this.value);
        updateUI();
      });
    }
    
    // Room options
    var roomOptions = stepContent.querySelectorAll('.room-option');
    roomOptions.forEach(function(room) {
      room.addEventListener('click', function() {
        var roomId = this.getAttribute('data-room-id');
        bookingState.selectedOption = roomId;
        
        roomOptions.forEach(function(r) { r.classList.remove('selected'); });
        this.classList.add('selected');
        
        updateUI();
      });
    });
  }

  // Attach add-ons listeners
  function attachAddOnsListeners() {
    var checkboxes = stepContent.querySelectorAll('.addon-checkbox');
    checkboxes.forEach(function(checkbox) {
      checkbox.addEventListener('change', function() {
        // Update add-ons selection
        updateUI();
      });
    });
  }

  // Attach payment listeners
  function attachPaymentListeners() {
    var paymentOptions = stepContent.querySelectorAll('.payment-option');
    paymentOptions.forEach(function(option) {
      option.addEventListener('click', function() {
        var paymentMethod = this.getAttribute('data-payment');
        bookingState.paymentMethod = paymentMethod;
        
        paymentOptions.forEach(function(opt) { opt.classList.remove('selected'); });
        this.classList.add('selected');
        
        updateUI();
      });
    });
  }

  // Update UI elements
  function updateUI() {
    // Update next button state
    if (nextButton) {
      if (canProceedToNextStep()) {
        nextButton.removeAttribute('disabled');
        nextButton.textContent = bookingState.currentStep >= getStepFlow().length ? 'Complete Booking' : 'Next';
      } else {
        nextButton.setAttribute('disabled', 'true');
        nextButton.textContent = 'Next';
      }
    }
    
    // Update back button state
    if (backButton) {
      if (bookingState.currentStep > 1) {
        backButton.removeAttribute('disabled');
      } else {
        backButton.setAttribute('disabled', 'true');
      }
    }
    
    // Update step indicators
    if (stepIndicators) {
      stepIndicators.forEach(function(indicator, index) {
        var stepNumber = index + 1;
        indicator.classList.remove('active', 'completed');
        
        if (stepNumber === bookingState.currentStep) {
          indicator.classList.add('active');
        } else if (stepNumber < bookingState.currentStep) {
          indicator.classList.add('completed');
        }
      });
    }
    
    // Update pricing
    var pricingElement = widgetContainer.querySelector('.total-price');
    if (pricingElement) {
      pricingElement.textContent = '€' + bookingState.pricing.total + ' Total';
    }
  }

  // Export for WordPress integration
  window.initVanillaBookingWidget = initVanillaBookingWidget;
  window.vanillaBookingState = bookingState;

  console.log('🎯 Vanilla Booking Widget loaded');

})();
