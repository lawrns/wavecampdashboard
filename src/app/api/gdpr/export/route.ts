import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for GDPR export request
const GDPRExportSchema = z.object({
  clientEmail: z.string().email('Invalid email format'),
  requestReason: z.string().optional(),
  includeBookings: z.boolean().default(true),
  includePayments: z.boolean().default(true),
  includeProfile: z.boolean().default(true),
});

// Helper function to get admin user from request
async function getAdminFromRequest(request: NextRequest) {
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

    // Check if user is admin (you might want to check against a specific admin table or role)
    const adminEmails = [
      'julianmjavierm@gmail.com',
      'julian@fyves.com',
      'admin@heiwa.house',
      'manager@heiwa.house',
      'laurence@fyves.com'
    ];

    if (!adminEmails.includes(user.email || '')) {
      throw new Error('Insufficient permissions');
    }

    return user;
  } catch (error) {
    console.error('Admin auth error:', error);
    return null;
  }
}

// POST /api/gdpr/export - Export client data
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedRequest = GDPRExportSchema.parse(body);

    // Find the client by email
    const { data: clientProfile, error: clientError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('email', validatedRequest.clientEmail)
      .single();

    if (clientError || !clientProfile) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const exportData: any = {
      exportInfo: {
        exportDate: new Date().toISOString(),
        requestedBy: admin.email,
        requestReason: validatedRequest.requestReason,
        clientEmail: validatedRequest.clientEmail,
        dataTypes: {
          profile: validatedRequest.includeProfile,
          bookings: validatedRequest.includeBookings,
          payments: validatedRequest.includePayments
        }
      },
      clientData: {}
    };

    // Export profile data
    if (validatedRequest.includeProfile) {
      exportData.clientData.profile = {
        userId: clientProfile.user_id,
        name: clientProfile.name,
        email: clientProfile.email,
        phone: clientProfile.phone,
        location: clientProfile.location,
        surfLevel: clientProfile.surf_level,
        emergencyContact: clientProfile.emergency_contact,
        emergencyPhone: clientProfile.emergency_phone,
        dietaryRestrictions: clientProfile.dietary_restrictions,
        medicalConditions: clientProfile.medical_conditions,
        notes: clientProfile.notes,
        createdAt: clientProfile.created_at,
        updatedAt: clientProfile.updated_at
      };
    }

    // Export booking data
    if (validatedRequest.includeBookings) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .contains('client_ids', [clientProfile.user_id]);

      if (!bookingsError && bookings) {
        exportData.clientData.bookings = bookings.map(booking => ({
          id: booking.id,
          clientIds: booking.client_ids,
          items: booking.items,
          totalAmount: booking.total_amount,
          paymentStatus: booking.payment_status,
          paymentMethod: booking.payment_method,
          notes: booking.notes,
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        }));
      }
    }

    // Export payment data
    if (validatedRequest.includePayments) {
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('booking_id', exportData.clientData.bookings?.map((b: any) => b.id) || []);

      if (!paymentsError && payments) {
        exportData.clientData.payments = payments.map(payment => ({
          id: payment.id,
          bookingId: payment.booking_id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.payment_method,
          stripeCheckoutSessionId: payment.stripe_checkout_session_id,
          stripePaymentIntentId: payment.stripe_payment_intent_id,
          createdAt: payment.created_at,
          updatedAt: payment.updated_at
        }));
      }
    }

    // Log the export request for compliance
    await supabase
      .from('consent_logs')
      .insert({
        user_id: clientProfile.user_id,
        action: 'data_export',
        details: {
          requestedBy: admin.email,
          reason: validatedRequest.requestReason,
          dataTypes: validatedRequest
        },
        created_at: new Date().toISOString()
      });

    // Return the data as JSON for download
    const jsonData = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="client-data-${validatedRequest.clientEmail}-${new Date().toISOString().split('T')[0]}.json"`
      }
    });

  } catch (error: any) {
    console.error('GDPR export error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to export data' },
      { status: 500 }
    );
  }
}

// GET /api/gdpr/export - Get export status (for future use)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // For now, return a simple status
    return NextResponse.json({
      status: 'ready',
      message: 'GDPR export service is operational'
    });

  } catch (error: any) {
    console.error('GDPR export status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get export status' },
      { status: 500 }
    );
  }
}
