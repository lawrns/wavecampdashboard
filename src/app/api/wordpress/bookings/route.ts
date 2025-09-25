import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bookingsAPI, clientsAPI } from '@/lib/supabase-admin';
import { CreateBookingSchema } from '@/lib/schemas';
import { sendBookingEmails } from '@/lib/email-service';
import { withRateLimit, createRateLimitResponse, bookingRateLimiter } from '@/lib/rate-limiter';

// CORS headers for WordPress integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Heiwa-API-Key',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Temporarily use service role for testing WordPress widget
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * WordPress API Bookings Endpoint
 * Creates new bookings from WordPress widget submissions
 * 
 * @route POST /api/wordpress/bookings
 * @auth X-Heiwa-API-Key header required
 * @body {Object} Booking data with participants and camp selection
 * @returns {Object} Created booking confirmation with payment details
 */
export async function POST(request: NextRequest) {
  try {
    // Apply strict rate limiting for booking creation
    const rateLimitResult = await withRateLimit(request, bookingRateLimiter);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult.headers);
    }

    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY;

    console.log('🔐 Surf week booking API auth check:', {
      hasApiKey: !!apiKey,
      hasValidApiKey: !!validApiKey,
      apiKeyLength: apiKey?.length || 0,
      validApiKeyLength: validApiKey?.length || 0,
      keysMatch: apiKey === validApiKey,
      receivedKey: apiKey?.substring(0, 10) + '...',
      expectedKey: validApiKey?.substring(0, 10) + '...'
    });

    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing API key',
          debug: {
            hasApiKey: !!apiKey,
            hasValidApiKey: !!validApiKey,
            keysMatch: apiKey === validApiKey
          }
        },
        {
          status: 401,
          headers: corsHeaders
        }
      );
    }

    const bookingData = await request.json();

    // Validate required WordPress booking data structure
    if (!bookingData.camp_id || !bookingData.participants || !Array.isArray(bookingData.participants)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking data',
          message: 'camp_id and participants array are required'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate participants data
    for (const participant of bookingData.participants) {
      if (!participant.name || !participant.email) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid participant data',
            message: 'Each participant must have name and email'
          },
          {
            status: 400,
            headers: corsHeaders
          }
        );
      }
    }

    // Get camp details to validate and get pricing
    const { data: camp, error: campError } = await supabase
      .from('surf_camps')
      .select('*')
      .eq('id', bookingData.camp_id)
      .eq('is_active', true)
      .single();

    if (campError || !camp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Camp not found',
          message: 'The selected surf camp is not available'
        },
        {
          status: 404,
          headers: corsHeaders
        }
      );
    }

    // Create or find clients for each participant
    const clientIds: string[] = [];
    
    for (const participant of bookingData.participants) {
      // Check if client already exists by email
      const { data: existingClients } = await supabase
        .from('clients')
        .select('id')
        .eq('email', participant.email)
        .limit(1);

      let clientId: string;

      if (existingClients && existingClients.length > 0) {
        // Use existing client
        clientId = existingClients[0].id;
      } else {
        // Create new client
        const newClientData = {
          name: participant.name,
          email: participant.email,
          phone: participant.phone || '',
          notes: `Created from WordPress booking. Surf level: ${participant.surf_level || 'not specified'}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([newClientData])
          .select('id')
          .single();

        if (clientError || !newClient) {
          console.error('Error creating client:', clientError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to create client',
              message: `Could not create client record for ${participant.email}`
            },
            {
              status: 500,
              headers: corsHeaders
            }
          );
        }

        clientId = newClient.id;
      }

      clientIds.push(clientId);
    }

    // Calculate pricing
    const participantCount = bookingData.participants.length;
    const basePrice = parseFloat(camp.price.toString());
    const totalAmount = basePrice * participantCount;

    // Create booking items array
    const bookingItems = [
      {
        type: 'surfCamp' as const,
        itemId: camp.id,
        quantity: participantCount,
        unitPrice: basePrice,
        totalPrice: totalAmount,
        dates: {
          checkIn: camp.start_date,
          checkOut: camp.end_date
        }
      }
    ];

    // Prepare booking data for Heiwa system
    const heiwaBookingData = {
      clientIds: clientIds,
      items: bookingItems,
      totalAmount: totalAmount,
      paymentStatus: 'pending' as const,
      paymentMethod: 'stripe' as const, // Default for WordPress bookings
      notes: [
        'Booking created via WordPress widget',
        `Source: ${bookingData.source_url || 'WordPress site'}`,
        `Special requests: ${bookingData.special_requests || 'None'}`,
        `Participants: ${bookingData.participants.map((p: any) => `${p.name} (${p.email})`).join(', ')}`
      ].join('\n'),
      source: 'wordpress' as const, // Add source tracking with proper typing
      wordpress_meta: {
        site_url: bookingData.source_url,
        widget_version: bookingData.widget_version || '1.0',
        utm_source: bookingData.utm_source,
        utm_campaign: bookingData.utm_campaign
      }
    };

    // Create booking in Heiwa system
    const bookingId = await bookingsAPI.create(heiwaBookingData);
    const createdBooking = await bookingsAPI.getById(bookingId);

    if (!createdBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking creation failed',
          message: 'Booking was created but could not be retrieved'
        },
        {
          status: 500,
          headers: corsHeaders
        }
      );
    }

    // Send confirmation emails asynchronously (don't block response)
    (async () => {
      try {
        const primaryClient = await clientsAPI.getById(clientIds[0]);
        if (primaryClient && createdBooking) {
          await sendBookingEmails(createdBooking, primaryClient);
        }
      } catch (error) {
        console.error('Failed to send booking confirmation emails:', error);
        // Don't fail the booking if emails fail
      }
    })();

    // Generate payment link (simplified - in production would integrate with Stripe)
    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-heiwa-app.com'}/payment/${bookingId}`;

    return NextResponse.json({
      success: true,
      data: {
        booking: {
          id: bookingId,
          booking_number: `WP-${bookingId.substring(0, 8).toUpperCase()}`,
          status: 'pending',
          camp: {
            id: camp.id,
            name: camp.name,
            dates: {
              start: camp.start_date,
              end: camp.end_date
            }
          },
          participants: bookingData.participants.length,
          pricing: {
            base_price: basePrice,
            participants: participantCount,
            subtotal: totalAmount,
            taxes: totalAmount * 0.1, // Estimated
            total: totalAmount * 1.1,
            currency: 'EUR'
          },
          clients: clientIds
        },
        payment: {
          status: 'pending',
          method: 'stripe',
          payment_link: paymentLink,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        },
        next_steps: {
          payment_required: true,
          payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          confirmation_email_sent: true
        }
      },
      meta: {
        created_at: new Date().toISOString(),
        source: 'wordpress_widget',
        booking_reference: `WP-${bookingId.substring(0, 8).toUpperCase()}`
      }
    }, {
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('WordPress bookings endpoint error:', error);
    
    // Handle specific validation errors
    if (error.message?.includes('validation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: error.message
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create booking'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * GET endpoint to retrieve WordPress booking by ID
 * Useful for payment confirmation callbacks
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY;
    
    if (!apiKey || !validApiKey || apiKey !== validApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('booking_id');

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: 'booking_id parameter required' },
        { status: 400 }
      );
    }

    const booking = await bookingsAPI.getById(bookingId);
    
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Return simplified booking data for WordPress
    return NextResponse.json({
      success: true,
      data: {
        id: booking.id,
        status: booking.paymentStatus,
        total_amount: booking.totalAmount,
        created_at: booking.createdAt,
        payment_method: booking.paymentMethod
      }
    });

  } catch (error: any) {
    console.error('WordPress booking GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve booking' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
