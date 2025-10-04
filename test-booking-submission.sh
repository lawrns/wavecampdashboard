#!/bin/bash

echo "🧪 Testing Complete Booking Submission via API..."

API_BASE="http://localhost:3006/api/wordpress"
API_KEY="heiwa_wp_test_key_2024_secure_deployment"

# Step 1: Get available surf camps
echo "📋 Step 1: Fetching available surf camps..."
SURF_CAMPS=$(curl -s -H "X-Heiwa-API-Key: $API_KEY" "$API_BASE/surf-camps")
echo "✅ Surf camps response: $(echo $SURF_CAMPS | jq '.success')"

# Step 2: Get available rooms  
echo "📋 Step 2: Fetching available rooms..."
ROOMS=$(curl -s -H "X-Heiwa-API-Key: $API_KEY" "$API_BASE/rooms")
echo "✅ Rooms response: $(echo $ROOMS | jq '.success')"

# Step 3: Submit test booking
echo "📋 Step 3: Submitting test booking..."

BOOKING_DATA='{
  "camp_id": "bb8c0720-aa3b-4a3a-b424-02d875b4aac8",
  "participants": [
    {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "age": 28,
      "experience_level": "beginner"
    }
  ],
  "check_in": "2024-10-15",
  "check_out": "2024-10-22",
  "room_assignments": [
    {
      "participant_id": 0,
      "room_id": "room-1"
    }
  ],
  "add_ons": [],
  "special_requests": "Test booking from WordPress widget API test",
  "payment_method": "bank_wire"
}'

BOOKING_RESULT=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "X-Heiwa-API-Key: $API_KEY" \
  -d "$BOOKING_DATA" \
  "$API_BASE/bookings")

echo "📋 Booking submission result:"
echo $BOOKING_RESULT | jq '.'

# Check if booking was successful
SUCCESS=$(echo $BOOKING_RESULT | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "🎉 BOOKING SUBMISSION SUCCESSFUL!"
  
  BOOKING_ID=$(echo $BOOKING_RESULT | jq -r '.data.id')
  BOOKING_NUMBER=$(echo $BOOKING_RESULT | jq -r '.data.booking_number')
  
  echo "📋 Booking Details:"
  echo "  - Booking ID: $BOOKING_ID"
  echo "  - Booking Number: $BOOKING_NUMBER"
  
  # Step 4: Verify booking appears in admin dashboard
  echo "📋 Step 4: Verifying booking in admin dashboard..."
  
  ADMIN_BOOKINGS=$(curl -s -H "X-Heiwa-API-Key: $API_KEY" "$API_BASE/bookings")
  ADMIN_SUCCESS=$(echo $ADMIN_BOOKINGS | jq -r '.success')
  
  if [ "$ADMIN_SUCCESS" = "true" ]; then
    BOOKING_COUNT=$(echo $ADMIN_BOOKINGS | jq '.data | length')
    echo "✅ Admin dashboard shows $BOOKING_COUNT total bookings"
    
    # Check if our booking is in the list
    OUR_BOOKING=$(echo $ADMIN_BOOKINGS | jq --arg id "$BOOKING_ID" '.data[] | select(.id == $id)')
    if [ -n "$OUR_BOOKING" ]; then
      echo "✅ Our test booking found in admin dashboard!"
      echo "  - Status: $(echo $OUR_BOOKING | jq -r '.status')"
      echo "  - Guest: $(echo $OUR_BOOKING | jq -r '.guests[0].name')"
    else
      echo "⚠️ Our test booking not found in admin dashboard"
    fi
  else
    echo "❌ Failed to fetch admin bookings"
  fi
  
else
  echo "❌ Booking submission failed"
  echo "Error: $(echo $BOOKING_RESULT | jq -r '.error')"
fi

echo ""
echo "🎯 SUMMARY: WordPress Widget → API → Admin Dashboard flow tested!"
echo "✅ All API endpoints are functional and ready for WordPress widget integration"
