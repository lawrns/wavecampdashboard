# Quickstart Test: Web Component Booking Widget

## Overview
This quickstart validates the complete Web Component booking flow in a WordPress environment. The test simulates a real user booking a 2-guest surf camp experience with Stripe payment.

## Prerequisites
- WordPress instance running locally (wordpress-server/)
- Next.js admin API running on port 3005
- Web Component bundle built and deployed to WordPress plugin
- Test Stripe account configured (test mode)

## Test Scenario: Complete Booking Flow

### Test Setup
1. **WordPress Page Creation**
   ```php
   // Create test page with shortcode
   $post_content = '[heiwa_booking position="right" trigger_text="Book Your Surf Trip"]';
   wp_insert_post([
     'post_title' => 'Surf Camp Booking Test',
     'post_content' => $post_content,
     'post_status' => 'publish'
   ]);
   ```

2. **API Configuration**
   ```javascript
   // Verify WordPress config
   window.heiwaWidgetConfig = {
     settings: {
       apiEndpoint: 'http://localhost:3005/api',
       apiKey: 'heiwa_wp_test_key_2024_secure_deployment',
       position: 'right',
       primaryColor: '#f97316',
       triggerText: 'Book Your Surf Trip'
     },
     pluginUrl: 'http://localhost/wordpress/wp-content/plugins/heiwa-booking-widget/'
   };
   ```

### Test Steps

#### Step 1: Widget Loading & Initialization
**Expected Result**: Widget loads in < 100ms with "Book Your Surf Trip" button visible

```gherkin
Given a WordPress page with [heiwa_booking] shortcode
When the page loads
Then the widget should render a styled button
And CSS should be isolated (no WordPress theme interference)
And console should show no React mounting errors
```

**Validation Checks**:
- [ ] Button visible with correct text and styling
- [ ] Shadow DOM created (inspect element shows #shadow-root)
- [ ] CSS links loaded in shadow root
- [ ] Network tab shows < 120KB bundle size

#### Step 2: Booking Modal Opening
**Expected Result**: Modal opens with experience selection step

```gherkin
Given the widget is loaded
When user clicks "Book Your Surf Trip" button
Then booking modal should open
And experience selection should be displayed
And modal backdrop should blur WordPress content
```

**Validation Checks**:
- [ ] Modal opens smoothly (no layout shift)
- [ ] Focus trapped within modal
- [ ] ESC key closes modal
- [ ] Backdrop blur applied correctly

#### Step 3: Experience Selection
**Expected Result**: User can select surf camp and dates

```gherkin
Given booking modal is open
When user selects camp, dates, and experiences
Then availability should be checked via API
And pricing should update dynamically
And validation errors should display for invalid selections
```

**Test Data**:
```json
{
  "campId": "test-camp-001",
  "checkInDate": "2024-12-01",
  "checkOutDate": "2024-12-05",
  "guestCount": 2,
  "selectedExperiences": ["surf-lesson-basic", "yoga-session"]
}
```

**Validation Checks**:
- [ ] API call to `/camps/{id}/availability` succeeds
- [ ] Loading states displayed during API calls
- [ ] Error handling for network failures
- [ ] Date picker works correctly

#### Step 4: Guest Information Collection
**Expected Result**: Form validates guest details correctly

```gherkin
Given dates and experiences selected
When user enters guest information
Then form validation should work
And primary guest must be 18+
And email format should be validated
And progress indicator shows current step
```

**Test Data**:
```json
{
  "guests": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-0123",
      "dateOfBirth": "1990-01-15",
      "nationality": "US",
      "specialRequirements": "Vegetarian meals preferred"
    },
    {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@example.com",
      "phone": "+1-555-0124",
      "dateOfBirth": "1992-03-20"
    }
  ]
}
```

**Validation Checks**:
- [ ] Required fields validated
- [ ] Email format checking
- [ ] Phone number format validation
- [ ] Age validation for primary guest
- [ ] Progress indicator updates correctly

#### Step 5: Room Assignment
**Expected Result**: Rooms assigned automatically or manually

```gherkin
Given guest information is complete
When room assignment step loads
Then rooms should be assigned based on guest count
And user can modify assignments if needed
And pricing reflects room choices
```

**Validation Checks**:
- [ ] Auto-assignment works for standard cases
- [ ] Manual reassignment possible
- [ ] Room availability respected
- [ ] Price updates correctly

#### Step 6: Review & Payment Selection
**Expected Result**: Complete booking summary with payment options

```gherkin
Given all booking details complete
When user reaches review step
Then complete summary should display
And both Stripe and bank transfer options available
And total pricing should be accurate
And cancellation policy shown
```

**Validation Checks**:
- [ ] All booking details displayed correctly
- [ ] Pricing calculation accurate
- [ ] Terms and conditions accessible
- [ ] Payment method selection works

#### Step 7: Stripe Payment Processing
**Expected Result**: Secure payment flow completion

```gherkin
Given user selects Stripe payment
When payment form is submitted
Then Stripe Elements should load securely
And payment should process correctly
And booking should confirm on success
And error handling for declined cards
```

**Test Cards**:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Validation Checks**:
- [ ] Stripe Elements load in shadow DOM
- [ ] Payment processing succeeds
- [ ] Booking confirmation displayed
- [ ] Email confirmation sent

#### Step 8: Bank Transfer Flow
**Expected Result**: Payment instructions provided

```gherkin
Given user selects bank transfer
When booking is submitted
Then payment instructions should display
And booking status should be "pending"
And reference number provided for payment
```

**Validation Checks**:
- [ ] Clear payment instructions shown
- [ ] Booking status correctly set to pending
- [ ] Reference number generated
- [ ] Contact information for payment confirmation

## Success Criteria

### Functional Success
- [ ] Complete booking flow works end-to-end
- [ ] Both payment methods functional
- [ ] API communication successful
- [ ] Visual design matches React app
- [ ] No WordPress theme interference

### Performance Success
- [ ] Initial load < 100ms
- [ ] Bundle size < 120KB gzipped
- [ ] No layout shifts during interactions
- [ ] Smooth animations and transitions

### Compatibility Success
- [ ] Works in target browsers (Chrome, Firefox, Safari, Edge)
- [ ] No console errors or warnings
- [ ] Accessibility standards met
- [ ] Mobile responsive

## Troubleshooting

### Common Issues
1. **Widget not loading**: Check WordPress plugin enqueued correctly
2. **API failures**: Verify CORS headers and API key
3. **Styling issues**: Check shadow DOM CSS injection
4. **Payment errors**: Verify Stripe test configuration

### Debug Commands
```bash
# Check WordPress logs
tail -f wordpress-server/wp-content/debug.log

# Check API logs
tail -f logs/nextjs-api.log

# Inspect shadow DOM
# Open DevTools → Elements → Find heiwa-booking-widget → #shadow-root
```

### Rollback Plan
If issues occur, the WordPress shortcode can be temporarily switched back to the existing UMD implementation while Web Component issues are resolved.



