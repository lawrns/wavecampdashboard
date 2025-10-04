const fetch = require('node-fetch');

async function testAPIBookingSubmission() {
  console.log('🧪 Testing API Booking Submission...');
  
  const API_BASE = 'http://localhost:3006/api/wordpress';
  const API_KEY = 'heiwa_wp_test_key_2024_secure_deployment';
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Heiwa-API-Key': API_KEY
  };
  
  try {
    // Step 1: Get available surf camps
    console.log('📋 Step 1: Fetching available surf camps...');
    const surfCampsResponse = await fetch(`${API_BASE}/surf-camps`, { headers });
    const surfCamps = await surfCampsResponse.json();
    
    if (!surfCamps.success) {
      throw new Error('Failed to fetch surf camps');
    }
    
    console.log('✅ Available surf camps:', surfCamps.data.length);
    
    // Step 2: Get available rooms
    console.log('📋 Step 2: Fetching available rooms...');
    const roomsResponse = await fetch(`${API_BASE}/rooms`, { headers });
    const rooms = await roomsResponse.json();
    
    if (!rooms.success) {
      throw new Error('Failed to fetch rooms');
    }
    
    console.log('✅ Available rooms:', rooms.data.length);
    
    // Step 3: Submit a test booking
    console.log('📋 Step 3: Submitting test booking...');
    
    const testBooking = {
      experience_type: 'surf_week',
      surf_camp_id: surfCamps.data[0]?.id || 'test-camp-1',
      check_in: '2024-10-15',
      check_out: '2024-10-22',
      guests: [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          age: 28,
          experience_level: 'beginner'
        }
      ],
      room_assignments: [
        {
          guest_id: 0,
          room_id: rooms.data[0]?.id || 'room-1'
        }
      ],
      add_ons: [],
      special_requests: 'Test booking from WordPress widget',
      payment_method: 'bank_wire',
      total_amount: 850.00,
      currency: 'EUR'
    };
    
    const bookingResponse = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testBooking)
    });
    
    const bookingResult = await bookingResponse.json();
    
    if (bookingResult.success) {
      console.log('🎉 BOOKING SUBMISSION SUCCESSFUL!');
      console.log('📋 Booking Details:');
      console.log('  - Booking ID:', bookingResult.data.id);
      console.log('  - Booking Number:', bookingResult.data.booking_number);
      console.log('  - Status:', bookingResult.data.status);
      console.log('  - Total Amount:', bookingResult.data.total_amount, bookingResult.data.currency);
      console.log('  - Guest:', bookingResult.data.guests[0]?.name);
      
      // Step 4: Verify booking appears in admin dashboard
      console.log('📋 Step 4: Verifying booking in admin dashboard...');
      
      const adminBookingsResponse = await fetch(`${API_BASE}/bookings`, { headers });
      const adminBookings = await adminBookingsResponse.json();
      
      if (adminBookings.success) {
        const ourBooking = adminBookings.data.find(b => b.id === bookingResult.data.id);
        if (ourBooking) {
          console.log('✅ Booking found in admin dashboard!');
          console.log('  - Admin view shows:', ourBooking.booking_number);
        } else {
          console.log('⚠️ Booking not found in admin dashboard');
        }
      }
      
    } else {
      console.log('❌ Booking submission failed:', bookingResult.error);
      console.log('📋 Response:', JSON.stringify(bookingResult, null, 2));
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPIBookingSubmission().catch(console.error);
