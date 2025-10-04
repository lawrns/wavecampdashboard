import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Schema for client profile
const ClientProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone number is required'),
  location: z.string().optional(),
  surfLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  medicalConditions: z.string().optional(),
  notes: z.string().optional(),
});

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
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

    return user;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// GET /api/client/profile - Get client profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Try to get existing profile from client_profiles table
    const { data: profile, error } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching client profile:', error);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // If no profile exists, create a default one from user data
    if (!profile) {
      const defaultProfile = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        location: '',
        surfLevel: 'beginner' as const,
        emergencyContact: '',
        emergencyPhone: '',
        dietaryRestrictions: '',
        medicalConditions: '',
        notes: '',
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at || user.created_at)
      };

      return NextResponse.json({ profile: defaultProfile });
    }

    // Transform Supabase data to match our schema
    const transformedProfile = {
      id: profile.user_id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      location: profile.location || '',
      surfLevel: profile.surf_level || 'beginner',
      emergencyContact: profile.emergency_contact || '',
      emergencyPhone: profile.emergency_phone || '',
      dietaryRestrictions: profile.dietary_restrictions || '',
      medicalConditions: profile.medical_conditions || '',
      notes: profile.notes || '',
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at)
    };

    return NextResponse.json({ profile: transformedProfile });
  } catch (error: any) {
    console.error('Get client profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT /api/client/profile - Update client profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the profile data
    const validatedProfile = ClientProfileSchema.parse(body);

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('client_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    const profileData = {
      user_id: user.id,
      name: validatedProfile.name,
      email: validatedProfile.email,
      phone: validatedProfile.phone,
      location: validatedProfile.location,
      surf_level: validatedProfile.surfLevel,
      emergency_contact: validatedProfile.emergencyContact,
      emergency_phone: validatedProfile.emergencyPhone,
      dietary_restrictions: validatedProfile.dietaryRestrictions,
      medical_conditions: validatedProfile.medicalConditions,
      notes: validatedProfile.notes,
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('client_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();
      
      result = { data, error };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('client_profiles')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      result = { data, error };
    }

    if (result.error) {
      console.error('Error saving client profile:', result.error);
      return NextResponse.json(
        { error: 'Failed to save profile' },
        { status: 500 }
      );
    }

    // Transform the response
    const transformedProfile = {
      id: result.data.user_id,
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone || '',
      location: result.data.location || '',
      surfLevel: result.data.surf_level || 'beginner',
      emergencyContact: result.data.emergency_contact || '',
      emergencyPhone: result.data.emergency_phone || '',
      dietaryRestrictions: result.data.dietary_restrictions || '',
      medicalConditions: result.data.medical_conditions || '',
      notes: result.data.notes || '',
      createdAt: new Date(result.data.created_at),
      updatedAt: new Date(result.data.updated_at)
    };

    return NextResponse.json({ profile: transformedProfile });
  } catch (error: any) {
    console.error('Update client profile error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/client/profile - Delete client profile (for GDPR compliance)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Delete the client profile
    const { error } = await supabase
      .from('client_profiles')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting client profile:', error);
      return NextResponse.json(
        { error: 'Failed to delete profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete client profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
