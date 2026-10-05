export function getYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

export function getYouTubeEmbedUrl(url: string | undefined | null, autoplay = false): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}${autoplay ? '?autoplay=1&rel=0' : '?rel=0'}`;
}

export function getYouTubeThumbnailUrl(url: string | undefined | null): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function isFacebookUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return /(?:facebook\.com|fb\.watch|fb\.gg)/i.test(url.trim());
}

export function isFacebookVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/fb\.watch/i.test(trimmed)) return true;
  if (
    /facebook\.com\/(?:.*\/videos\/|watch\/?\?v=|reel\/|share\/v\/|share\/r\/|video\.php)/i.test(
      trimmed
    )
  ) {
    return true;
  }
  return false;
}

export function getFacebookEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!isFacebookUrl(trimmed)) return null;
  if (trimmed.includes('facebook.com/plugins/video.php') || trimmed.includes('facebook.com/plugins/post.php')) {
    return trimmed;
  }
  if (isFacebookVideoUrl(trimmed)) {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      trimmed
    )}&show_text=false&width=734`;
  }
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
    trimmed
  )}&show_text=true&width=500`;
}

export function isDirectVideoUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^data:video\//i.test(trimmed)) return true;
  if (/res\.cloudinary\.com\/[^/]+\/video\/upload\//i.test(trimmed)) return true;
  if (/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(trimmed)) return true;
  return false;
}

export function isVideoMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return Boolean(
    getYouTubeId(url) || isFacebookVideoUrl(url) || isDirectVideoUrl(url)
  );
}

/**
 * Resolves any user-supplied URL (Cloudinary image/video, YouTube video, Facebook link, or direct URL)
 * into a displayable image URL suitable for <Image> or <img>.
 */
export function resolveDisplayImageUrl(
  url: string | undefined | null,
  fallback = '/images/hero_parts_workshop.jpg'
): string {
  if (!url || !url.trim()) return fallback;
  const trimmed = url.trim();

  // 1. If it's a YouTube video link, derive its high-resolution thumbnail
  const ytThumb = getYouTubeThumbnailUrl(trimmed);
  if (ytThumb) return ytThumb;

  // 2. If it's a Cloudinary video link, convert extension to .jpg so Cloudinary serves a video frame thumbnail
  if (/res\.cloudinary\.com\/[^/]+\/video\/upload\//i.test(trimmed)) {
    if (/\.(mp4|webm|mov|mkv|ogg|m4v)(\?.*)?$/i.test(trimmed)) {
      return trimmed.replace(/\.(mp4|webm|mov|mkv|ogg|m4v)(\?.*)?$/i, '.jpg');
    }
    return `${trimmed}.jpg`;
  }

  // 3. If it's a Facebook video or page URL (not a direct fbcdn image), use fallback unless it's a direct image link
  if (isFacebookVideoUrl(trimmed)) {
    return fallback;
  }

  // 4. Direct local path, data URL, or http(s) image link (Cloudinary, fbcdn, Supabase, etc.)
  if (
    trimmed.startsWith('/') ||
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\//i.test(trimmed)
  ) {
    return trimmed;
  }

  return fallback;
}
