import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { withRateLimit, createRateLimitResponse } from '@/lib/rate-limiter';

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('WordPress surf-camps API: Environment check', {
    hasUrl: !!url,
    hasKey: !!key,
    urlPrefix: url ? url.substring(0, 20) + '...' : 'missing',
    keyPrefix: key ? key.substring(0, 10) + '...' : 'missing',
    nodeEnv: process.env.NODE_ENV,
    platform: process.env.NETLIFY ? 'netlify' : 'other'
  });

  if (!url || !key) {
    console.error('WordPress surf-camps API: Missing Supabase environment variables', {
      NEXT_PUBLIC_SUPABASE_URL: !!url,
      SUPABASE_SERVICE_ROLE_KEY: !!key,
      nodeEnv: process.env.NODE_ENV,
      platform: process.env.NETLIFY ? 'netlify' : 'other',
      availableEnvVars: Object.keys(process.env).filter(key =>
        key.includes('SUPABASE') || key.includes('WORDPRESS')
      )
    });
    return null as any;
  }
  return createClient(url, key);
}

/**
 * WordPress API Surf Camps Endpoint
 * Returns active surf camps for WordPress booking widget
 *
 * @route GET /api/wordpress/surf-camps
 * @auth X-Heiwa-API-Key header required
 * @query location - Optional filter by location/country
 * @query level - Optional filter by skill level
 * @returns {Object} Array of active surf camps with WordPress-optimized data
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await withRateLimit(request);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.headers);
    }

    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY || 'heiwa_wp_test_key_2024_secure_deployment';

    if (!apiKey || apiKey !== validApiKey) {
      const response = NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing API key'
        },
        { status: 401 }
      );

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Heiwa-API-Key');
      response.headers.set('Access-Control-Allow-Credentials', 'true');

      return response;
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const locationFilter = searchParams.get('location');
    const levelFilter = searchParams.get('level');

    // Build query for active surf camps - no fallback, always use real data
    const client = createSupabase();
    if (!client) {
      console.error('WordPress surf-camps API: Failed to create Supabase client');

      // Provide detailed error information for debugging
      const debugInfo = {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
        platform: process.env.NETLIFY ? 'netlify' : 'other',
        timestamp: new Date().toISOString(),
        availableEnvVars: Object.keys(process.env).filter(key =>
          key.includes('SUPABASE') || key.includes('WORDPRESS')
        ),
        requiredEnvVars: {
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          WORDPRESS_API_KEY: !!process.env.WORDPRESS_API_KEY
        }
      };

      const response = NextResponse.json({
        success: false,
        error: 'Database connection not available',
        message: 'Supabase client could not be initialized - check environment variables in Netlify deployment settings',
        debug: debugInfo, // Always include debug info for production troubleshooting
        data: { surf_camps: [], total_count: 0 },
        instructions: process.env.NODE_ENV === 'production' ? {
          netlify_setup: 'Configure environment variables in Netlify Site Settings > Environment Variables',
          required_vars: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'WORDPRESS_API_KEY'],
          debug_endpoint: '/api/debug/surf-camps'
        } : undefined
      }, { status: 500 });

      // Add CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Heiwa-API-Key');

      return response;
    }

    let query = client
      .from('surf_camps')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        max_participants,
        price,
        level,
        includes,
        images,
        created_at,
        is_active
      `)
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    // Apply filters if provided
    if (levelFilter && ['beginner', 'intermediate', 'advanced', 'all'].includes(levelFilter)) {
      query = query.or(`level.eq.${levelFilter},level.eq.all`);
    }

    const { data: surfCamps, error } = await query;

    console.log('WordPress surf camps query result:', { surfCamps, error, count: surfCamps?.length });

    if (error) {
      console.error('Error fetching surf camps for WordPress:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch surf camps from database',
        data: { surf_camps: [], total_count: 0 }
      }, { status: 500 });
    }

    // Compute real-time occupancy and price_from
    // 1) Fetch confirmed bookings (items JSONB) and reduce by campId
    const confirmedByCamp: Record<string, number> = {};
    try {
      const { data: bookingsData, error: bookingsError } = await client
        .from('bookings')
        .select('items, payment_status')
        .eq('payment_status', 'confirmed');
      if (bookingsError) {
        console.warn('WP surf-camps: bookings fetch error', bookingsError);
      } else if (Array.isArray(bookingsData)) {
        for (const b of bookingsData as any[]) {
          let items: any[] = [];

          // Handle both array and JSONB string formats
          if (Array.isArray(b.items)) {
            items = b.items;
          } else if (typeof b.items === 'string') {
            try {
              items = JSON.parse(b.items);
            } catch (e) {
              console.warn('Failed to parse booking items JSON:', b.items);
              continue;
            }
          } else if (b.items && typeof b.items === 'object') {
            // Already parsed JSONB object
            items = Array.isArray(b.items) ? b.items : [b.items];
          }

          for (const it of items) {
            if (it && it.type === 'surfCamp' && it.itemId) {
              const qty = typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1;
              confirmedByCamp[it.itemId] = (confirmedByCamp[it.itemId] || 0) + qty;
            }
          }
        }
      }
    } catch (e) {
      console.warn('WP surf-camps: error computing confirmedByCamp', e);
    }

    // 2) Compute global min dorm/per-bed price as fallback for price_from
    let globalMinDormPrice: number | null = null;
    try {
      const { data: roomsData, error: roomsError } = await client
        .from('rooms')
        .select('pricing, booking_type, is_active, name')
        .eq('is_active', true);
      if (roomsError) {
        console.warn('WP surf-camps: rooms fetch error', roomsError);
      } else if (Array.isArray(roomsData)) {
        for (const r of roomsData as any[]) {
          const pricing = r?.pricing || {};
          const perBed = pricing?.camp?.perBed;
          let candidate: number | null = null;
          if (typeof perBed === 'number' && perBed > 0) candidate = perBed;
          else if ((r?.booking_type === 'perBed') || (typeof r?.name === 'string' && r.name.toLowerCase().includes('dorm')))
            candidate = typeof pricing?.standard === 'number' ? pricing.standard : null;
          if (typeof candidate === 'number') {
            if (globalMinDormPrice == null || candidate < globalMinDormPrice) globalMinDormPrice = candidate;
          }
        }
      }
    } catch (e) {
      console.warn('WP surf-camps: error computing globalMinDormPrice', e);
    }

    // Transform data for WordPress widget consumption, adding occupancy and price_from
    const wordpressCamps = (surfCamps || []).map((camp: any) => {
      const basePrice = parseFloat(camp.price.toString());
      const confirmed = confirmedByCamp[camp.id] || 0;
      const available = Math.max(0, (camp.max_participants || 0) - confirmed);
      const priceFrom = globalMinDormPrice ?? basePrice;
      return {
        id: camp.id,
        name: camp.name,
        description: camp.description,
        destination: extractDestination(camp.name, camp.description),
        dates: {
          start_date: camp.start_date,
          end_date: camp.end_date,
          formatted_dates: formatDateRange(camp.start_date, camp.end_date)
        },
        pricing: {
          base_price: basePrice,
          currency: 'EUR',
          display_price: `€${basePrice}`,
          price_from: priceFrom
        },
        details: {
          max_participants: camp.max_participants,
          skill_level: camp.level,
          includes: camp.includes || [],
          available_spots: available,
          confirmed_booked: confirmed
        },
        media: {
          images: camp.images || [],
          featured_image: camp.images?.[0] || null
        },
        booking_info: {
          duration_days: calculateDurationDays(camp.start_date, camp.end_date),
          booking_deadline: calculateBookingDeadline(camp.start_date)
        }
      };
    });

    // Filter by location if specified (client-side filtering for now)
    let filteredCamps = wordpressCamps;
    if (locationFilter) {
      filteredCamps = wordpressCamps.filter((camp: any) =>
        camp.destination.toLowerCase().includes(locationFilter.toLowerCase()) ||
        camp.name.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        surf_camps: filteredCamps,
        total_count: filteredCamps.length,
        filters_applied: {
          location: locationFilter,
          level: levelFilter
        }
      },
      meta: {
        generated_at: new Date().toISOString(),
        api_version: '1.0',
        source: 'heiwa_house_backend'
      }
    });

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Heiwa-API-Key');

    return response;

  } catch (error: any) {
    console.error('WordPress surf-camps endpoint error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    const response = NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process surf camps request',
        debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Heiwa-API-Key');

    return response;
  }
}

/**
 * Extract destination from camp name or description
 */
function extractDestination(name: string, description: string): string {
  // Common destination keywords
  const destinations = [
    'Basque', 'Basque Country', 'Biarritz', 'Hossegor',
    'Morocco', 'Taghazout', 'Essaouira',
    'California', 'Malibu', 'Santa Barbara',
    'Portugal', 'Ericeira', 'Peniche',
    'Costa Rica', 'Nosara', 'Tamarindo'
  ];

  const text = `${name} ${description}`.toLowerCase();

  for (const destination of destinations) {
    if (text.includes(destination.toLowerCase())) {
      return destination;
    }
  }

  // Fallback: extract first word that might be a location
  const words = name.split(' ');
  return words.find(word => word.length > 3) || 'Surf Camp';
}

// No more fallback camps - always use real database data

/**
 * Format date range for display
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric'
  };

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

/**
 * Calculate duration in days
 */
function calculateDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate booking deadline (e.g., 7 days before start)
 */
function calculateBookingDeadline(startDate: string): string {
  const start = new Date(startDate);
  const deadline = new Date(start.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before
  return deadline.toISOString();
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Heiwa-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}
