'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle } from 'lucide-react';
import { useBookingFlow } from './hooks/useBookingFlow';
import { ProgressIndicator } from './ui/ProgressIndicator';
import { ExperienceSelection } from './steps/ExperienceSelection';
import { OptionSelection } from './steps/OptionSelection';
import { RoomAssignment } from './steps/RoomAssignment';
import { SurfWeekRoomSelection } from './steps/SurfWeekRoomSelection';
import { AddOnsSelection } from './steps/AddOnsSelection';
import { GuestDetails } from './steps/GuestDetails';
import { ReviewAndPay } from './steps/ReviewAndPay';
import './styles/surf-enhancements.css';

interface BookingWidgetProps {
  className?: string;
  config?: {
    apiEndpoint?: string;
    apiKey?: string;
    position?: 'right' | 'left' | 'center';
    primaryColor?: string;
    triggerText?: string;
    maxGuests?: number;
  };
  // Web Component integration props
  isWebComponent?: boolean;
  externalTrigger?: () => void;
  onModalStateChange?: (isOpen: boolean) => void;
}

export function BookingWidget({
  className = '',
  config,
  isWebComponent = false,
  externalTrigger,
  onModalStateChange
}: BookingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const { state, actions, computed } = useBookingFlow();

  useEffect(() => {
    // Handle body overflow and modal classes
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('heiwa-modal-open');

      // For Web Component, modal stays within shadow DOM
      if (!isWebComponent) {
        // Move modal to body to break out of container (legacy behavior)
        setTimeout(() => {
          const modal = document.querySelector('.heiwa-modal-overlay');
          if (modal && modal.parentElement !== document.body) {
            document.body.appendChild(modal);
          }
        }, 0);
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('heiwa-modal-open');
    }

    // Notify Web Component of modal state changes
    onModalStateChange?.(isOpen);

    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('heiwa-modal-open');
    };
  }, [isOpen, isWebComponent, onModalStateChange]);

  const openWidget = () => {
    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setBookingSuccess(null);
    actions.reset();
  };

  const handleBookingComplete = (bookingData?: any) => {
    if (bookingData) {
      // Show success message with booking data
      setBookingSuccess(bookingData);
    } else {
      // No booking data, just close widget
      closeWidget();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeWidget();
    }
  };

  const renderCurrentStep = () => {
    const currentStepType = computed.currentStepType;

    const stepComponents = {
      'experience': <ExperienceSelection state={state} actions={actions} />,
      'options': <OptionSelection state={state} actions={actions} />,
      'room-assignment': <RoomAssignment state={state} actions={actions} />,
      'surf-week-room-selection': <SurfWeekRoomSelection state={state} actions={actions} />,
      'add-ons': <AddOnsSelection state={state} actions={actions} />,
      'guest-details': <GuestDetails state={state} actions={actions} />,
      'review-pay': <ReviewAndPay state={state} actions={actions} onComplete={handleBookingComplete} />,
    };

    return (
      <div
        key={`${state.currentStep}-${currentStepType}`}
        className="animate-in fade-in-0 slide-in-from-right-4 duration-500 ease-out"
      >
        {stepComponents[currentStepType as keyof typeof stepComponents] || (
          <div className="text-center text-red-600">
            <p>Invalid step: {currentStepType}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Trigger Button - Only render for non-Web Component usage */}
      {!isWebComponent && (
        <button
          onClick={openWidget}
          className="relative z-50 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-orange-500/30 animate-in fade-in-0 slide-in-from-top-2 duration-700 delay-300 group"
          aria-label="Open booking widget"
        >
          <Calendar size={18} className="transition-transform duration-300 group-hover:rotate-12" />
          <span className="relative">
            {config?.triggerText || 'Book Now'}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </span>
        </button>
      )}

      {/* Widget Modal */}
      {isOpen && (
        <div
          className="heiwa-modal-overlay"
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
        >
          {/* Widget Panel */}
          <div
            className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 ease-out flex flex-col sm:max-w-lg lg:max-w-xl transform-gpu"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '28rem',
              height: '100%',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-bold text-gray-900">
                Book Your Surf Adventure
              </h2>
              <button
                onClick={closeWidget}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                aria-label="Close booking widget"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Indicator */}
            <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
              <ProgressIndicator
                currentStep={state.currentStep}
                stepFlow={computed.stepFlow}
                totalSteps={computed.totalSteps}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {bookingSuccess ? (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                      <p className="text-gray-600">
                        Booking #{bookingSuccess.booking?.booking_number || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Confirmation email sent to your inbox</li>
                        <li>• Complete payment within 24 hours to secure your booking</li>
                        <li>• Check your email for payment instructions</li>
                      </ul>
                    </div>
                    <button
                      onClick={closeWidget}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  renderCurrentStep()
                )}
              </div>
            </div>

            {/* Footer Navigation */}
            {!bookingSuccess && (
              <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gradient-to-r from-white to-gray-50">
                <button
                  onClick={actions.prevStep}
                  disabled={computed.isFirstStep}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Back
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      €{state.pricing.total}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>

                  <button
                    onClick={actions.nextStep}
                    disabled={!computed.canProceedToNextStep || state.isLoading}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-out hover:scale-[1.02] disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {state.isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </div>
                    ) : computed.isLastStep ? (
                      'Complete Booking'
                    ) : (
                      'Next'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
