import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CORS headers for WordPress integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Heiwa-API-Key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null as any;
  return createClient(url, key);
}

/**
 * WordPress Date Availability Endpoint
 * Returns availability status for each date in a given range
 * Used to show sold-out dates in date pickers
 * 
 * @route GET /api/wordpress/dates/availability
 * @auth X-Heiwa-API-Key header required
 * @query start_date - Required: Start date for range (YYYY-MM-DD)
 * @query end_date - Required: End date for range (YYYY-MM-DD)
 * @query participants - Optional: Number of participants (default: 1)
 * @returns {Object} Date-by-date availability status
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY || 'heiwa_wp_test_key_2024_secure_deployment';

    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Valid API key required' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const participants = parseInt(searchParams.get('participants') || '1');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters', message: 'start_date and end_date are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate date format and range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json(
        { success: false, error: 'Invalid date range', message: 'Provide valid dates with end_date after start_date' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createSupabase();
    if (!supabase) {
      // Return fallback data when Supabase is unavailable
      const dateAvailability = generateFallbackDateAvailability(start, end);
      return NextResponse.json(
        { 
          success: true, 
          data: { date_availability: dateAvailability },
          meta: { fallback: true, message: 'Using fallback data - Supabase unavailable' }
        },
        { headers: corsHeaders }
      );
    }

    // Get all active rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, capacity, is_active')
      .eq('is_active', true);

    if (roomsError || !rooms) {
      const dateAvailability = generateFallbackDateAvailability(start, end);
      return NextResponse.json(
        { 
          success: true, 
          data: { date_availability: dateAvailability },
          meta: { fallback: true, message: 'Room data unavailable' }
        },
        { headers: corsHeaders }
      );
    }

    // Calculate total capacity
    const totalCapacity = rooms.reduce((sum, room) => sum + (room.capacity || 0), 0);

    // Generate date range
    const dateAvailability: Array<{
      date: string;
      available: boolean;
      capacity: number;
      booked: number;
      remaining: number;
    }> = [];

    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check assignments for this specific date
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      const { data: assignments } = await supabase
        .from('room_assignments')
        .select('room_id, bed_number')
        .lte('check_in_date', dateStr)
        .gte('check_out_date', nextDateStr);

      const bookedBeds = assignments?.length || 0;
      const remaining = Math.max(0, totalCapacity - bookedBeds);
      const available = remaining >= participants;

      dateAvailability.push({
        date: dateStr,
        available,
        capacity: totalCapacity,
        booked: bookedBeds,
        remaining
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: {
        date_availability: dateAvailability,
        summary: {
          total_dates_checked: dateAvailability.length,
          available_dates: dateAvailability.filter(d => d.available).length,
          sold_out_dates: dateAvailability.filter(d => !d.available).length,
          total_capacity: totalCapacity,
          participants_requested: participants
        }
      },
      meta: {
        checked_at: new Date().toISOString(),
        cache_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Date availability error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to check date availability' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Generate fallback date availability data for testing
 */
function generateFallbackDateAvailability(start: Date, end: Date) {
  const dateAvailability = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();
    
    // Simulate some sold-out dates (weekends are more likely to be sold out)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const randomFactor = Math.random();
    const available = isWeekend ? randomFactor > 0.3 : randomFactor > 0.1;
    
    dateAvailability.push({
      date: dateStr,
      available,
      capacity: 10, // Fallback total capacity
      booked: available ? Math.floor(Math.random() * 5) : 10,
      remaining: available ? Math.floor(Math.random() * 5) + 1 : 0
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateAvailability;
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
