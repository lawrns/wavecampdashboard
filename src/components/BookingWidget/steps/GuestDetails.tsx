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
import { User, Mail, Phone, Utensils, AlertCircle, Edit3, ChevronDown } from 'lucide-react';
import { BookingState, GuestInfo } from '../types';

interface GuestDetailsProps {
  state: BookingState;
  actions: {
    updateGuestDetails: (guest: GuestInfo) => void;
  };
}

interface GuestFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dietaryRequirements: string;
  specialRequests: string;
}

export function GuestDetails({ state, actions }: GuestDetailsProps) {
  const [guestForms, setGuestForms] = useState<GuestFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [initializedGuestCount, setInitializedGuestCount] = useState(0);

  // Initialize guest forms based on guest count - only when guest count changes
  useEffect(() => {
    if (state.guests !== initializedGuestCount) {
      const newForms: GuestFormData[] = [];
      for (let i = 0; i < state.guests; i++) {
        const existingGuest = state.guestDetails[i];
        const existingForm = guestForms[i];

        // Preserve existing form data if it exists and has unsaved changes
        if (existingForm && (
          existingForm.firstName || existingForm.lastName ||
          existingForm.email || existingForm.phone ||
          existingForm.dietaryRequirements || existingForm.specialRequests
        )) {
          // Keep existing form data
          newForms.push(existingForm);
        } else {
          // Initialize from saved guest data or empty
          newForms.push({
            firstName: existingGuest?.firstName || '',
            lastName: existingGuest?.lastName || '',
            email: existingGuest?.email || '',
            phone: existingGuest?.phone || '',
            dietaryRequirements: existingGuest?.dietaryRequirements || '',
            specialRequests: existingGuest?.specialRequests || '',
          });
        }
      }
      setGuestForms(newForms);
      setInitializedGuestCount(state.guests);
    }
  }, [state.guests, state.guestDetails, guestForms, initializedGuestCount]);

  // Check if all guests are valid and completed
  const checkAllGuestsCompleted = () => {
    if (guestForms.length !== state.guests) return false;

    return guestForms.every((form, index) => {
      const formErrors = validateForm(form, index);
      return formErrors.length === 0;
    }) && state.guestDetails.length === state.guests;
  };

  // Auto-collapse when all guests are completed
  useEffect(() => {
    const allCompleted = checkAllGuestsCompleted();
    if (allCompleted && !isCollapsed) {
      // Add a small delay for better UX
      const timer = setTimeout(() => {
        setIsCollapsed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [guestForms, state.guestDetails, state.guests, isCollapsed]);

  const validateForm = (formData: GuestFormData, index: number): string[] => {
    const formErrors: string[] = [];
    
    if (!formData.firstName.trim()) {
      formErrors.push(`Guest ${index + 1} first name is required`);
    }
    if (!formData.lastName.trim()) {
      formErrors.push(`Guest ${index + 1} last name is required`);
    }
    if (!formData.email.trim()) {
      formErrors.push(`Guest ${index + 1} email is required`);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      formErrors.push(`Guest ${index + 1} email is invalid`);
    }
    if (!formData.phone.trim()) {
      formErrors.push(`Guest ${index + 1} phone number is required`);
    }

    return formErrors;
  };

  const handleInputChange = (index: number, field: keyof GuestFormData, value: string) => {
    const newForms = [...guestForms];
    newForms[index] = { ...newForms[index], [field]: value };
    setGuestForms(newForms);

    // Clear error for this guest when any field is changed
    const errorKey = `guest-${index}`;
    if (errors[errorKey]) {
      const newErrors = { ...errors };
      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const handleSaveGuest = (index: number) => {
    const formData = guestForms[index];
    const formErrors = validateForm(formData, index);

    if (formErrors.length > 0) {
      // Set error for this specific guest
      const newErrors = { ...errors };
      newErrors[`guest-${index}`] = formErrors[0]; // Show first error
      setErrors(newErrors);
      return;
    }

    // Clear any existing errors for this guest
    const newErrors = { ...errors };
    delete newErrors[`guest-${index}`];
    setErrors(newErrors);

    const guestInfo: GuestInfo = {
      id: `guest-${index}`,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      dietaryRequirements: formData.dietaryRequirements.trim() || undefined,
      specialRequests: formData.specialRequests.trim() || undefined,
    };

    actions.updateGuestDetails(guestInfo);
  };

  const allGuestsValid = () => {
    return guestForms.every((form, index) => validateForm(form, index).length === 0);
  };

  const completedGuestsCount = state.guestDetails.filter(g => g.firstName && g.lastName && g.email).length;
  const allCompleted = checkAllGuestsCompleted();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Guest Details</h3>
        <p className="text-gray-600" data-testid="guest-count-instruction">
          Please provide details for all {state.guests} {state.guests === 1 ? 'guest' : 'guests'}
        </p>
      </div>

      {/* Collapsed Summary Card */}
      {isCollapsed && allCompleted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <User size={20} className="text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900">
                  {completedGuestsCount} {completedGuestsCount === 1 ? 'Participant' : 'Participants'} Added
                </h4>
                <p className="text-sm text-green-700">
                  {state.guestDetails.map(g => `${g.firstName} ${g.lastName}`).join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              <Edit3 size={16} />
              <span className="font-medium">Edit</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Guest Forms - Show when not collapsed */}
      {!isCollapsed && (
        <div className="space-y-6 transition-all duration-300">
          {guestForms.map((guestForm, index) => (
            <div key={`guest-${index}`} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            {/* Guest Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {index + 1}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">
                Guest {index + 1} {index === 0 && '(Primary Guest)'}
              </h4>
            </div>

            {/* Error Message */}
            {errors[`guest-${index}`] && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700" data-testid={`guest-${index}-error`}>
                <AlertCircle size={16} />
                <span className="text-sm">{errors[`guest-${index}`]}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div className="space-y-2">
                <label htmlFor={`firstName-${index}`} className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id={`firstName-${index}`}
                    type="text"
                    value={guestForm.firstName}
                    onChange={(e) => handleInputChange(index, 'firstName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    placeholder="Enter first name"
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <label htmlFor={`lastName-${index}`} className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id={`lastName-${index}`}
                    type="text"
                    value={guestForm.lastName}
                    onChange={(e) => handleInputChange(index, 'lastName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor={`email-${index}`} className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id={`email-${index}`}
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
                      guestForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email)
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {/* Real-time email validation indicator */}
                  {guestForm.email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email) ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
                {/* Real-time email validation message */}
                {guestForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email) && (
                  <p className="text-xs text-red-600 mt-1">Please enter a valid email address</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    id={`phone-${index}`}
                    type="tel"
                    value={guestForm.phone}
                    onChange={(e) => handleInputChange(index, 'phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Requirements */}
            <div className="mt-4 space-y-2">
              <label htmlFor={`dietary-${index}`} className="block text-sm font-medium text-gray-700">
                Dietary Requirements
              </label>
              <div className="relative">
                <Utensils size={16} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  id={`dietary-${index}`}
                  value={guestForm.dietaryRequirements}
                  onChange={(e) => handleInputChange(index, 'dietaryRequirements', e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 resize-none"
                  placeholder="Any dietary restrictions or preferences?"
                />
              </div>
            </div>

            {/* Special Requests */}
            <div className="mt-4 space-y-2">
              <label htmlFor={`requests-${index}`} className="block text-sm font-medium text-gray-700">
                Special Requests
              </label>
              <textarea
                id={`requests-${index}`}
                value={guestForm.specialRequests}
                onChange={(e) => handleInputChange(index, 'specialRequests', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 resize-none"
                placeholder="Any special requests or notes?"
              />
            </div>

            {/* Save Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSaveGuest(index)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                Save Guest {index + 1}
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Summary - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="font-semibold text-orange-900">Guest Information Status</h5>
              <p className="text-sm text-orange-700" data-testid="guest-completion-status">
                {completedGuestsCount} of {state.guests} guests completed
              </p>
            </div>
            <div className="text-right">
              {allCompleted ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">All guests ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium">Complete all fields</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          All information is required for booking confirmation and emergency contact purposes.
        </p>
      </div>
    </div>
  );
}