import { getAngleMedia, isVideoMedia } from './media.js';

export function createLightbox(onNavigate) {
  const root = document.createElement('div');
  root.className = 'lightbox';
  root.innerHTML = `
    <div class="lightbox-shell" role="dialog" aria-modal="true" aria-label="Detalle de ejercicio">
      <button class="lb-close" type="button" aria-label="Cerrar">×</button>
      <button class="lb-nav lb-prev" type="button" aria-label="Anterior">‹</button>
      <button class="lb-nav lb-next" type="button" aria-label="Siguiente">›</button>
      <div class="lb-main">
        <div class="lb-stage-grid"></div>
        <div class="lb-meta">
          <div class="lb-title-row">
            <h2 class="lb-title"></h2>
          </div>
          <div class="lb-tags"></div>
        </div>
      </div>
    </div>
  `;

  const stageGrid = root.querySelector('.lb-stage-grid');
  const title = root.querySelector('.lb-title');
  const tags = root.querySelector('.lb-tags');
  let wheelLockUntil = 0;
  let touchStartY = null;
  let touchStartX = null;

  root.querySelector('.lb-close').addEventListener('click', close);
  root.querySelector('.lb-prev').addEventListener('click', () => onNavigate(-1));
  root.querySelector('.lb-next').addEventListener('click', () => onNavigate(1));
  root.addEventListener('click', (e) => {
    if (e.target === root) close();
  });
  stageGrid.addEventListener('wheel', (e) => {
    if (!isOpen()) return;
    if (Math.abs(e.deltaY) < 25 || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const now = Date.now();
    if (now < wheelLockUntil) return;
    wheelLockUntil = now + 450;
    e.preventDefault();
    onNavigate(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  stageGrid.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    touchStartY = touch.clientY;
    touchStartX = touch.clientX;
  }, { passive: true });
  stageGrid.addEventListener('touchend', (e) => {
    if (!isOpen() || touchStartY == null || touchStartX == null) return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dy = touch.clientY - touchStartY;
    const dx = touch.clientX - touchStartX;
    touchStartY = null;
    touchStartX = null;
    if (Math.abs(dy) < 50 || Math.abs(dy) < Math.abs(dx)) return;
    onNavigate(dy < 0 ? 1 : -1);
  }, { passive: true });

  let current = null;
  function open(ex) {
    current = ex;
    root.classList.add('open');
    document.body.classList.add('no-scroll');
    render();
  }

  function render() {
    if (!current) return;
    title.textContent = current.name || 'Ejercicio';
    tags.innerHTML = [current.group, current.muscle, current.equipment, current.difficulty]
      .filter(Boolean)
      .map((t) => `<span>${escapeHtml(t)}</span>`)
      .join('');

    stageGrid.innerHTML = '';
    for (const angle of ['front', 'side']) {
      const media = getAngleMedia(current, angle);
      if (!media) continue;
      const panel = document.createElement('section');
      panel.className = 'lb-panel';

      const label = document.createElement('div');
      label.className = 'lb-panel-label';
      label.textContent = angle === 'front' ? 'Frente' : 'Lado';
      panel.appendChild(label);

      panel.appendChild(renderMedia(current, media));
      stageGrid.appendChild(panel);
    }
  }

  function close() {
    root.classList.remove('open');
    document.body.classList.remove('no-scroll');
    touchStartY = null;
    touchStartX = null;
    root.querySelectorAll('video').forEach((video) => video.pause());
  }

  function isOpen() {
    return root.classList.contains('open');
  }

  return { root, open, close, isOpen };
}

function renderMedia(exercise, media) {
  if (isVideoMedia(media)) {
    const video = document.createElement('video');
    video.className = 'lb-video';
    video.controls = false;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.disablePictureInPicture = true;
    video.controlsList = 'nodownload noplaybackrate noremoteplayback nofullscreen';
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
    if (!media.webm && !media.mp4 && media.src) video.src = media.src;
    return video;
  }

  const img = document.createElement('img');
  img.className = 'lb-img';
  img.src = media.poster || media.image || media.src || '';
  img.alt = exercise.name || '';
  return img;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
