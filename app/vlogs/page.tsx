'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '@/components/shared/StoreProvider';
import { formatDate, formatNumber, formatPHP, slugify } from '@/lib/utils/format';
import { Play, Plus, X, ThumbsUp } from 'lucide-react';

export default function VlogsPage() {
  const { vlogs, parts, addVlog } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<
    | 'Service Bay Vlog'
    | 'Part Install Guide'
    | 'Dyno & Diagnostics'
    | 'Tool & Part Review'
  >('Service Bay Vlog');
  const [duration, setDuration] = useState('15:20');
  const [authorName, setAuthorName] = useState('Marco Villanueva');
  const [featuredPartSlug, setFeaturedPartSlug] = useState(
    parts[0]?.slug || ''
  );
  const [summary, setSummary] = useState('');
  const [bodyParagraph, setBodyParagraph] = useState('');

  const filteredVlogs =
    selectedCategory === 'all'
      ? vlogs
      : vlogs.filter((v) => v.category === selectedCategory);

  const handleCreateVlog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const linkedPart = parts.find((p) => p.slug === featuredPartSlug);
    const nextEpNumber =
      vlogs.reduce((max, v) => Math.max(max, v.episode_number), 0) + 1;

    addVlog({
      slug: `ep-${nextEpNumber}-${slugify(title)}`,
      episode_number: nextEpNumber,
      title: title.trim(),
      published_at: new Date().toISOString().split('T')[0],
      duration: duration.trim() || '14:30',
      author_name: authorName.trim() || 'Marco Villanueva',
      author_role: 'Master Technician & Founder',
      category,
      summary: summary.trim(),
      content: bodyParagraph.trim()
        ? bodyParagraph.trim().split('\n\n')
        : [summary.trim()],
      thumbnail_url:
        linkedPart?.primary_image || '/images/hero_parts_workshop.jpg',
      video_highlights: [
        { timestamp: '00:00', label: 'Morning service bay diagnostic & unboxing' },
        { timestamp: '05:15', label: 'Step-by-step installation & torque specs' },
        { timestamp: '11:30', label: 'Post-installation road test & scan check' },
      ],
      featured_part_slug: linkedPart?.slug,
      featured_part_name: linkedPart?.name,
      featured_part_price: linkedPart?.price,
    });

    setTitle('');
    setSummary('');
    setBodyParagraph('');
    setShowPublishModal(false);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-12 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E5E0]">
        <div className="space-y-2">
          <p className="text-xs font-medium text-red-800">
            Apex Workshop Daily Series · Part Installations, PMS & Diagnostics
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#141413] tracking-tight">
            Daily Service Bay Vlog & Install Guides
          </h1>
          <p className="text-sm text-[#6E6E68] max-w-2xl">
            Watch our technicians unbox genuine car parts, demonstrate proper
            torque specifications, and perform daily maintenance jobs in our
            BGC workshop.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPublishModal(true)}
          className="px-5 py-2.5 bg-[#141413] hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Post Today’s Workshop Vlog
        </button>
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
        {filteredVlogs.map((vlog) => (
          <article
            key={vlog.id}
            className="bg-white border border-[#E5E5E0] rounded-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <Link
                href={`/vlogs/${vlog.slug}`}
                className="relative aspect-[16/9] w-full bg-[#141413] block group overflow-hidden"
              >
                <Image
                  src={vlog.thumbnail_url}
                  alt={vlog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  referrerPolicy="no-referrer"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-xs font-mono tabular-nums text-neutral-200">
                    Episode #{vlog.episode_number} · {vlog.duration}
                  </span>
                  <span className="w-10 h-10 rounded-full bg-white text-[#141413] flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </span>
                </div>
              </Link>

              <div className="p-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E68] tabular-nums">
                  <span>{vlog.category}</span>
                  <span>·</span>
                  <span>{formatDate(vlog.published_at)}</span>
                  <span>·</span>
                  <span>{vlog.author_name}</span>
                  <span>·</span>
                  <span>{formatNumber(vlog.views_count)} views</span>
                </div>

                <Link href={`/vlogs/${vlog.slug}`} className="block">
                  <h2 className="font-display text-xl font-bold text-[#141413] hover:text-red-800 transition-colors leading-snug">
                    {vlog.title}
                  </h2>
                </Link>

                <p className="text-sm text-[#52524E] leading-relaxed">
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
                      ({formatPHP(vlog.featured_part_price)})
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
                  Watch & Shop Part →
                </Link>
              </div>
            </div>
          </article>
        ))}
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
                  Post New Daily Workshop Vlog
                </h2>
                <p className="text-xs text-[#6E6E68]">
                  Share today&apos;s part installation or service bay episode.
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

            <form onSubmit={handleCreateVlog} className="space-y-4">
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

              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1">
                  Featured Part Used in Episode
                </label>
                <select
                  value={featuredPartSlug}
                  onChange={(e) => setFeaturedPartSlug(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name} ({p.sku} — {formatPHP(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#141413] mb-1">
                  Summary
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
                  Detailed Workshop Notes
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
                  className="px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Publish Episode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
