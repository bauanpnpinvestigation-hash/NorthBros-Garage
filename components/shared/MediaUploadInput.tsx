'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import {
  getFacebookEmbedUrl,
  getYouTubeEmbedUrl,
  getYouTubeId,
  isDirectVideoUrl,
  isFacebookVideoUrl,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';

type CloudinaryModule =
  | 'branding'
  | 'products'
  | 'services'
  | 'vehicles'
  | 'brands'
  | 'categories'
  | 'avatars'
  | 'daily-shop'
  | 'other';

type UploadBucket =
  | 'product-images'
  | 'service-images'
  | 'daily-shop'
  | 'vehicle-images'
  | 'avatars';

interface MediaUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  acceptVideo?: boolean;
  bucket?: UploadBucket;
  cloudinaryFolder?: CloudinaryModule;
  helperText?: string;
  presets?: Array<{ label: string; url: string }>;
}

const BUCKET_MODULE: Record<UploadBucket, CloudinaryModule> = {
  'product-images': 'products',
  'service-images': 'services',
  'daily-shop': 'daily-shop',
  'vehicle-images': 'vehicles',
  avatars: 'avatars',
};

export function MediaUploadInput({
  label,
  value,
  onChange,
  placeholder = 'Paste Cloudinary, Facebook, YouTube, or direct image/video link…',
  acceptVideo = false,
  bucket = 'product-images',
  cloudinaryFolder,
  helperText,
  presets,
}: MediaUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('');
    setUploadError('');

    try {
      const isVideo = file.type.startsWith('video/');
      const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

      if (file.size > maxBytes) {
        throw new Error(
          isVideo
            ? 'Video is too large. Maximum size is 100 MB.'
            : 'Image is too large. Maximum size is 10 MB.'
        );
      }

      const form = new FormData();
      form.append('file', file);
      form.append('module', cloudinaryFolder || BUCKET_MODULE[bucket]);

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: form,
      });

      const data = await response.json();

      if (!response.ok || !data?.url) {
        throw new Error(data?.error || 'Cloudinary upload failed.');
      }

      onChange(data.url);
      setUploadStatus(`Uploaded to ${data.folder || 'Cloudinary'}.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unable to upload file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const ytEmbed = getYouTubeEmbedUrl(value, false);
  const fbEmbed = isFacebookVideoUrl(value) ? getFacebookEmbedUrl(value) : null;
  const directVideo = isDirectVideoUrl(value);
  const previewImageUrl = resolveDisplayImageUrl(value, '');

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-[#141413]">{label}</label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-3.5 h-3.5 text-[#6E6E68] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setUploadStatus('');
              setUploadError('');
            }}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptVideo ? 'image/*,video/*' : 'image/*'}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 bg-[#141413] hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              {acceptVideo ? 'Upload Photo / Video' : 'Upload Photo'}
            </>
          )}
        </button>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-[#6E6E68]">Quick presets:</span>
          {presets.map((preset) => (
            <button
              key={preset.url}
              type="button"
              onClick={() => onChange(preset.url)}
              className={`px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                value === preset.url
                  ? 'bg-[#141413] text-white border-[#141413]'
                  : 'bg-[#FAF9F6] text-[#52524E] border-[#E5E5E0] hover:border-[#141413]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="text-[11px] text-[#6E6E68]">{helperText}</p>}
      {uploadStatus && (
        <p className="text-[11px] text-emerald-700 font-medium">✓ {uploadStatus}</p>
      )}
      {uploadError && (
        <p className="text-[11px] text-red-700 font-medium">{uploadError}</p>
      )}

      {value && value.trim() && (
        <div className="pt-1">
          {ytEmbed ? (
            <div className="relative aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border border-[#E5E5E0] bg-black">
              <iframe
                src={ytEmbed}
                title="YouTube video preview"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : fbEmbed ? (
            <div className="relative aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border border-[#E5E5E0] bg-black">
              <iframe
                src={fbEmbed}
                title="Facebook video preview"
                className="w-full h-full"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : directVideo ? (
            <div className="relative aspect-[16/9] w-full max-w-sm rounded-lg overflow-hidden border border-[#E5E5E0] bg-black">
              <video
                src={value.trim()}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : previewImageUrl ? (
            <div className="relative w-36 aspect-[4/3] rounded-lg overflow-hidden border border-[#E5E5E0] bg-[#141413]">
              {previewImageUrl.startsWith('data:') ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Image
                  src={previewImageUrl}
                  alt="Preview"
                  fill
                  sizes="144px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              )}
              {getYouTubeId(value) && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[10px] bg-red-700 text-white rounded font-semibold">
                  YouTube
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
