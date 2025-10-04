import { NextRequest, NextResponse } from 'next/server';
import { addOnsAPI } from '@/lib/supabase-admin';
import { requireAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/add-ons - Get all add-ons
export async function GET(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const addOns = await addOnsAPI.getAll();
    return NextResponse.json({ addOns });
  } catch (error: any) {
    console.error('Get add-ons error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch add-ons' },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
