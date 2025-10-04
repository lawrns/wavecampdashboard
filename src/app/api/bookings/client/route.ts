import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for updating client bookings
const UpdateClientBookingSchema = z.object({
  notes: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'cash', 'transfer', 'other']).optional(),
});

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookies = request.headers.get('cookie') || '';
    const tokenMatch = cookies.match(/sb-[^=]+-auth-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error('No authentication token provided');
    }

    // Get current user session
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error('Invalid or expired token');
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// GET /api/bookings/client - Get client's bookings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get bookings for the authenticated client
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .contains('client_ids', [user.id])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Transform Supabase data to match our schema
    const transformedBookings = bookings?.map(booking => ({
      id: booking.id,
      clientIds: booking.client_ids,
      items: booking.items,
      totalAmount: parseFloat(booking.total_amount),
      paymentStatus: booking.payment_status,
      paymentMethod: booking.payment_method,
      notes: booking.notes || '',
      createdAt: new Date(booking.created_at),
      updatedAt: new Date(booking.updated_at)
    })) || [];

    return NextResponse.json({ bookings: transformedBookings });
  } catch (error: any) {
    console.error('Get client bookings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

// PUT /api/bookings/client - Update client booking
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Validate the updates
    const validatedUpdates = UpdateClientBookingSchema.parse(updates);

    // First, verify the booking belongs to the authenticated user
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('client_ids')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this booking
    if (!existingBooking.client_ids.includes(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized to update this booking' },
        { status: 403 }
      );
    }

    // Update the booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedBooking = {
      id: updatedBooking.id,
      clientIds: updatedBooking.client_ids,
      items: updatedBooking.items,
      totalAmount: parseFloat(updatedBooking.total_amount),
      paymentStatus: updatedBooking.payment_status,
      paymentMethod: updatedBooking.payment_method,
      notes: updatedBooking.notes || '',
      createdAt: new Date(updatedBooking.created_at),
      updatedAt: new Date(updatedBooking.updated_at)
    };

    return NextResponse.json({ booking: transformedBooking });
  } catch (error: any) {
    console.error('Update client booking error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// POST /api/bookings/client - Create new booking (for future use)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // For now, return a not implemented response
    // This would be implemented when we add booking creation functionality
    return NextResponse.json(
      { error: 'Booking creation not yet implemented' },
      { status: 501 }
    );
  } catch (error: any) {
    console.error('Create client booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
