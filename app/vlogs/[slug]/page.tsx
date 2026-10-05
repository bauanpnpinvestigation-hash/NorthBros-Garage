'use client';

import React, { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/components/shared/StoreProvider';
import { PartCard } from '@/components/parts/PartCard';
import { formatDate, formatNumber } from '@/lib/utils/format';
import {
  getFacebookEmbedUrl,
  getYouTubeEmbedUrl,
  isDirectVideoUrl,
  isFacebookVideoUrl,
  resolveDisplayImageUrl,
} from '@/lib/utils/media';
import { Play, Pause, ThumbsUp, MessageSquare, ExternalLink } from 'lucide-react';

export default function VlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { vlogs, parts, likeVlog, addVlogComment, user } = useStore();

  const vlog = vlogs.find((v) => v.slug === slug || v.id === slug);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTimestamp, setActiveTimestamp] = useState('00:00');
  const [commentAuthor, setCommentAuthor] = useState(user?.name || '');
  const [commentText, setCommentText] = useState('');

  if (!vlog) {
    return (
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-24 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#141413]">
          Workshop Vlog Episode Not Found
        </h1>
        <Link
          href="/vlogs"
          className="inline-block px-5 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
        >
          Back to Daily Vlogs
        </Link>
      </div>
    );
  }

  const featuredPart = parts.find((p) => p.slug === vlog.featured_part_slug);
  const activeMediaUrl = vlog.video_url || vlog.thumbnail_url;
  const ytEmbed = getYouTubeEmbedUrl(activeMediaUrl, true);
  const fbEmbed = isFacebookVideoUrl(activeMediaUrl)
    ? getFacebookEmbedUrl(activeMediaUrl)
    : null;
  const directVideo = isDirectVideoUrl(activeMediaUrl);
  const thumbSrc = resolveDisplayImageUrl(
    vlog.thumbnail_url || vlog.video_url,
    '/images/hero_parts_workshop.jpg'
  );

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addVlogComment(
      vlog.id,
      commentAuthor.trim() || user?.name || 'Workshop Viewer',
      commentText.trim()
    );
    setCommentText('');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-10 space-y-12">
      <nav className="flex items-center gap-2 text-xs text-[#6E6E68]">
        <Link href="/" className="hover:text-[#141413]">
          Home
        </Link>
        <span>/</span>
        <Link href="/vlogs" className="hover:text-[#141413]">
          Daily Workshop Vlogs
        </Link>
        <span>/</span>
        <span className="text-[#141413] font-medium truncate max-w-xs">
          Episode #{vlog.episode_number}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#141413] rounded-xl overflow-hidden border border-[#E5E5E0] text-white">
            <div className="relative aspect-[16/9] w-full bg-black">
              {ytEmbed ? (
                <iframe
                  src={ytEmbed}
                  title={vlog.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : fbEmbed ? (
                <iframe
                  src={fbEmbed}
                  title={vlog.title}
                  className="w-full h-full"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : directVideo ? (
                <video
                  src={activeMediaUrl}
                  poster={thumbSrc}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  {thumbSrc.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumbSrc}
                      alt={vlog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={thumbSrc}
                      alt={vlog.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      referrerPolicy="no-referrer"
                      className={`object-cover transition-opacity duration-300 ${
                        isPlaying ? 'opacity-90' : 'opacity-95'
                      }`}
                    />
                  )}
                  {vlog.video_highlights && vlog.video_highlights.length > 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <button
                        type="button"
                        onClick={() => setIsPlaying((prev) => !prev)}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                      >
                        <span className="w-16 h-16 rounded-full bg-white text-[#141413] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                          {isPlaying ? (
                            <Pause className="w-6 h-6 fill-current" />
                          ) : (
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          )}
                        </span>
                        <span className="px-3 py-1 bg-black/75 rounded text-xs font-mono tabular-nums text-neutral-200">
                          {isPlaying
                            ? `Playing Chapter @ ${activeTimestamp}`
                            : `Watch Episode #${vlog.episode_number}`}
                        </span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {vlog.video_url && (
              <div className="px-4 py-2.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                <span className="truncate">Media source: {vlog.video_url}</span>
                <a
                  href={vlog.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-white font-semibold hover:underline shrink-0 ml-3"
                >
                  Open Original Link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {vlog.video_highlights && vlog.video_highlights.length > 0 && (
              <div className="p-4 sm:p-5 bg-neutral-900 border-t border-neutral-800 space-y-3">
                <p className="text-xs font-semibold text-neutral-400">
                  Workshop Chapters:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vlog.video_highlights.map((hl) => (
                    <button
                      key={hl.timestamp}
                      type="button"
                      onClick={() => {
                        setActiveTimestamp(hl.timestamp);
                        setIsPlaying(true);
                      }}
                      className={`text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                        activeTimestamp === hl.timestamp && isPlaying
                          ? 'bg-white text-[#141413] font-semibold'
                          : 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="font-mono tabular-nums shrink-0">
                        {hl.timestamp}
                      </span>
                      <span className="truncate">{hl.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E5E0] pb-5">
              <div className="space-y-1.5">
                <p className="text-xs text-[#6E6E68] tabular-nums">
                  Episode #{vlog.episode_number} · {vlog.category} · Published{' '}
                  {formatDate(vlog.published_at)}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#141413] leading-tight">
                  {vlog.title}
                </h1>
                <p className="text-xs text-[#52524E]">
                  Hosted by <strong>{vlog.author_name}</strong> (
                  {vlog.author_role})
                </p>
              </div>

              <button
                type="button"
                onClick={() => likeVlog(vlog.id)}
                className="px-4 py-2 bg-[#FAF9F6] hover:bg-neutral-200/70 border border-[#E5E5E0] rounded-lg text-xs font-semibold text-[#141413] inline-flex items-center gap-2 font-mono tabular-nums cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                Like ({formatNumber(vlog.likes_count)})
              </button>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-[#141413] leading-relaxed">
              {vlog.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          <section className="bg-white border border-[#E5E5E0] rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#141413]" />
              <h2 className="font-display text-lg font-bold text-[#141413]">
                Tech Questions & Comments ({vlog.comments.length})
              </h2>
            </div>

            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                  placeholder="Your Name"
                  className="px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask about part fitment, torque specs, or service booking..."
                  className="sm:col-span-2 px-3 py-2 text-sm bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#141413] text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Post Comment
                </button>
              </div>
            </form>

            <div className="space-y-4 pt-2 border-t border-[#E5E5E0]">
              {vlog.comments.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-[#FAF9F6] border border-[#E5E5E0] rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between text-xs text-[#6E6E68]">
                    <span className="font-semibold text-[#141413]">
                      {c.user_name}
                    </span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-[#52524E]">{c.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          {featuredPart && (
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-800">
                  Shop the Part from This Episode
                </p>
                <h2 className="font-display text-lg font-bold text-[#141413]">
                  Installed in Episode #{vlog.episode_number}
                </h2>
              </div>
              <PartCard part={featuredPart} />
            </div>
          )}

          {vlog.featured_service_slug && (
            <div className="bg-white border border-[#E5E5E0] rounded-xl p-6 space-y-3">
              <h3 className="font-display text-base font-bold text-[#141413]">
                Book This Service Package
              </h3>
              <p className="text-xs text-[#52524E]">
                Want our technicians to perform this exact service on your
                vehicle?
              </p>
              <Link
                href={`/services/${vlog.featured_service_slug}`}
                className="inline-block px-4 py-2.5 bg-[#141413] text-white text-xs font-semibold rounded-lg"
              >
                Book Service Bay Appointment →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
