import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for GDPR deletion request
const GDPRDeleteSchema = z.object({
  clientEmail: z.string().email('Invalid email format'),
  confirmationText: z.string().refine(val => val === 'DELETE', 'Must type "DELETE" to confirm'),
  reason: z.string().min(1, 'Reason is required'),
  retentionPeriod: z.number().default(0),
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

    // Check if user is admin
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

// POST /api/gdpr/delete - Delete client data
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
    const validatedRequest = GDPRDeleteSchema.parse(body);

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

    const userId = clientProfile.user_id;
    let deletedRecords = 0;

    // Log the deletion request before starting
    await supabase
      .from('consent_logs')
      .insert({
        user_id: userId,
        action: 'data_deletion_initiated',
        details: {
          requestedBy: admin.email,
          reason: validatedRequest.reason,
          confirmationText: validatedRequest.confirmationText,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    // Start deletion process (in a real implementation, you might want to use a transaction)
    
    // 1. Delete payments first (foreign key constraints)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .contains('client_ids', [userId]);

    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map(b => b.id);
      
      const { error: paymentsError, count: paymentsCount } = await supabase
        .from('payments')
        .delete()
        .in('booking_id', bookingIds);

      if (!paymentsError && paymentsCount) {
        deletedRecords += paymentsCount;
      }
    }

    // 2. Delete room assignments
    const { error: assignmentsError, count: assignmentsCount } = await supabase
      .from('room_assignments')
      .delete()
      .eq('client_id', userId);

    if (!assignmentsError && assignmentsCount) {
      deletedRecords += assignmentsCount;
    }

    // 3. Delete bookings
    const { error: bookingsError, count: bookingsCount } = await supabase
      .from('bookings')
      .delete()
      .contains('client_ids', [userId]);

    if (!bookingsError && bookingsCount) {
      deletedRecords += bookingsCount;
    }

    // 4. Delete client profile
    const { error: profileError, count: profileCount } = await supabase
      .from('client_profiles')
      .delete()
      .eq('user_id', userId);

    if (!profileError && profileCount) {
      deletedRecords += profileCount;
    }

    // 5. Delete auth user (this might require admin privileges)
    // Note: In a real implementation, you might want to handle this differently
    // as deleting auth users requires special permissions
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (!authError) {
        deletedRecords += 1;
      }
    } catch (authError) {
      console.warn('Could not delete auth user:', authError);
      // Continue with the process even if auth deletion fails
    }

    // Log the completion of deletion
    await supabase
      .from('consent_logs')
      .insert({
        user_id: userId,
        action: 'data_deletion_completed',
        details: {
          requestedBy: admin.email,
          reason: validatedRequest.reason,
          deletedRecords: deletedRecords,
          completedAt: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      message: 'Client data successfully deleted',
      deletedRecords: deletedRecords,
      clientEmail: validatedRequest.clientEmail,
      deletedBy: admin.email,
      deletedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('GDPR deletion error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete client data' },
      { status: 500 }
    );
  }
}

// GET /api/gdpr/delete - Get deletion status (for future use)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    // Get recent deletion logs
    const { data: recentDeletions, error } = await supabase
      .from('consent_logs')
      .select('*')
      .eq('action', 'data_deletion_completed')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      status: 'ready',
      message: 'GDPR deletion service is operational',
      recentDeletions: recentDeletions || []
    });

  } catch (error: any) {
    console.error('GDPR deletion status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get deletion status' },
      { status: 500 }
    );
  }
}
