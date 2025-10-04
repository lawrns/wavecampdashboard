import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { requireAdminSession } from '@/lib/auth';
import { checkEventConflicts, checkRoomAvailability, validateSurfCampCapacity } from '@/lib/calendar-conflicts';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Surf camp schema for calendar creation (simplified version)
const CalendarSurfCampSchema = z.object({
  category: z.enum(['FR', 'HH']),
  startDate: z.string().datetime('Invalid start date format'),
  endDate: z.string().datetime('Invalid end date format'),
  availableRooms: z.array(z.string()).min(1, 'At least one room is required'),
  occupancy: z.number().min(1, 'Occupancy must be at least 1'),
});

type CalendarSurfCamp = z.infer<typeof CalendarSurfCampSchema>;

// GET /api/firebase-surfcamps - Get all surf camps (legacy format)
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const { data: surfCamps, error } = await supabase
      .from('surf_camps')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to fetch surf camps');
    }

    // Convert to legacy format for compatibility
    const legacySurfCamps = surfCamps?.map(camp => ({
      id: camp.id,
      category: camp.name.includes('Freedom') ? 'FR' : 'HH', // Infer category from name
      startDate: camp.start_date,
      endDate: camp.end_date,
      availableRooms: [], // This would need to be populated from room assignments
      occupancy: camp.max_participants,
      createdAt: camp.created_at,
      updatedAt: camp.updated_at,
    })) || [];

    return NextResponse.json({ surfCamps: legacySurfCamps });
  } catch (error: any) {
    console.error('Get surf camps error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch surf camps' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// POST /api/firebase-surfcamps - Create new surf camp from calendar
export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const validatedData = CalendarSurfCampSchema.parse(body);

    // Validate date range
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Check for conflicts using the comprehensive conflict detection
    const conflictCheck = await checkEventConflicts({
      startDate,
      endDate,
      eventType: 'surfCamp',
      roomIds: validatedData.availableRooms,
      capacity: validatedData.occupancy,
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

    // Check room availability
    const roomAvailability = await checkRoomAvailability(
      validatedData.availableRooms,
      startDate,
      endDate
    );

    if (roomAvailability.unavailableRooms.length > 0) {
      return NextResponse.json(
        {
          error: 'Some rooms are not available during this period',
          unavailableRooms: roomAvailability.unavailableRooms,
          availableRooms: roomAvailability.availableRooms
        },
        { status: 409 }
      );
    }

    // Validate capacity limits
    const capacityCheck = await validateSurfCampCapacity(
      startDate,
      endDate,
      validatedData.occupancy
    );

    if (!capacityCheck.isValid) {
      return NextResponse.json(
        {
          error: 'Capacity conflict detected',
          message: capacityCheck.message,
          currentBookings: capacityCheck.currentBookings
        },
        { status: 409 }
      );
    }

    // Generate camp name based on category and dates
    const categoryName = validatedData.category === 'FR' ? 'Freedom Routes' : 'Heiwa House';
    const startDateStr = new Date(validatedData.startDate).toLocaleDateString();
    const campName = `${categoryName} Camp - ${startDateStr}`;

    // Create the surf camp
    const { data: surfCamp, error } = await supabase
      .from('surf_camps')
      .insert({
        name: campName,
        description: `${categoryName} surf camp session`,
        start_date: validatedData.startDate,
        end_date: validatedData.endDate,
        max_participants: validatedData.occupancy,
        price: validatedData.category === 'FR' ? 799.00 : 599.00, // Default pricing
        level: 'all',
        includes: ['Daily surf lessons', 'Equipment rental', 'Breakfast'],
        images: [],
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to create surf camp');
    }

    // TODO: Create room assignments based on availableRooms
    // This would require a separate room_assignments table or similar

    // Return in legacy format
    const legacySurfCamp = {
      id: surfCamp.id,
      category: validatedData.category,
      startDate: surfCamp.start_date,
      endDate: surfCamp.end_date,
      availableRooms: validatedData.availableRooms,
      occupancy: surfCamp.max_participants,
      createdAt: surfCamp.created_at,
      updatedAt: surfCamp.updated_at,
    };

    return NextResponse.json({ surfCamp: legacySurfCamp }, { status: 201 });
  } catch (error: any) {
    console.error('Create surf camp error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create surf camp' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// PUT /api/firebase-surfcamps - Update surf camp
export async function PUT(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Surf camp ID is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = CalendarSurfCampSchema.partial().parse(updates);

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
    if (validatedUpdates.startDate !== undefined) updateData.start_date = validatedUpdates.startDate;
    if (validatedUpdates.endDate !== undefined) updateData.end_date = validatedUpdates.endDate;
    if (validatedUpdates.occupancy !== undefined) updateData.max_participants = validatedUpdates.occupancy;
    
    // Update name if category changes
    if (validatedUpdates.category !== undefined) {
      const categoryName = validatedUpdates.category === 'FR' ? 'Freedom Routes' : 'Heiwa House';
      const startDate = validatedUpdates.startDate ? new Date(validatedUpdates.startDate) : new Date();
      const startDateStr = startDate.toLocaleDateString();
      updateData.name = `${categoryName} Camp - ${startDateStr}`;
      updateData.description = `${categoryName} surf camp session`;
    }

    const { data: surfCamp, error } = await supabase
      .from('surf_camps')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to update surf camp');
    }

    // Return in legacy format
    const legacySurfCamp = {
      id: surfCamp.id,
      category: validatedUpdates.category || (surfCamp.name.includes('Freedom') ? 'FR' : 'HH'),
      startDate: surfCamp.start_date,
      endDate: surfCamp.end_date,
      availableRooms: validatedUpdates.availableRooms || [],
      occupancy: surfCamp.max_participants,
      createdAt: surfCamp.created_at,
      updatedAt: surfCamp.updated_at,
    };

    return NextResponse.json({ surfCamp: legacySurfCamp });
  } catch (error: any) {
    console.error('Update surf camp error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update surf camp' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// DELETE /api/firebase-surfcamps - Delete surf camp
export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Surf camp ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('surf_camps')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to delete surf camp');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete surf camp error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete surf camp' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
