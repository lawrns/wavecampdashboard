import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth';
import { storageUtils } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const type = formData.get('type') as string; // 'rooms', 'surf-camps', 'add-ons'
    const entityId = formData.get('entityId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (!type || !entityId) {
      return NextResponse.json(
        { error: 'Type and entityId are required' },
        { status: 400 }
      );
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Only image files are allowed' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }
    }

    let uploadedFiles;

    switch (type) {
      case 'rooms':
        uploadedFiles = await storageUtils.uploadRoomImages(files, entityId);
        break;
      case 'surf-camps':
        uploadedFiles = await storageUtils.uploadSurfCampImages(files, entityId);
        break;
      case 'add-ons':
        uploadedFiles = await storageUtils.uploadAddOnImages(files, entityId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdminSession(request);

    const { searchParams } = new URL(request.url);
    const paths = searchParams.get('paths')?.split(',') || [];

    if (!paths || paths.length === 0) {
      return NextResponse.json(
        { error: 'No file paths provided' },
        { status: 400 }
      );
    }

    await storageUtils.deleteRoomImages(paths); // Can use any delete method since they all do the same thing

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Delete failed' },
      { status: 500 }
    );
  }
}
