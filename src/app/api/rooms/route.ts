import { NextRequest, NextResponse } from 'next/server';
import { roomsAPI } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/rooms - Get all rooms
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const rooms = await roomsAPI.getAll();
    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rooms' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
