import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    const clientCloudName = String(formData.get('cloudName') || '').trim();
    const clientUploadPreset = String(formData.get('uploadPreset') || '').trim();
    const folder = String(formData.get('folder') || 'northbros-garage').trim();

    const cloudName =
      clientCloudName ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME ||
      '';
    const uploadPreset =
      clientUploadPreset ||
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
      process.env.CLOUDINARY_UPLOAD_PRESET ||
      '';
    const apiKey = process.env.CLOUDINARY_API_KEY || '';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!cloudName) {
      return NextResponse.json(
        {
          configured: false,
          error:
            'Cloudinary cloud name is not configured yet. Using fallback storage.',
        },
        { status: 200 }
      );
    }

    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudName
    )}/${resourceType}/upload`;

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    if (uploadPreset) {
      uploadForm.append('upload_preset', uploadPreset);
      if (folder) uploadForm.append('folder', folder);
    } else if (apiKey && apiSecret) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const paramsToSign = folder
        ? `folder=${folder}&timestamp=${timestamp}${apiSecret}`
        : `timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash('sha1')
        .update(paramsToSign)
        .digest('hex');

      uploadForm.append('api_key', apiKey);
      uploadForm.append('timestamp', timestamp);
      uploadForm.append('signature', signature);
      if (folder) uploadForm.append('folder', folder);
    } else {
      return NextResponse.json(
        {
          configured: false,
          error:
            'Cloudinary upload preset or API key/secret is required for direct Cloudinary upload.',
        },
        { status: 200 }
      );
    }

    const res = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await res.json();
    if (!res.ok || !data.secure_url) {
      return NextResponse.json(
        {
          configured: true,
          error:
            data?.error?.message ||
            'Cloudinary upload failed. Please check your Cloud Name and Upload Preset.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      configured: true,
      url: data.secure_url,
      public_id: data.public_id,
      resource_type: data.resource_type,
      format: data.format,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected upload error.' },
      { status: 500 }
    );
  }
}
