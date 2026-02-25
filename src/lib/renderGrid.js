import { createMediaNode, getAngleMedia, pickPrimaryAngle } from './media.js';

export function renderGrid({ grid, items, onOpen }) {
  grid.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.innerHTML = '<span>Sin resultados</span><p>Proba otra combinacion de filtros.</p>';
    grid.appendChild(empty);
    return [];
  }

  const observers = [];

  for (const ex of items) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.addEventListener('click', () => onOpen(ex));

    const angle = pickPrimaryAngle(ex);
    const media = angle ? getAngleMedia(ex, angle) : null;
    const mediaNode = createMediaNode(media, ex.name);
    mediaNode.classList.add('card-media');
    card.appendChild(mediaNode);

    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <strong>${escapeHtml(ex.name)}</strong>
      <small>${escapeHtml([ex.group, ex.muscle, ex.equipment, ex.difficulty].filter(Boolean).join(' · '))}</small>
    `;
    card.appendChild(overlay);
    grid.appendChild(card);

    if (mediaNode.tagName === 'VIDEO') {
      observers.push(mediaNode);
    }
  }

  return observers;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
