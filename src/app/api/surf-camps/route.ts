import { NextRequest, NextResponse } from 'next/server';
import { surfCampsAPI } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/surf-camps - Get all surf camps
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const surfCamps = await surfCampsAPI.getAll();
    return NextResponse.json({ surfCamps });
  } catch (error: any) {
    console.error('Get surf camps error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch surf camps' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
