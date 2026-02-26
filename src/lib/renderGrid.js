import { createMediaNode, getAngleMedia, pickPrimaryAngle } from './media.js';

export function renderGrid({ grid, items, onOpen, cardCache }) {
  const cache = cardCache ?? new Map();

  if (!items.length) {
    grid.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.innerHTML = '<span>Sin resultados</span><p>Proba otra combinacion de filtros.</p>';
    grid.appendChild(empty);
    return [];
  }

  const videos = [];
  const nextSlugs = new Set(items.map((ex) => ex.slug));
  const fragment = document.createDocumentFragment();

  for (const ex of items) {
    let refs = cache.get(ex.slug);
    if (!refs) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.addEventListener('click', () => {
        if (card.__exercise) onOpen(card.__exercise);
      });

      const angle = pickPrimaryAngle(ex);
      const media = angle ? getAngleMedia(ex, angle) : null;
      const mediaNode = createMediaNode(media, ex.name);
      mediaNode.classList.add('card-media');
      card.appendChild(mediaNode);

      const overlay = document.createElement('div');
      overlay.className = 'card-overlay';
      card.appendChild(overlay);

      refs = { card, mediaNode, overlay };
      cache.set(ex.slug, refs);
    }

    refs.card.__exercise = ex;
    refs.overlay.innerHTML = `
      <strong>${escapeHtml(ex.name)}</strong>
      <small>${escapeHtml([ex.group, ex.muscle, ex.equipment, ex.difficulty].filter(Boolean).join(' · '))}</small>
    `;
    fragment.appendChild(refs.card);

    if (refs.mediaNode.tagName === 'VIDEO') videos.push(refs.mediaNode);
  }

  Array.from(grid.children).forEach((child) => {
    if (child.classList?.contains('no-results')) child.remove();
  });
  grid.replaceChildren(fragment);

  for (const [slug, refs] of cache.entries()) {
    if (!nextSlugs.has(slug) && refs.card.isConnected) refs.card.remove();
  }

  return videos;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
