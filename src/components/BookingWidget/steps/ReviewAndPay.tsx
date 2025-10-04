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
import { Calendar, Users, MapPin, CreditCard, CheckCircle, AlertCircle, Loader2, ShoppingBag } from 'lucide-react';
import { BookingState, PricingBreakdown } from '../types';
import { PaymentMethodSelector } from '../components/PaymentMethodSelector';
import { BankWireInstructions } from '../components/BankWireInstructions';
import { wpFetch } from '../lib/wpApi';

interface ReviewAndPayProps {
  state: BookingState;
  actions: {
    updatePricing: (pricing: PricingBreakdown) => void;
    setPaymentMethod: (method: 'card_stripe' | 'bank_wire') => void;
  };
  onComplete: (bookingData?: any) => void;
}

export function ReviewAndPay({ state, actions, onComplete }: ReviewAndPayProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PricingBreakdown>(state.pricing);

  // Calculate pricing from established base price and current add-ons
  useEffect(() => {
    const basePrice = state.pricing.basePrice || 0;
    const addOnsSubtotal = state.selectedAddOns.reduce((total, addOn) => total + addOn.price * addOn.quantity, 0);
    const roomUpgrade = state.pricing.roomUpgrade || 0;
    const subtotal = basePrice + addOnsSubtotal + roomUpgrade;
    const taxes = Math.round(subtotal * 0.1);
    const fees = Math.round(subtotal * 0.05);
    const total = subtotal + taxes + fees;

    const newPricing: PricingBreakdown = {
      basePrice,
      addOnsSubtotal,
      roomUpgrade,
      taxes,
      fees,
      total,
      currency: 'EUR',
    };

    setPricing(newPricing);
    actions.updatePricing(newPricing);
  }, [state.pricing.basePrice, state.pricing.roomUpgrade, state.selectedAddOns]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const participants = state.guestDetails.map(g => ({
        name: `${g.firstName} ${g.lastName}`.trim(),
        email: g.email,
        phone: g.phone,
      }));

      let endpoint = '';
      let payload: any = {};

      if (state.experienceType === 'room' && state.dates.checkIn && state.dates.checkOut && state.selectedOption) {
        endpoint = '/wordpress/room-bookings';
        payload = {
          room_id: state.selectedOption,
          start_date: state.dates.checkIn.toISOString().split('T')[0],
          end_date: state.dates.checkOut.toISOString().split('T')[0],
          participants,
          add_ons: state.selectedAddOns.map(a => ({ id: a.id, quantity: a.quantity, price: a.price })),
          pricing: pricing,
          guests: state.guests,
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          widget_version: 'wp-widget-test'
        };
      } else if (state.experienceType === 'surf-week' && state.selectedOption) {
        endpoint = '/wordpress/bookings';
        payload = {
          camp_id: state.selectedOption,
          participants,
          pricing: pricing,
          source_url: typeof window !== 'undefined' ? window.location.href : undefined,
          widget_version: 'wp-widget-test'
        };
      } else {
        throw new Error('Missing required booking information');
      }

      console.log('🔑 Booking submission:', {
        endpoint,
        payload: { ...payload, participants: payload.participants?.length || 0 }
      });

      const res = await wpFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      console.log('✅ Booking created successfully:', {
        bookingId: data.data?.booking?.id,
        paymentLink: data.data?.payment?.payment_link,
        paymentMethod: state.paymentMethod
      });

      // Handle payment flow based on method
      if (state.paymentMethod === 'card_stripe' && data.data?.payment?.payment_link) {
        // Redirect to Stripe checkout
        window.location.href = data.data.payment.payment_link;
      } else {
        // For bank wire or if no payment link, show success with booking data
        onComplete(data.data);
      }
    } catch (error: any) {
      setPaymentError(error?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900" data-testid="review-pay-title">Review & Pay</h3>
        <p className="text-gray-600">Confirm your booking details and complete payment</p>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4" data-testid="booking-summary-title">Booking Summary</h4>
        
        <div className="space-y-4">
          {/* Experience Type */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {state.experienceType === 'room' ? '🏠' : '🏄‍♂️'}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {state.experienceType === 'room' ? 'Room Booking' : 'Surf Week Package'}
              </div>
              <div className="text-sm text-gray-600">
                {state.experienceType === 'room' ? 'Ocean View Private Room' : 'Beginner Surf Week - Costa Rica'}
              </div>
            </div>
          </div>

          {/* Dates */}
          {state.dates.checkIn && state.dates.checkOut && (
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Dates</div>
                <div className="text-sm text-gray-600">
                  {formatDate(state.dates.checkIn)} - {formatDate(state.dates.checkOut)}
                  {state.experienceType === 'room' && (
                    <span className="ml-2">
                      ({Math.ceil((state.dates.checkOut.getTime() - state.dates.checkIn.getTime()) / (1000 * 60 * 60 * 24))} nights)
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Guests */}
          <div className="flex items-center gap-3">
            <Users size={20} className="text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">Guests</div>
              <div className="text-sm text-gray-600">
                {state.guests} {state.guests === 1 ? 'guest' : 'guests'}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-gray-400" />
            <div>
              <div className="font-medium text-gray-900">Location</div>
              <div className="text-sm text-gray-600">
                {state.experienceType === 'room' ? 'Heiwa House, Costa Rica' : 'Nosara Beach, Costa Rica'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Details Summary */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200" data-testid="guest-completion-status">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Guest Information</h4>
        
        <div className="space-y-3">
          {state.guestDetails.map((guest, index) => (
            <div key={guest.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div>
                <div className="font-medium text-gray-900">
                  {guest.firstName} {guest.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {guest.email} • {guest.phone}
                </div>
                {guest.dietaryRequirements && (
                  <div className="text-xs text-orange-600 mt-1">
                    Dietary: {guest.dietaryRequirements}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Complete</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add-ons Summary */}
      {state.selectedAddOns.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-gray-600" />
            Selected Add-ons
          </h4>

          <div className="space-y-3">
            {state.selectedAddOns.map((addOn) => (
              <div key={addOn.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div>
                  <div className="font-medium text-gray-900">{addOn.name}</div>
                  <div className="text-sm text-gray-600">
                    {formatPrice(addOn.price)} × {addOn.quantity}
                  </div>
                </div>
                <div className="font-medium text-gray-900">
                  {formatPrice(addOn.price * addOn.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <h4 className="text-lg font-semibold text-orange-900 mb-4" data-testid="pricing-breakdown-title">Pricing Breakdown</h4>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Base Price</span>
            <span className="font-medium">{formatPrice(pricing.basePrice)}</span>
          </div>
          {pricing.roomUpgrade && pricing.roomUpgrade > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Room Upgrade</span>
              <span className="font-medium">{formatPrice(pricing.roomUpgrade)}</span>
            </div>
          )}
          {pricing.addOnsSubtotal > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Add-ons</span>
              <span className="font-medium">{formatPrice(pricing.addOnsSubtotal)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Taxes (10%)</span>
            <span className="font-medium">{formatPrice(pricing.taxes)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Service Fee (5%)</span>
            <span className="font-medium">{formatPrice(pricing.fees)}</span>
          </div>
          <div className="border-t border-orange-300 pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-orange-900">Total</span>
              <span className="text-2xl font-bold text-orange-600">{formatPrice(pricing.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Error */}
      {paymentError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={16} />
          <span className="text-sm">{paymentError}</span>
        </div>
      )}

      {/* Terms and Conditions */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            required
          />
          <label htmlFor="terms" className="text-sm text-gray-700">
            I agree to the{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 underline">
              Terms and Conditions
            </a>{' '}
            and{' '}
            <a href="#" className="text-orange-600 hover:text-orange-700 underline">
              Privacy Policy
            </a>
            . I understand that this booking is subject to our cancellation policy.
          </label>
        </div>
      </div>

      {/* Payment Method Selection */}
      <PaymentMethodSelector
        selectedMethod={state.paymentMethod}
        onMethodChange={actions.setPaymentMethod}
      />

      {/* Bank Wire Instructions */}
      {state.paymentMethod === 'bank_wire' && (
        <BankWireInstructions
          totalAmount={pricing.total}
          currency={pricing.currency}
          bookingReference={`HW-${Date.now().toString().slice(-6)}`}
        />
      )}

      {/* Payment Button */}
      {state.paymentMethod && (
        <div className="space-y-4">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="
              w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600
              hover:from-orange-600 hover:to-orange-700
              disabled:from-gray-300 disabled:to-gray-400
              text-white font-semibold text-lg rounded-lg
              shadow-lg hover:shadow-xl
              transition-all duration-300 ease-out
              hover:scale-[1.02] disabled:hover:scale-100
              focus:outline-none focus:ring-4 focus:ring-orange-500/30
              disabled:cursor-not-allowed
              flex items-center justify-center gap-3
            "
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : state.paymentMethod === 'card_stripe' ? (
              <>
                <CreditCard size={20} />
                Pay {formatPrice(pricing.total)} Now
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirm Booking - Pay Later
              </>
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              {state.paymentMethod === 'card_stripe'
                ? 'Secure payment powered by Stripe • Your payment information is encrypted and secure'
                : 'Your booking will be confirmed. Complete the bank transfer to secure your reservation.'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}