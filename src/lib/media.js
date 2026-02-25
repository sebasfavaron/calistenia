export function pickPrimaryAngle(ex) {
  return ex?.media?.front ? 'front' : ex?.media?.side ? 'side' : null;
}

export function getAngleMedia(ex, angle) {
  return ex?.media?.[angle] ?? null;
}

export function isVideoMedia(media) {
  return Boolean(media && (media.webm || media.mp4 || media.src));
}

export function createMediaNode(media, alt = '') {
  if (!media) {
    const fallback = document.createElement('div');
    fallback.className = 'media-fallback';
    fallback.textContent = 'Sin media';
    return fallback;
  }

  if (isVideoMedia(media)) {
    const video = document.createElement('video');
    video.className = 'card-media';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = false;
    video.preload = 'none';
    if (media.poster) video.poster = media.poster;

    if (media.webm) {
      const s = document.createElement('source');
      s.src = media.webm;
      s.type = 'video/webm';
      video.appendChild(s);
    }
    if (media.mp4) {
      const s = document.createElement('source');
      s.src = media.mp4;
      s.type = 'video/mp4';
      video.appendChild(s);
    }
    if (!media.webm && !media.mp4 && media.src) {
      video.src = media.src;
    }
    video.setAttribute('aria-label', alt);
    return video;
  }

  const img = document.createElement('img');
  img.className = 'card-media';
  img.loading = 'lazy';
  img.src = media.poster || media.image || media.src || '';
  img.alt = alt;
  return img;
}
