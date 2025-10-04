import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { emailService } from '@/lib/email-service';
import { Booking, Client } from '@/lib/schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const { booking, client, type } = body;

    if (!booking || !client) {
      return NextResponse.json(
        { error: 'Booking and client data are required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'booking-confirmation':
        await emailService.sendBookingConfirmation(booking, client);
        break;

      case 'booking-notification':
        await emailService.sendBookingNotification(booking, client);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
