import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/auth';
import { checkEventConflicts } from '@/lib/calendar-conflicts';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zejrhceuuujzgyukdwnb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJoY2V1dXVqemd5dWtkd25iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzEwNDgwOSwiZXhwIjoyMDcyNjgwODA5fQ.RbzOLzCaOAsgaMixdACMLdPvLZjU9MPfXn8Y90gsxcc';
const admin = createClient(supabaseUrl, supabaseServiceKey);

// Custom event schema for validation
const CustomEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  color: z.string().default('#6b7280'),
  isAllDay: z.boolean().default(false),
});

type CustomEvent = z.infer<typeof CustomEventSchema>;

// GET /api/calendar-events - Get all custom calendar events
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const { data: events, error } = await admin
      .from('custom_events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to fetch custom events');
    }

    return NextResponse.json({ events: events || [] });
  } catch (error: any) {
    console.error('Get custom events error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch custom events' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// POST /api/calendar-events - Create new custom calendar event
export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const validatedData = CustomEventSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflictCheck = await checkEventConflicts({
      startDate,
      endDate,
      eventType: 'custom',
    });

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        {
          error: 'Scheduling conflict detected',
          conflicts: conflictCheck.conflicts,
          warnings: conflictCheck.warnings
        },
        { status: 409 }
      );
    }

    // Insert the custom event into Supabase
    const { data: event, error } = await admin
      .from('custom_events')
      .insert({
        title: validatedData.title,
        description: validatedData.description || null,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        color: validatedData.color,
        is_all_day: validatedData.isAllDay,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to create custom event');
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('Create custom event error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create custom event' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// PUT /api/calendar-events - Update custom calendar event
export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = CustomEventSchema.partial().parse(updates);

    // Validate date range if both dates are provided
    if (validatedUpdates.startDate && validatedUpdates.endDate) {
      const startDate = new Date(validatedUpdates.startDate);
      const endDate = new Date(validatedUpdates.endDate);

      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validatedUpdates.title !== undefined) updateData.title = validatedUpdates.title;
    if (validatedUpdates.description !== undefined) updateData.description = validatedUpdates.description;
    if (validatedUpdates.startDate !== undefined) updateData.start_date = validatedUpdates.startDate;
    if (validatedUpdates.endDate !== undefined) updateData.end_date = validatedUpdates.endDate;
    if (validatedUpdates.color !== undefined) updateData.color = validatedUpdates.color;
    if (validatedUpdates.isAllDay !== undefined) updateData.is_all_day = validatedUpdates.isAllDay;

    const { data: event, error } = await admin
      .from('custom_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update custom event');
    }

    return NextResponse.json({ event });
  } catch (error: any) {
    console.error('Update custom event error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update custom event' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// DELETE /api/calendar-events - Delete custom calendar event
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from('custom_events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to delete custom event');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete custom event error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete custom event' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
