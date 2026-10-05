'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { useAppSettings } from '@/components/shared/AppSettingsProvider';
import { MediaUploadInput } from '@/components/shared/MediaUploadInput';
import {
  formatDate,
  formatNumber,
  formatCurrency,
  slugify,
} from '@/lib/utils/format';
import {
  getYouTubeId,
  isDirectVideoUrl,
  isFacebookVideoUrl,
  isVideoMediaUrl,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
import { VlogPost } from '@/types/database';
import { Play, Plus, X, ThumbsUp, Edit3, Trash2 } from 'lucide-react';

export default function VlogsPage() {
  const { getCurrency } = useAppSettings();
  const { vlogs, parts, addVlog, updateVlog, deleteVlog, user } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [editingVlog, setEditingVlog] = useState<VlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    | 'Service Bay Vlog'
    | 'Part Install Guide'
    | 'Dyno & Diagnostics'
    | 'Tool & Part Review'
  >('Service Bay Vlog');
  const [duration, setDuration] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [featuredPartSlug, setFeaturedPartSlug] = useState(
    parts[0]?.slug || ''
  );
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyParagraph, setBodyParagraph] = useState('');

  const filteredVlogs =
    selectedCategory === 'all'
      ? vlogs
      : vlogs.filter((v) => v.category === selectedCategory);

  const openCreateModal = () => {
    setEditingVlog(null);
    setTitle('');
    setCategory('Service Bay Vlog');
    setDuration('');
    setAuthorName(user?.name || '');
    setFeaturedPartSlug(parts[0]?.slug || '');
    setMediaUrl('');
    setThumbnailUrl('');
    setSummary('');
    setBodyParagraph('');
    setShowPublishModal(true);
  };

  const openEditModal = (vlog: VlogPost) => {
    setEditingVlog(vlog);
    setTitle(vlog.title);
    setCategory(vlog.category);
    setDuration(vlog.duration || '');
    setAuthorName(vlog.author_name || '');
    setFeaturedPartSlug(vlog.featured_part_slug || parts[0]?.slug || '');
    setMediaUrl(vlog.video_url || vlog.thumbnail_url || '');
    setThumbnailUrl(vlog.thumbnail_url || '');
    setSummary(vlog.summary || '');
    setBodyParagraph(vlog.content?.join('\n\n') || vlog.summary || '');
    setShowPublishModal(true);
  };

  const handleSaveVlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    setIsSaving(true);
    try {
      const linkedPart = parts.find((p) => p.slug === featuredPartSlug);
      const nextEpNumber =
        vlogs.reduce((max, v) => Math.max(max, v.episode_number), 0) + 1;

      const trimmedMedia = mediaUrl.trim();
      const trimmedThumb = thumbnailUrl.trim();
      const hasVideo = isVideoMediaUrl(trimmedMedia);

      const resolvedThumb = resolveDisplayImageUrl(
        trimmedThumb || trimmedMedia || linkedPart?.primary_image,
        '/images/hero_parts_workshop.jpg'
      );

      if (editingVlog) {
        await updateVlog(editingVlog.id, {
          title: title.trim(),
          category,
          summary: bodyParagraph.trim() || summary.trim(),
          thumbnail_url: resolvedThumb,
          video_url: hasVideo ? trimmedMedia : undefined,
        });
      } else {
        await addVlog({
          slug: `ep-${nextEpNumber}-${slugify(title)}`,
          episode_number: nextEpNumber,
          title: title.trim(),
          published_at: new Date().toISOString().split('T')[0],
          duration: duration.trim(),
          author_name: authorName.trim() || user?.name || 'Workshop Team',
          author_role: 'Master Technician & Founder',
          category,
          summary: bodyParagraph.trim() || summary.trim(),
          content: bodyParagraph.trim()
            ? bodyParagraph.trim().split('\n\n')
            : [summary.trim()],
          thumbnail_url: resolvedThumb,
          video_url: hasVideo ? trimmedMedia : undefined,
          media_type: hasVideo ? 'video' : 'image',
          video_highlights: [
            {
              timestamp: '00:00',
              label: 'Morning service bay diagnostic & unboxing',
            },
            {
              timestamp: '05:15',
              label: 'Step-by-step installation & torque specs',
            },
            {
              timestamp: '11:30',
              label: 'Post-installation road test & scan check',
            },
          ],
          featured_part_slug: linkedPart?.slug,
          featured_part_name: linkedPart?.name,
          featured_part_price: linkedPart?.price,
        });
      }

      setShowPublishModal(false);
      setEditingVlog(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E0]">
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-800">
            Workshop Daily Series · Part Installations, Service & Diagnostics
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
            Daily Workshop Vlogs & Guides
          </h1>
          <p className="text-sm text-[#6E6E68] max-w-2xl">
            Watch our technicians unbox genuine car parts, demonstrate proper
            torque specifications, and share daily workshop photos & videos via
            YouTube, Facebook, and Cloudinary.
          </p>
        </div>

        {user?.role === 'admin' ? (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post Today’s Workshop Vlog / Photo
          </button>
        ) : !user ? (
          <Link
            href="/auth/login"
            className="px-5 py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            Sign In to Post Vlog
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-neutral-200/70 rounded-lg w-fit">
        {(
          [
            'all',
            'Service Bay Vlog',
            'Part Install Guide',
            'Dyno & Diagnostics',
            'Tool & Part Review',
          ] as const
        ).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-white text-[#141413] font-semibold shadow-xs'
                : 'text-[#52524E] hover:text-[#141413]'
            }`}
          >
            {cat === 'all' ? `All Episodes (${vlogs.length})` : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredVlogs.map((vlog) => {
          const thumbSrc = resolveDisplayImageUrl(
            vlog.thumbnail_url || vlog.video_url,
            '/images/hero_parts_workshop.jpg'
          );
          const sourceLabel = getYouTubeId(vlog.video_url || vlog.thumbnail_url)
            ? 'YouTube Video'
            : isFacebookVideoUrl(vlog.video_url || vlog.thumbnail_url)
            ? 'Facebook Video'
            : isDirectVideoUrl(vlog.video_url || vlog.thumbnail_url)
            ? 'Cloudinary Video'
            : 'Workshop Media';

          return (
            <article
              key={vlog.id}
              className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                <Link
                  href={`/vlogs/${vlog.slug}`}
                  className="relative aspect-[16/9] w-full bg-[#141413] block group overflow-hidden"
                >
                  {thumbSrc.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt={vlog.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={thumbSrc}
                      alt={vlog.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      referrerPolicy="no-referrer"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-3 left-4">
                    <span className="px-2.5 py-1 bg-black/70 text-white text-[11px] font-medium rounded">
                      {sourceLabel}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                    <span className="text-xs font-mono tabular-nums text-neutral-200">
                      Episode #{vlog.episode_number}{' '}
                      {vlog.duration ? `· ${vlog.duration}` : ''}
                    </span>
                    <span className="w-10 h-10 rounded-full bg-white text-[#141413] flex items-center justify-center shadow-md">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </span>
                  </div>
                </Link>

                <div className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6E68] tabular-nums">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>{vlog.category}</span>
                      <span>·</span>
                      <span>{formatDate(vlog.published_at)}</span>
                      <span>·</span>
                      <span>{vlog.author_name}</span>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(vlog)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#141413] hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        {user.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => deleteVlog(vlog.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <Link href={`/vlogs/${vlog.slug}`} className="block">
                    <h2 className="font-display text-xl font-bold text-[#141413] hover:text-red-800 transition-colors leading-snug">
                      {vlog.title}
                    </h2>
                  </Link>

                  <p className="text-sm text-[#52524E] leading-relaxed line-clamp-3">
                    {vlog.summary}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#E5E5E0] flex flex-wrap items-center justify-between gap-3 text-xs">
                {vlog.featured_part_slug ? (
                  <div className="text-[#52524E] truncate max-w-[260px]">
                    Part Used:{' '}
                    <Link
                      href={`/parts/${vlog.featured_part_slug}`}
                      className="font-semibold text-[#141413] hover:underline"
                    >
                      {vlog.featured_part_name}
                    </Link>{' '}
                    {vlog.featured_part_price && (
                      <span className="font-mono tabular-nums">
                        ({formatCurrency(vlog.featured_part_price, getCurrency())})
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[#6E6E68]">Workshop Daily Episode</span>
                )}

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 text-[#6E6E68] tabular-nums">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {formatNumber(vlog.likes_count)}
                  </span>
                  <Link
                    href={`/vlogs/${vlog.slug}`}
                    className="font-semibold text-[#141413] hover:text-red-800"
                  >
                    Watch & View Details →
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {showPublishModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#E5E5E0] rounded-xl max-w-xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E0] pb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-[#141413]">
                  {editingVlog
                    ? 'Edit Daily Workshop Vlog'
                    : 'Post New Daily Workshop Vlog'}
                </h2>
                <p className="text-xs text-[#6E6E68]">
                  Upload a photo/video to Cloudinary or paste a YouTube,
                  Facebook, or Cloudinary link.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="p-1.5 text-[#6E6E68] hover:text-[#141413]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVlog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1">
                  Episode Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Installing NGK Laser Iridium Spark Plugs & Testing Coil Packs"
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
              </div>

              <MediaUploadInput
                label="Video or Photo Link (YouTube, Facebook, Cloudinary) or Upload File"
                value={mediaUrl}
                onChange={(url) => {
                  setMediaUrl(url);
                  if (!thumbnailUrl.trim()) {
                    setThumbnailUrl(resolveDisplayImageUrl(url, ''));
                  }
                }}
                acceptVideo={true}
                bucket="daily-shop"
                placeholder="Paste YouTube, Facebook video, or Cloudinary photo/video link…"
                helperText="Supports YouTube links, Facebook video/reel links, Cloudinary image/video URLs, or direct photo/video upload."
              />

              <MediaUploadInput
                label="Cover Thumbnail Image Link or Upload Photo (Optional)"
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                acceptVideo={false}
                bucket="daily-shop"
                placeholder="Paste Cloudinary, Facebook, or direct thumbnail image URL…"
                helperText="Used as the cover photo on vlog cards. Automatically filled for YouTube & Cloudinary links."
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as
                          | 'Service Bay Vlog'
                          | 'Part Install Guide'
                          | 'Dyno & Diagnostics'
                          | 'Tool & Part Review'
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                  >
                    <option value="Service Bay Vlog">Service Bay Vlog</option>
                    <option value="Part Install Guide">Part Install Guide</option>
                    <option value="Dyno & Diagnostics">Dyno & Diagnostics</option>
                    <option value="Tool & Part Review">Tool & Part Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1">
                    Technician Host
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                  />
                </div>
              </div>

              {parts.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#141413] mb-1">
                    Featured Part Used in Episode (Optional)
                  </label>
                  <select
                    value={featuredPartSlug}
                    onChange={(e) => setFeaturedPartSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                  >
                    <option value="">None</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.slug}>
                        {p.name} ({p.sku} — {formatCurrency(p.price, getCurrency())})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1">
                  Summary / Caption
                </label>
                <textarea
                  rows={2}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1">
                  Detailed Workshop Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={bodyParagraph}
                  onChange={(e) => setBodyParagraph(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#52524E]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#141413] disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  {isSaving
                    ? 'Saving…'
                    : editingVlog
                    ? 'Save Vlog Changes'
                    : 'Publish Episode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
