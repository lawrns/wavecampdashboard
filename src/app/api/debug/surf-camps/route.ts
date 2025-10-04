import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint for surf camps API
 * Helps diagnose production issues
 */
export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      WORDPRESS_API_KEY: !!process.env.WORDPRESS_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'missing'
    };

    // Check API key from request
    const apiKey = request.headers.get('X-Heiwa-API-Key');
    const validApiKey = process.env.WORDPRESS_API_KEY || 'heiwa_wp_test_key_2024_secure_deployment';

    const apiKeyCheck = {
      hasApiKeyHeader: !!apiKey,
      apiKeyMatches: apiKey === validApiKey,
      expectedKeyPrefix: validApiKey ? validApiKey.substring(0, 10) + '...' : 'missing',
      receivedKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'missing'
    };

    // Try to create Supabase client
    let supabaseCheck = { canCreate: false, error: null };
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (url && key) {
        const client = createClient(url, key);
        supabaseCheck.canCreate = true;
        
        // Try a simple query
        const { data, error } = await client
          .from('surf_camps')
          .select('id, name')
          .limit(1);
          
        supabaseCheck = {
          ...supabaseCheck,
          querySuccess: !error,
          queryError: error?.message,
          dataCount: data?.length || 0
        };
      } else {
        supabaseCheck.error = 'Missing environment variables';
      }
    } catch (error: any) {
      supabaseCheck.error = error.message;
    }

    return NextResponse.json({
      success: true,
      debug: {
        timestamp: new Date().toISOString(),
        environment: envCheck,
        apiKey: apiKeyCheck,
        supabase: supabaseCheck,
        headers: {
          userAgent: request.headers.get('User-Agent'),
          origin: request.headers.get('Origin'),
          referer: request.headers.get('Referer')
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
