'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import {
  getFacebookEmbedUrl,
  getYouTubeEmbedUrl,
  isDirectVideoUrl,
  isFacebookVideoUrl,
  getYouTubeId,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
import { Upload, Link as LinkIcon, Settings2, Check, Loader2 } from 'lucide-react';

interface MediaUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  acceptVideo?: boolean;
  bucket?: 'product-images' | 'service-images' | 'daily-shop';
  helperText?: string;
  presets?: Array<{ label: string; url: string }>;
}

const CLOUDINARY_STORAGE_KEY = 'nb_cloudinary_config';

function readCloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  if (typeof window === 'undefined') {
    return {
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
      uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
    };
  }
  try {
    const raw = window.localStorage.getItem(CLOUDINARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        cloudName:
          parsed.cloudName ||
          process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
          '',
        uploadPreset:
          parsed.uploadPreset ||
          process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
          '',
      };
    }
  } catch {
    // ignore
  }
  return {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
  };
}

async function compressImageToDataUrl(file: File, maxWidth = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      if (!file.type.startsWith('image/')) {
        resolve(String(reader.result || ''));
        return;
      }
      const img = new window.Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function MediaUploadInput({
  label,
  value,
  onChange,
  placeholder = 'Paste Cloudinary, Facebook, YouTube, or direct image/video link…',
  acceptVideo = false,
  bucket = 'product-images',
  helperText,
  presets,
}: MediaUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    const cfg = readCloudinaryConfig();
    setCloudName(cfg.cloudName);
    setUploadPreset(cfg.uploadPreset);
  }, []);

  const handleSaveCloudinaryConfig = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        CLOUDINARY_STORAGE_KEY,
        JSON.stringify({
          cloudName: cloudName.trim(),
          uploadPreset: uploadPreset.trim(),
        })
      );
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadStatus('Uploading media…');

    try {
      const cfg = readCloudinaryConfig();
      const activeCloudName = cloudName.trim() || cfg.cloudName;
      const activePreset = uploadPreset.trim() || cfg.uploadPreset;

      // 1. Try Cloudinary first (either direct unsigned upload or via /api/upload/cloudinary)
      if (activeCloudName && activePreset) {
        const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', activePreset);
        form.append('folder', 'northbros-garage');

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(
            activeCloudName
          )}/${resourceType}/upload`,
          {
            method: 'POST',
            body: form,
          }
        );
        const data = await res.json();
        if (res.ok && data?.secure_url) {
          onChange(data.secure_url);
          setUploadStatus('Uploaded to Cloudinary!');
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
      }

      // Try server-side Cloudinary route in case server env vars are set
      const serverForm = new FormData();
      serverForm.append('file', file);
      if (activeCloudName) serverForm.append('cloudName', activeCloudName);
      if (activePreset) serverForm.append('uploadPreset', activePreset);

      const apiRes = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: serverForm,
      });
      const apiData = await apiRes.json();
      if (apiRes.ok && apiData?.url) {
        onChange(apiData.url);
        setUploadStatus('Uploaded to Cloudinary!');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // 2. Fallback: Upload to Supabase Storage bucket if available
      const supabase = createClient();
      if (supabase) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const safeName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}.${ext}`;
        const storagePath = `uploads/${safeName}`;
        const { error: storageErr } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!storageErr) {
          const {
            data: { publicUrl },
          } = supabase.storage.from(bucket).getPublicUrl(storagePath);
          if (publicUrl) {
            onChange(publicUrl);
            setUploadStatus('Photo uploaded and saved!');
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }
        }
      }

      // 3. Final guaranteed fallback: compressed data URL for images so upload never fails
      if (file.type.startsWith('image/')) {
        const dataUrl = await compressImageToDataUrl(file);
        onChange(dataUrl);
        setUploadStatus('Photo uploaded and ready to save!');
      } else {
        setUploadError(
          apiData?.error ||
            'To upload large video files directly, please configure your Cloudinary Cloud Name & Upload Preset or paste a YouTube / Facebook / Cloudinary video link.'
        );
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to upload file.');
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-[#141413]">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowCloudinaryConfig((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6E6E68] hover:text-[#141413] cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Cloudinary Upload Settings
        </button>
      </div>

      {showCloudinaryConfig && (
        <div className="p-3.5 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-3 text-xs">
          <p className="text-[11px] text-[#52524E]">
            Configure your Cloudinary account for 1-click direct uploads to
            Cloudinary (Unsigned Upload Preset). Settings are saved in your
            browser.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                Cloudinary Cloud Name
              </label>
              <input
                type="text"
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                placeholder="e.g. dxyz12345"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E5E0] rounded"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#141413] mb-1">
                Unsigned Upload Preset
              </label>
              <input
                type="text"
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                placeholder="e.g. ml_default or northbros_unsigned"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#E5E5E0] rounded"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleSaveCloudinaryConfig}
              className="px-3 py-1.5 bg-[#141413] text-white text-[11px] font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
            >
              {configSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Saved
                </>
              ) : (
                'Save Cloudinary Config'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Link Input + Upload File Button */}
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

      {helperText && (
        <p className="text-[11px] text-[#6E6E68]">{helperText}</p>
      )}
      {uploadStatus && (
        <p className="text-[11px] text-emerald-700 font-medium">
          ✓ {uploadStatus}
        </p>
      )}
      {uploadError && (
        <p className="text-[11px] text-red-700 font-medium">{uploadError}</p>
      )}

      {/* Live Media Preview */}
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
