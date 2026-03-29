/**
 * Detect hosted video links vs uploaded files for vendor videoUrl.
 */

/** @typedef {{ kind: 'empty' }} EmptyKind */
/** @typedef {{ kind: 'embed', provider: string, embedSrc: string }} EmbedKind */
/** @typedef {{ kind: 'file' }} FileKind */
/** @typedef {{ kind: 'external', href: string }} ExternalKind */

/**
 * @param {string} [url]
 * @returns {EmptyKind | EmbedKind | FileKind | ExternalKind}
 */
export function getVendorVideoKind(url) {
  const u = (url || '').trim();
  if (!u) return { kind: 'empty' };

  if (u.startsWith('/uploads') || /\.(mp4|webm|mov|ogg)(\?|#|$)/i.test(u)) {
    return { kind: 'file' };
  }

  if (!/^https?:\/\//i.test(u)) {
    return { kind: 'external', href: u.startsWith('//') ? `https:${u}` : `https://${u}` };
  }

  let m = u.match(
    /(?:youtube\.com\/watch\?[^#]*[&?]v=|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (m) {
    return {
      kind: 'embed',
      provider: 'youtube',
      embedSrc: `https://www.youtube.com/embed/${m[1]}`,
    };
  }

  m = u.match(/vimeo\.com\/(?:channels\/[^/]+\/|video\/)?(\d+)/) || u.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (m) {
    return {
      kind: 'embed',
      provider: 'vimeo',
      embedSrc: `https://player.vimeo.com/video/${m[1]}`,
    };
  }

  m = u.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (m) {
    return {
      kind: 'embed',
      provider: 'tiktok',
      embedSrc: `https://www.tiktok.com/embed/v2/${m[1]}`,
    };
  }

  m = u.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/);
  if (m) {
    const code = m[1];
    const isReel = /instagram\.com\/reel\//i.test(u);
    return {
      kind: 'embed',
      provider: 'instagram',
      embedSrc: isReel
        ? `https://www.instagram.com/reel/${code}/embed`
        : `https://www.instagram.com/p/${code}/embed`,
    };
  }

  return { kind: 'external', href: u };
}

/** True when url should use the HTML5 video element (upload path or direct file URL). */
export function isDirectPlayableVideoUrl(url) {
  return getVendorVideoKind(url).kind === 'file';
}

/** True when we can show an inline preview (embed iframe or uploaded file player). */
export function hasVendorVideoPreview(url) {
  const k = getVendorVideoKind(url);
  return k.kind === 'embed' || k.kind === 'file';
}
