/**
 * Prefer WebP/AVIF-friendly URLs for Unsplash and Cloudinary sources.
 */
export function optimizeImageUrl(url, { width = 800, quality = 80 } = {}) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  if (!u) return u;

  if (u.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(u);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', parsed.searchParams.get('fit') || 'crop');
      parsed.searchParams.set('q', String(quality));
      if (width) parsed.searchParams.set('w', String(width));
      return parsed.toString();
    } catch {
      return u;
    }
  }

  if (u.includes('res.cloudinary.com') && !u.includes('/f_auto')) {
    return u.replace('/upload/', '/upload/f_auto,q_auto,w_' + width + '/');
  }

  return u;
}
