/**
 * Cloudinary URL helpers — responsive transforms for LCP banners and product cards.
 */

export const CLOUDINARY_CLOUD_NAME =
  (typeof process !== 'undefined' && process.env.REACT_APP_CLOUDINARY_CLOUD_NAME) ||
  'db05hw4ri';

const UPLOAD_SEGMENT = '/upload/';

export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com');
}

/**
 * Extract public_id from a Cloudinary delivery URL.
 * @param {string} url
 * @returns {string|null}
 */
export function extractCloudinaryPublicId(url) {
  if (!isCloudinaryUrl(url)) return null;
  try {
    const afterUpload = url.split(UPLOAD_SEGMENT)[1];
    if (!afterUpload) return null;
    const parts = afterUpload.split('/');
    let i = 0;
    if (/^v\d+$/.test(parts[0])) i = 1;
    if (parts[i] && (parts[i].includes(',') || parts[i].startsWith('f_'))) i += 1;
    const rest = parts.slice(i).join('/');
    return rest.replace(/\.[a-z0-9]+$/i, '') || null;
  } catch {
    return null;
  }
}

/**
 * @param {string} publicIdOrUrl — public_id or full Cloudinary URL
 * @param {{ width?: number, quality?: string|number, crop?: string }} [options]
 */
export function buildCloudinaryImageUrl(publicIdOrUrl, options = {}) {
  const { width, quality = 'auto', crop = 'limit' } = options;
  const cloud = String(CLOUDINARY_CLOUD_NAME || '').trim();
  if (!cloud || !publicIdOrUrl) {
    return typeof publicIdOrUrl === 'string' ? publicIdOrUrl : '';
  }

  let publicId = String(publicIdOrUrl).trim();
  if (isCloudinaryUrl(publicId)) {
    const extracted = extractCloudinaryPublicId(publicId);
    if (!extracted) return publicId;
    publicId = extracted;
  }

  publicId = publicId.replace(/^\/+/, '');
  const transforms = ['f_auto', `q_${quality}`, `c_${crop}`];
  if (width) transforms.push(`w_${Math.round(width)}`);

  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms.join(',')}/${publicId}`;
}

/**
 * @param {string} publicIdOrUrl
 * @param {number[]} [widths]
 */
export function buildCloudinarySrcSet(publicIdOrUrl, widths = [400, 600, 1200, 1920]) {
  return widths
    .map((w) => `${buildCloudinaryImageUrl(publicIdOrUrl, { width: w })} ${w}w`)
    .join(', ');
}

/**
 * Re-apply width transform on an existing Cloudinary URL (replaces prior w_*).
 * @param {string} url
 * @param {number} width
 */
export function resizeCloudinaryUrl(url, width = 400, quality = 'auto') {
  if (!url || !isCloudinaryUrl(url)) return url;
  const publicId = extractCloudinaryPublicId(url);
  if (!publicId) return url;
  return buildCloudinaryImageUrl(publicId, { width, quality });
}
