import {
  buildCloudinaryImageUrl,
  extractCloudinaryPublicId,
  isCloudinaryUrl,
  resizeCloudinaryUrl
} from './cloudinaryImage';

/**
 * Prefer WebP/AVIF-friendly URLs for Unsplash and Cloudinary sources.
 */
export function optimizeImageUrl(url, { width = 400, quality = 'auto' } = {}) {
  if (!url || typeof url !== 'string') return url;
  const u = url.trim();
  if (!u) return u;

  if (u.includes('images.unsplash.com')) {
    try {
      const parsed = new URL(u);
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', parsed.searchParams.get('fit') || 'crop');
      parsed.searchParams.set('q', quality === 'auto' ? '80' : String(quality));
      if (width) parsed.searchParams.set('w', String(width));
      return parsed.toString();
    } catch {
      return u;
    }
  }

  if (isCloudinaryUrl(u)) {
    return resizeCloudinaryUrl(u, width, quality);
  }

  return u;
}

export { buildCloudinaryImageUrl, buildCloudinarySrcSet, extractCloudinaryPublicId, isCloudinaryUrl } from './cloudinaryImage';
