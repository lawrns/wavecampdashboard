# Data Model: Web Component Shadow DOM Booking Widget

## Overview
The Web Component widget integrates with existing booking entities while adding WordPress-specific configuration. All core booking data flows through the existing Firebase/Firestore models.

## Core Entities

### Booking Entity
```typescript
interface Booking {
  id: string;
  campId: string;
  guestCount: number;
  checkInDate: Date;
  checkOutDate: Date;
  selectedExperiences: Experience[];
  totalAmount: number;
  currency: 'USD' | 'EUR';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentMethod: 'stripe' | 'bank_transfer';
  stripePaymentIntentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Validation Rules**:
- guestCount: 1-10 (configurable per camp)
- checkInDate: Must be in future, minimum 1 day advance
- checkOutDate: Must be after checkInDate, minimum 1 night
- totalAmount: Calculated from camp pricing + experiences

### Guest Entity
```typescript
interface Guest {
  id: string;
  bookingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  specialRequirements?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}
```

**Validation Rules**:
- email: Valid email format required
- phone: Optional but validated format if provided
- firstName/lastName: Required, 2-50 characters
- dateOfBirth: Must be 18+ for primary guest

### SurfCamp Entity (Reference)
```typescript
interface SurfCamp {
  id: string;
  name: string;
  location: string;
  description: string;
  maxGuests: number;
  basePricePerNight: number;
  currency: 'USD' | 'EUR';
  availableExperiences: Experience[];
  amenities: string[];
  images: string[];
  policies: {
    cancellation: string;
    checkInTime: string;
    checkOutTime: string;
  };
}
```

### RoomAssignment Entity
```typescript
interface RoomAssignment {
  id: string;
  bookingId: string;
  guestId: string;
  roomType: 'private' | 'shared' | 'dorm';
  roomNumber?: string;
  bedPosition?: string;
}
```

## WordPress Integration Entities

### Widget Configuration
```typescript
interface WordPressWidgetConfig {
  apiEndpoint: string;
  apiKey: string;
  pluginUrl: string;
  position: 'right' | 'left' | 'center';
  primaryColor: string;
  triggerText: string;
  maxGuests: number;
  supportedCurrencies: string[];
  locale: 'en' | 'es';
}
```

**Source**: wp_localize_script() in WordPress plugin
**Storage**: Window.heiwaWidgetConfig global object

### Shortcode Attributes
```typescript
interface ShortcodeAttributes {
  position?: 'right' | 'left' | 'center';
  trigger_text?: string;
  primary_color?: string;
  max_guests?: number;
  id?: string;
}
```

**Validation**: Sanitized and escaped by WordPress
**Default Values**: Fall back to window.heiwaWidgetConfig.settings

## Data Flow Patterns

### Booking Creation Flow
1. **Widget Initialization**: Read window.heiwaWidgetConfig for API access
2. **Guest Collection**: Validate and store guest data locally (state)
3. **Experience Selection**: Display available options from API
4. **Room Assignment**: Auto-assign based on guest count and availability
5. **Payment Processing**:
   - Stripe: Create PaymentIntent via API
   - Bank Transfer: Generate payment instructions
6. **Booking Submission**: POST to /api/bookings with X-Heiwa-API-Key header

### API Communication
```typescript
// Existing wpApi.ts patterns maintained
interface ApiRequest {
  headers: {
    'X-Heiwa-API-Key': string;
    'Content-Type': 'application/json';
  };
  body: BookingRequest;
}

// CORS enabled on Next.js API endpoints
// No changes required for Web Component context
```

## State Management

### Widget State
```typescript
interface WidgetState {
  currentStep: 'experience' | 'guests' | 'rooms' | 'review' | 'payment';
  bookingData: Partial<Booking>;
  guests: Guest[];
  selectedExperiences: Experience[];
  paymentMethod: 'stripe' | 'bank_transfer';
  isLoading: boolean;
  errors: Record<string, string>;
}
```

### Persistence Strategy
- **Session Storage**: Booking progress during flow
- **Local Storage**: User preferences (optional)
- **Server**: Final booking data in Firestore via API

## Validation Rules

### Cross-Entity Validation
- **Guest Count**: Must match camp capacity and room assignments
- **Date Availability**: Check against existing bookings via API
- **Payment Amount**: Must match calculated total from pricing rules
- **Experience Compatibility**: Validate selected experiences against camp offerings

### Business Rules
- **Cancellation Policy**: Enforced at booking time
- **Minimum Stay**: Configurable per camp (1-7 nights)
- **Advance Booking**: Minimum 24 hours, maximum 12 months
- **Guest Age Requirements**: Primary guest must be 18+

## Error Handling

### API Error Responses
```typescript
interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

// Common error codes:
// - INVALID_DATES: Date range validation failed
// - UNAVAILABLE: No rooms available for dates
// - PAYMENT_FAILED: Stripe payment processing error
// - VALIDATION_ERROR: Guest data validation failed
```

### Widget Error States
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: Field-level error display
- **Payment Errors**: Clear messaging for retry/cancellation
- **Timeout Errors**: Graceful degradation with offline messaging

## Performance Considerations

### Data Fetching Strategy
- **Lazy Loading**: Camp data loaded on demand
- **Caching**: Availability data cached for session
- **Optimistic Updates**: UI updates before API confirmation
- **Background Sync**: Non-critical data loaded in background

### Bundle Size Optimization
- **Code Splitting**: Separate payment method chunks
- **Tree Shaking**: Remove unused React features
- **Asset Optimization**: Compress images and CSS
- **Caching Strategy**: Long-term caching for static assets



