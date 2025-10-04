import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // Only allow admin users
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to check against an admins table)
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Execute the migration SQL directly
    const migrationSQL = `
      -- Add socials column if it doesn't exist
      ALTER TABLE public.clients
        ADD COLUMN IF NOT EXISTS socials JSONB NOT NULL DEFAULT '{}'::jsonb;

      -- Add comment for documentation
      COMMENT ON COLUMN public.clients.socials IS 'Social media profiles stored as JSONB object with keys like instagram, facebook, twitter';
    `;

    // Use raw SQL execution through Supabase
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('Migration error:', error);
      return NextResponse.json({
        error: 'Migration failed',
        details: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Socials column migration completed successfully'
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
