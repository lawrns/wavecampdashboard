import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { bookingsAPI, clientsAPI } from '@/lib/supabase-admin';
import { sendBookingEmails } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

// CORS headers for WordPress integration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Heiwa-API-Key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * WordPress API Room Bookings Endpoint
 * Creates new room bookings from WordPress widget submissions
 * 
 * @route POST /api/wordpress/room-bookings
 * @auth X-Heiwa-API-Key header required
 * @body {Object} Room booking data with participants and room selection
 * @returns {Object} Created booking confirmation with payment details
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY;

    console.log('🔐 Room booking API auth check:', {
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

    // Validate required room booking data structure
    if (!bookingData.room_id || !bookingData.participants || !Array.isArray(bookingData.participants)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking data',
          message: 'room_id and participants array are required'
        },
        {
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Validate date fields
    if (!bookingData.start_date || !bookingData.end_date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking data',
          message: 'start_date and end_date are required'
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

    // Initialize admin Supabase (service role) for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const participantCount = bookingData.participants.length;
    const startDate = new Date(bookingData.start_date);
    const endDate = new Date(bookingData.end_date);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Create or find clients for each participant
    const clientIds: string[] = [];
    for (const participant of bookingData.participants) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('email', participant.email)
        .limit(1);

      if (existing && existing.length > 0) {
        clientIds.push(existing[0].id);
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert([
            {
              name: participant.name,
              email: participant.email,
              phone: participant.phone || '',
              notes: 'Created from WordPress room booking',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select('id')
          .single();
        if (clientErr || !newClient) {
          return NextResponse.json(
            { success: false, error: 'Failed to create client' },
            { status: 500, headers: corsHeaders }
          );
        }
        clientIds.push(newClient.id);
      }
    }

    // Determine pricing: prefer client-provided pricing snapshot to ensure parity with UI
    const clientPricing = bookingData.pricing || {};
    const basePrice: number = typeof clientPricing.basePrice === 'number' ? clientPricing.basePrice : 0;
    const addOnsSubtotal: number = typeof clientPricing.addOnsSubtotal === 'number' ? clientPricing.addOnsSubtotal : 0;
    const taxesCalc = (basePrice + addOnsSubtotal) * 0.1;
    const feesCalc = (basePrice + addOnsSubtotal) * 0.05;
    const taxes = Math.round(taxesCalc);
    const fees = Math.round(feesCalc);
    const totalAmount: number = typeof clientPricing.total === 'number' && clientPricing.total > 0
      ? clientPricing.total
      : basePrice + addOnsSubtotal + taxes + fees;

    // Build booking items (room + add-ons)
    const items: any[] = [
      {
        type: 'room' as const,
        itemId: bookingData.room_id,
        quantity: 1,
        unitPrice: basePrice - addOnsSubtotal - taxes - fees > 0 ? Math.round((basePrice - addOnsSubtotal - taxes - fees)) : basePrice,
        totalPrice: basePrice,
        dates: {
          checkIn: bookingData.start_date,
          checkOut: bookingData.end_date,
        },
      },
    ];

    if (Array.isArray(bookingData.add_ons)) {
      for (const a of bookingData.add_ons) {
        if (!a || !a.id || !a.quantity) continue;
        items.push({
          type: 'addOn' as const,
          itemId: a.id,
          quantity: a.quantity,
          unitPrice: a.price ?? 0,
          totalPrice: (a.price ?? 0) * a.quantity,
        });
      }
    }

    // Persist booking
    const heiwaBookingData = {
      clientIds,
      items,
      totalAmount,
      paymentStatus: 'pending' as const,
      paymentMethod: 'stripe' as const,
      notes: 'Room booking created via WordPress widget',
      source: 'wordpress' as const,
    };

    const bookingId = await bookingsAPI.create(heiwaBookingData);
    const createdBooking = await bookingsAPI.getById(bookingId);

    if (!createdBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking creation failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send emails asynchronously
    (async () => {
      try {
        const primaryClient = await clientsAPI.getById(clientIds[0]);
        if (primaryClient && createdBooking) {
          await sendBookingEmails(createdBooking, primaryClient);
        }
      } catch (e) {
        console.error('Email send failed', e);
      }
    })();

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-heiwa-app.com'}/payment/${bookingId}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          booking: {
            id: bookingId,
            booking_number: `WP-ROOM-${bookingId.substring(0, 8).toUpperCase()}`,
            status: 'pending',
            room: {
              id: bookingData.room_id,
              dates: { start: bookingData.start_date, end: bookingData.end_date },
            },
            participants: participantCount,
            pricing: {
              base_price: basePrice,
              nights: nights,
              participants: participantCount,
              subtotal: basePrice + addOnsSubtotal,
              taxes,
              total: totalAmount,
              currency: 'EUR',
            },
            participant_details: bookingData.participants,
          },
          payment: {
            status: 'pending',
            method: 'stripe',
            payment_link: paymentLink,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
          next_steps: {
            payment_required: true,
            payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            confirmation_email_sent: true,
          },
        },
        meta: {
          created_at: new Date().toISOString(),
          source: 'wordpress_widget',
          booking_reference: `WP-ROOM-${bookingId.substring(0, 8).toUpperCase()}`,
        },
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('WordPress room booking error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process room booking'
      },
      {
        status: 500,
        headers: corsHeaders
      }
    );
  }
}
