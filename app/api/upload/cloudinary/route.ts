import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

type UploadModule =
  | 'branding'
  | 'products'
  | 'services'
  | 'vehicles'
  | 'brands'
  | 'categories'
  | 'avatars'
  | 'daily-shop'
  | 'other';

const VALID_MODULES = new Set<UploadModule>([
  'branding',
  'products',
  'services',
  'vehicles',
  'brands',
  'categories',
  'avatars',
  'daily-shop',
  'other',
]);

function asUploadModule(value: FormDataEntryValue | null): UploadModule {
  const module = String(value || '').trim() as UploadModule;
  return VALID_MODULES.has(module) ? module : 'other';
}

function cleanEnvValue(raw?: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const keyPart = trimmed.slice(0, idx).trim();
    const valPart = trimmed.slice(idx + 1).trim();
    if (/^[a-zA-Z0-9_]+$/.test(keyPart) && valPart) {
      return valPart;
    }
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { configured: false, error: 'No file provided.' },
        { status: 400 }
      );
    }

    const module = asUploadModule(formData.get('module'));
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { configured: false, error: 'Only image and video files are supported.' },
        { status: 400 }
      );
    }

    const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          configured: false,
          error: isVideo
            ? 'Video is too large. Maximum size is 100 MB.'
            : 'Image is too large. Maximum size is 10 MB.',
        },
        { status: 400 }
      );
    }

    const cloudName = cleanEnvValue(
      process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    );
    const uploadPreset = cleanEnvValue(
      process.env.CLOUDINARY_UPLOAD_PRESET ||
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    );
    const apiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
    const apiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);

    if (!cloudName) {
      return NextResponse.json(
        {
          configured: false,
          error: 'Cloudinary cloud name is not configured.',
        },
        { status: 503 }
      );
    }

    const resourceType = isVideo ? 'video' : 'image';
    const folder = `NorthBros Garage/${module}`;
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      cloudName
    )}/${resourceType}/upload`;

    const uploadForm = new FormData();
    uploadForm.append('file', file);

    if (apiKey && apiSecret) {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto
        .createHash('sha1')
        .update(paramsToSign)
        .digest('hex');

      uploadForm.append('api_key', apiKey);
      uploadForm.append('timestamp', timestamp);
      uploadForm.append('signature', signature);
      uploadForm.append('folder', folder);
    } else if (uploadPreset) {
      uploadForm.append('upload_preset', uploadPreset);
      uploadForm.append('folder', folder);
    } else {
      return NextResponse.json(
        {
          configured: false,
          error: 'Cloudinary upload preset or API credentials are required.',
        },
        { status: 503 }
      );
    }

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: uploadForm,
    });

    const data = await response.json();

    if (!response.ok || !data?.secure_url) {
      return NextResponse.json(
        {
          configured: true,
          error:
            data?.error?.message ||
            'Cloudinary upload failed. Please check the configured preset and Cloudinary settings.',
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
      folder,
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : 'Unexpected upload error.',
      },
      { status: 500 }
    );
  }
}
