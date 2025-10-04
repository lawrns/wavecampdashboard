import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// CORS headers for WordPress integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Heiwa-API-Key',
  'Access-Control-Max-Age': '86400',
};

// Temporarily use service role for testing WordPress widget
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * WordPress API Availability Endpoint
 * Checks real-time availability for surf camps and rooms
 * 
 * @route GET /api/wordpress/availability
 * @auth X-Heiwa-API-Key header required
 * @query camp_id - Required: Surf camp ID to check
 * @query start_date - Required: Check-in date (ISO format)
 * @query end_date - Required: Check-out date (ISO format) 
 * @query participants - Optional: Number of participants (default: 1)
 * @returns {Object} Availability status and pricing information
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY;
    
    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing API key'
        },
        {
          status: 401,
          headers: corsHeaders
        }
      );
    }

    // Get and validate query parameters
    const { searchParams } = new URL(request.url);
    const campId = searchParams.get('camp_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const participants = parseInt(searchParams.get('participants') || '1');

    if (!campId || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
          message: 'camp_id, start_date, and end_date are required'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate date format and logic
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format',
          message: 'Dates must be in valid ISO format'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    if (startDateObj >= endDateObj) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date range',
          message: 'End date must be after start date'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get surf camp details
    const { data: camp, error: campError } = await supabase
      .from('surf_camps')
      .select(`
        id,
        name,
        start_date,
        end_date,
        max_participants,
        price,
        level,
        is_active
      `)
      .eq('id', campId)
      .eq('is_active', true)
      .single();

    if (campError || !camp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Camp not found',
          message: 'The requested surf camp was not found or is not active'
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Check if requested dates fall within camp dates
    const campStart = new Date(camp.start_date);
    const campEnd = new Date(camp.end_date);
    
    const isWithinCampDates = startDateObj >= campStart && endDateObj <= campEnd;
    
    if (!isWithinCampDates) {
      return NextResponse.json({
        success: true,
        available: false,
        data: {
          camp_id: campId,
          camp_name: camp.name,
          requested_dates: { start_date: startDate, end_date: endDate },
          camp_dates: { start_date: camp.start_date, end_date: camp.end_date },
          reason: 'Requested dates are outside camp duration',
          alternative_dates: {
            camp_start: camp.start_date,
            camp_end: camp.end_date
          }
        }
      }, {
        headers: corsHeaders
      });
    }

    // Check current bookings for this camp to calculate available spots
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        items,
        payment_status
      `)
      .contains('items', [{ type: 'surfCamp', itemId: campId }])
      .in('payment_status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Error checking existing bookings:', bookingsError);
      // Continue with availability check but log the error
    }

    // Calculate booked participants for this camp
    let bookedParticipants = 0;
    if (existingBookings) {
      existingBookings.forEach(booking => {
        const items = Array.isArray(booking.items) ? booking.items : [];
        items.forEach((item: any) => {
          if (item.type === 'surfCamp' && item.itemId === campId) {
            bookedParticipants += item.quantity || 1;
          }
        });
      });
    }

    const availableSpots = camp.max_participants - bookedParticipants;
    const canAccommodate = availableSpots >= participants;

    // Calculate pricing
    const nightsCount = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = parseFloat(camp.price.toString());
    const totalPrice = basePrice * participants;

    // Check room availability (simplified - would need more complex logic for actual room assignments)
    const roomAvailability = await checkRoomAvailability(startDate, endDate, participants);

    return NextResponse.json({
      success: true,
      available: canAccommodate && roomAvailability.available,
      data: {
        camp_info: {
          id: camp.id,
          name: camp.name,
          level: camp.level,
          dates: {
            start: camp.start_date,
            end: camp.end_date
          }
        },
        availability: {
          total_capacity: camp.max_participants,
          booked_participants: bookedParticipants,
          available_spots: availableSpots,
          requested_participants: participants,
          can_accommodate: canAccommodate
        },
        accommodation: {
          rooms_available: roomAvailability.available,
          available_room_types: roomAvailability.room_types
        },
        pricing: {
          base_price_per_person: basePrice,
          participants: participants,
          nights: nightsCount,
          subtotal: totalPrice,
          taxes_estimated: totalPrice * 0.1, // 10% estimated tax
          total_estimated: totalPrice * 1.1,
          currency: 'EUR'
        },
        booking_window: {
          earliest_booking: new Date().toISOString(),
          latest_booking: calculateBookingDeadline(camp.start_date),
          is_within_booking_window: isWithinBookingWindow(camp.start_date)
        }
      },
      meta: {
        checked_at: new Date().toISOString(),
        cache_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('WordPress availability endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to check availability'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * Check room availability for given dates and participants
 * Simplified version - in production would need more complex room assignment logic
 */
async function checkRoomAvailability(
  startDate: string, 
  endDate: string, 
  participants: number
): Promise<{ available: boolean; room_types: string[] }> {
  try {
    // Get all active rooms
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('id, name, capacity, booking_type, is_active')
      .eq('is_active', true);

    if (error || !rooms) {
      return { available: false, room_types: [] };
    }

    // Check room assignments for the requested period
    const { data: assignments, error: assignmentsError } = await supabase
      .from('room_assignments')
      .select('room_id, bed_number')
      .or(`and(check_in_date.lte.${endDate},check_out_date.gte.${startDate})`);

    if (assignmentsError) {
      console.error('Error checking room assignments:', assignmentsError);
      return { available: false, room_types: [] };
    }

    // Calculate available capacity
    const occupiedBeds = new Map<string, number>();
    assignments?.forEach(assignment => {
      const current = occupiedBeds.get(assignment.room_id) || 0;
      occupiedBeds.set(assignment.room_id, current + 1);
    });

    let totalAvailableCapacity = 0;
    const availableRoomTypes: string[] = [];

    rooms.forEach(room => {
      const occupied = occupiedBeds.get(room.id) || 0;
      const available = room.capacity - occupied;
      
      if (available > 0) {
        totalAvailableCapacity += available;
        availableRoomTypes.push(room.name);
      }
    });

    return {
      available: totalAvailableCapacity >= participants,
      room_types: availableRoomTypes
    };

  } catch (error) {
    console.error('Error checking room availability:', error);
    return { available: false, room_types: [] };
  }
}

/**
 * Calculate booking deadline (7 days before camp start)
 */
function calculateBookingDeadline(startDate: string): string {
  const start = new Date(startDate);
  const deadline = new Date(start.getTime() - (7 * 24 * 60 * 60 * 1000));
  return deadline.toISOString();
}

/**
 * Check if current date is within booking window
 */
function isWithinBookingWindow(startDate: string): boolean {
  const now = new Date();
  const deadline = new Date(calculateBookingDeadline(startDate));
  return now <= deadline;
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
