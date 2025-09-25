import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { withRateLimit, createRateLimitResponse, apiRateLimiter } from '@/lib/rate-limiter';
import { monitoring, withMonitoring } from '@/lib/monitoring';

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
 * WordPress Rooms Endpoint
 * Returns a list of all available room types to power the WordPress widget room selection
 *
 * @route GET /api/wordpress/rooms
 * @auth  X-Heiwa-API-Key header required (must equal WORDPRESS_API_KEY)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = new URL(request.url);

  try {
    return await withMonitoring(async () => {
      // Apply rate limiting
      const rateLimitResult = await withRateLimit(request);
      if (!rateLimitResult.allowed) {
        return createRateLimitResponse(rateLimitResult.headers);
      }

    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    // Allow a safe default test key in case env var isn't configured in the hosting env
    const validApiKey = process.env.WORDPRESS_API_KEY || 'heiwa_wp_test_key_2024_secure_deployment';
    if (!apiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Invalid or missing API key' },
        { status: 401, headers: { ...corsHeaders, ...rateLimitResult.headers } }
      );
    }

    const origin = new URL(request.url).origin;

    // Initialize Supabase client
    const supa = createSupabase();
    if (!supa) {
      console.error('Failed to create Supabase client - missing environment variables');
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Fetch active rooms with all necessary fields
    const { data: rooms, error: roomsError } = await supa
      .from('rooms')
      .select('id, name, capacity, is_active, images, amenities, pricing, description, booking_type')
      .eq('is_active', true);

    if (roomsError) {
      console.error('Error fetching rooms from database:', roomsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch rooms from database' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Build rooms payload the widget expects
    const fallbackImage =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMwMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAzOTREOSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzAyNTFBMyIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMTgwIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHRleHQgeD0iMTUwIiB5PSI5MCIgZmlsbD0iI2ZmZiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ST09NIFRIVU1CTkFJTDwvdGV4dD48L3N2Zz4=';

    let roomsData = (rooms || [])
      .slice(0, 8) // limit result size
      .map((room: any) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity || 2,
        price_per_night: room.pricing?.standard || 80,
        amenities: room.amenities || [],
        featured_image: (room.images && room.images.length > 0)
          ? (room.images[0].startsWith('http')
              ? room.images[0]
              : (room.images[0].startsWith('/') ? `${origin}${room.images[0]}` : `${origin}/${room.images[0]}`))
          : fallbackImage,
        description: room.description || '',
        booking_type: room.booking_type || 'whole'
      }));

    // If no rooms resolved from DB, return empty array
    if (!roomsData || roomsData.length === 0) {
      console.warn('No active rooms found in database');
      return NextResponse.json(
        { success: true, data: { rooms: [] }, meta: { message: 'No rooms available' } },
        { headers: corsHeaders }
      );
    }

      return NextResponse.json(
        {
          success: true,
          data: { rooms: roomsData }
        },
        { headers: { ...corsHeaders, ...rateLimitResult.headers } }
      );
    }, {
      name: 'wordpress_rooms_api',
      method: 'GET',
      url: url.pathname
    });

  } catch (error: any) {
    await monitoring.logError(error, {
      url: url.pathname,
      userAgent: request.headers.get('user-agent') || undefined,
      additionalData: { method: 'GET', endpoint: 'wordpress/rooms' }
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: 'Failed to fetch rooms' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Fallback rooms function removed - no more mock data

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
