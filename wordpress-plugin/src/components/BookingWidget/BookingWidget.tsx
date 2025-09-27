// WordPress-compatible React Booking Widget
// Designed to work properly in Shadow DOM isolation

'use client';

import React, { useState, useCallback } from 'react';
import { X, ArrowRight } from 'lucide-react';

// Simple state management that works in Shadow DOM
interface BookingState {
  currentStep: number;
  experienceType: 'room' | 'surf-week' | null;
  dates: { checkIn: Date | null; checkOut: Date | null };
  guests: number;
  selectedOption: any;
}

const initialState: BookingState = {
  currentStep: 1,
  experienceType: null,
  dates: { checkIn: null, checkOut: null },
  guests: 1,
  selectedOption: null,
};

export function BookingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<BookingState>(initialState);

  const openWidget = useCallback(() => {
    setIsOpen(true);
    console.log('🎯 Booking widget opened');
  }, []);

  const closeWidget = useCallback(() => {
    setIsOpen(false);
    console.log('🎯 Booking widget closed');
  }, []);

  const nextStep = useCallback(() => {
    if (state.currentStep < 4) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
      console.log('🎯 Next step:', state.currentStep + 1);
    }
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
      console.log('🎯 Previous step:', state.currentStep - 1);
    }
  }, [state.currentStep]);

  const selectExperience = useCallback((type: 'room' | 'surf-week') => {
    setState(prev => ({ ...prev, experienceType: type }));
    console.log('🎯 Experience selected:', type);
  }, []);

  const canProceed = useCallback(() => {
    switch (state.currentStep) {
      case 1: return state.experienceType !== null;
      case 2: return true; // Options step always proceed
      case 3: return true; // Add-ons always proceed
      case 4: return true; // Review always proceed
      default: return false;
    }
  }, [state]);

  if (!isOpen) {
    return (
      <button
        onClick={openWidget}
        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
      >
        Book Now
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Book Your Surf Adventure</h2>
          <button
            onClick={closeWidget}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {['Experience', 'Options', 'Add-ons', 'Review'].map((step, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === state.currentStep;
              const isCompleted = stepNumber < state.currentStep;

              return (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : stepNumber}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                  {index < 3 && (
                    <div className="mx-4 w-8 h-px bg-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {state.currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Choose Your Adventure</h3>
              <p className="text-gray-600">How would you like to experience Heiwa House?</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => selectExperience('room')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    state.experienceType === 'room'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-lg mb-2">Book a Room</h4>
                  <p className="text-gray-600 text-sm mb-3">Choose your dates and accommodation. Perfect for flexible stays.</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Flexible dates</div>
                    <div>Choose your room</div>
                    <div>Self-guided experience</div>
                  </div>
                </button>

                <button
                  onClick={() => selectExperience('surf-week')}
                  className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                    state.experienceType === 'surf-week'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-lg mb-2">All-Inclusive Surf Week</h4>
                  <p className="text-gray-600 text-sm mb-3">Join our structured surf camp programs with coaching and community.</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Professional coaching</div>
                    <div>All meals included</div>
                    <div>Structured program</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Select Your Options</h3>
              <p className="text-gray-600">Choose your dates, number of guests, and accommodation options.</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setState(prev => ({ ...prev, dates: { ...prev.dates, checkIn: date } }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setState(prev => ({ ...prev, dates: { ...prev.dates, checkOut: date } }));
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Guests</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={state.guests}
                  onChange={(e) => setState(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                >
                  {[1,2,3,4].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {state.currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Enhance Your Experience</h3>
              <p className="text-gray-600">Add optional services to make your stay even better.</p>

              <div className="space-y-3">
                {[
                  { id: 'surf-lessons', name: 'Private Surf Lessons', price: '€80', desc: '2-hour private surf lesson with our expert instructors' },
                  { id: 'yoga', name: 'Beach Yoga Session', price: '€25', desc: 'Relaxing 1-hour yoga session at sunrise' },
                  { id: 'transfer', name: 'Airport Transfer', price: '€45', desc: 'Round-trip airport transfer service' }
                ].map(item => (
                  <label key={item.id} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900">{item.name}</h5>
                        <span className="text-orange-600 font-semibold">{item.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {state.currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">Review Your Booking</h3>
              <p className="text-gray-600">Please review your booking details and complete payment.</p>

              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Experience:</span>
                  <span>{state.experienceType === 'room' ? 'Room Booking' : 'Surf Week'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Guests:</span>
                  <span>{state.guests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Check-in:</span>
                  <span>{state.dates.checkIn ? state.dates.checkIn.toLocaleDateString() : 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Check-out:</span>
                  <span>{state.dates.checkOut ? state.dates.checkOut.toLocaleDateString() : 'Not selected'}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-600">€0</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Payment Method</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input type="radio" name="payment" value="stripe" className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                    <span>Credit Card (Stripe)</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="radio" name="payment" value="bank" className="w-4 h-4 text-orange-600 focus:ring-orange-500" />
                    <span>Bank Transfer</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={state.currentStep === 1}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Back
          </button>

          <div className="text-sm text-gray-500">
            Step {state.currentStep} of 4
          </div>

          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
          >
            <span>{state.currentStep === 4 ? 'Complete Booking' : 'Next'}</span>
            {state.currentStep < 4 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingWidget;
