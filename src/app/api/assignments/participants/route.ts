import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic';

function createSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekId = searchParams.get('weekId')

    if (!weekId) {
      return NextResponse.json({ error: 'Week ID is required' }, { status: 400 })
    }

    console.log('Fetching participants for week:', weekId)

    const supabase = createSupabase();
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch bookings for the specific surf camp week
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, items, client_ids')
      .eq('payment_status', 'confirmed');

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
    }

    // Extract participants from bookings that match the surf camp week
    const participants: any[] = [];

    for (const booking of bookings || []) {
      const items = booking.items || [];

      for (const item of items) {
        // Check if this item is for the requested surf camp week
        if (item.type === 'surf_camp' && item.surf_camp_id === weekId) {
          const itemParticipants = item.participants || [];

          for (const participant of itemParticipants) {
            participants.push({
              id: `${booking.id}-${participant.name.replace(/\s+/g, '-').toLowerCase()}`,
              name: participant.name,
              email: participant.email,
              skillLevel: participant.skill_level || 'beginner',
              dietaryRestrictions: participant.dietary_restrictions || 'none',
              bookingId: booking.id,
              surfCampId: weekId
            });
          }
        }
      }
    }

    console.log(`Found ${participants.length} participants for week ${weekId}`);
    return NextResponse.json(participants);

  } catch (error) {
    console.error('Error in participants API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
