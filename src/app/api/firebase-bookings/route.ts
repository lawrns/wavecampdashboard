import { NextRequest, NextResponse } from 'next/server';
import { bookingsAPI, clientsAPI } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/auth';
import { CreateBookingSchema, UpdateBookingSchema } from '@/lib/schemas';
import { sendBookingEmails } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

// GET /api/firebase-bookings - Get all bookings
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'confirmed' | 'cancelled' | null;
    const clientId = searchParams.get('clientId');

    let bookings;
    if (status) {
      bookings = await bookingsAPI.getByStatus(status);
    } else if (clientId) {
      bookings = await bookingsAPI.getByClientId(clientId);
    } else {
      bookings = await bookingsAPI.getAll();
    }

    return NextResponse.json({ bookings });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bookings' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// POST /api/firebase-bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const validatedData = CreateBookingSchema.parse(body);

    const bookingId = await bookingsAPI.create(validatedData);
    const booking = await bookingsAPI.getById(bookingId);

    if (booking) {
      // Send booking confirmation emails asynchronously
      // We don't await this to avoid blocking the response
      (async () => {
        try {
          // Fetch client data for the first client
          const primaryClient = await clientsAPI.getById(booking.clientIds[0]);
          if (primaryClient) {
            await sendBookingEmails(booking, primaryClient);
          }
        } catch (error) {
          console.error('Failed to send booking emails:', error);
          // Don't fail the booking creation if emails fail
        }
      })();
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: error.message.includes('Authentication') ? 401 : 400 }
    );
  }
}

// PUT /api/firebase-bookings - Update booking
export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession(request);
    
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateBookingSchema.parse(updates);
    await bookingsAPI.update(id, validatedUpdates);
    
    const booking = await bookingsAPI.getById(id);
    return NextResponse.json({ booking });
  } catch (error: any) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update booking' },
      { status: error.message.includes('Authentication') ? 401 : 400 }
    );
  }
}

// DELETE /api/firebase-bookings - Delete booking
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession(request);
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    await bookingsAPI.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete booking' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
