import './styles.css';
import { defaultFilters, matchesFilters } from './lib/filters.js';
import { renderGrid } from './lib/renderGrid.js';
import { createLightbox } from './lib/renderLightbox.js';
import { FILTER_CONFIG, GROUP_LABELS, normalizeFilterValues } from './lib/taxonomy.js';

const PAGE_SIZE = 18;

const app = document.getElementById('app');
app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <div class="hero-copy">
        <h1>Banco de Ejercicios</h1>
        <p>Catalogo local, filtros combinables y modal con angulos + pasos.</p>
      </div>
      <div class="hero-stats">
        <strong id="result-count">0</strong>
        <span>ejercicios</span>
      </div>
    </header>

    <section class="filters" id="filters"></section>

    <section class="grid-wrap">
      <div class="grid" id="grid"></div>
      <button class="load-more" id="load-more" type="button">Cargar mas</button>
    </section>
  </div>
`;

const gridEl = document.getElementById('grid');
const filtersEl = document.getElementById('filters');
const countEl = document.getElementById('result-count');
const loadMoreBtn = document.getElementById('load-more');

let manifest = null;
let catalog = [];
let filtered = [];
let page = 1;
let visible = [];
let currentIndex = -1;
const filters = { ...defaultFilters };
const stepsCache = new Map();
let gridVideoObserver = null;

const lightbox = createLightbox((dir) => navigateLightbox(dir));
document.body.appendChild(lightbox.root);

document.addEventListener('keydown', (e) => {
  if (!lightbox.isOpen()) return;
  if (e.key === 'Escape') lightbox.close();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

loadMoreBtn.addEventListener('click', () => {
  page += 1;
  rerenderGrid();
});

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<div class="fatal">No se pudo cargar el catalogo local. ${escapeHtml(error.message)}</div>`;
});

async function init() {
  const res = await fetch('./data/exercises.manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  manifest = await res.json();
  catalog = Array.isArray(manifest.exercises) ? manifest.exercises : [];

  buildFilters(normalizeFilterValues(manifest));
  applyFilters();
}

function buildFilters(values) {
  filtersEl.innerHTML = '';

  const map = {
    group: values.groups,
    muscle: values.muscles,
    equipment: values.equipment,
    difficulty: values.difficulties,
  };

  for (const config of FILTER_CONFIG) {
    const box = document.createElement('section');
    box.className = 'filter-group';

    const title = document.createElement('div');
    title.className = 'filter-group-label';
    title.textContent = config.label;

    for (const value of map[config.key] ?? ['todos']) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill' + ((filters[config.key] ?? 'todos') === value ? ' active' : '');
      btn.dataset.key = config.key;
      btn.dataset.value = value;
      btn.textContent = formatFilterOption(config.key, value);
      btn.addEventListener('click', () => {
        if (filters[config.key] === value) return;
        filters[config.key] = value;
        page = 1;
        buildFilters(values);
        applyFilters();
      });
      box.appendChild(btn);
    }
    box.prepend(title);
    filtersEl.appendChild(box);
  }
}

function formatFilterOption(key, value) {
  if (value === 'todos') return 'Todos';
  if (key === 'group') return GROUP_LABELS[value] ?? value;
  return value;
}

function applyFilters() {
  filtered = catalog.filter((ex) => matchesFilters(ex, filters));
  countEl.textContent = String(filtered.length);
  rerenderGrid();
}

function rerenderGrid() {
  visible = filtered.slice(0, page * PAGE_SIZE);
  const videos = renderGrid({
    grid: gridEl,
    items: visible,
    onOpen: openExercise,
  });
  setupGridVideoObserver(videos);

  loadMoreBtn.style.display = visible.length < filtered.length ? 'inline-flex' : 'none';
}

function setupGridVideoObserver(videos) {
  if (gridVideoObserver) gridVideoObserver.disconnect();
  gridVideoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }, { rootMargin: '200px' });

  videos.forEach((video) => gridVideoObserver.observe(video));
}

async function openExercise(ex) {
  currentIndex = visible.findIndex((item) => item.slug === ex.slug);
  const stepsText = await getStepsText(ex);
  lightbox.open(ex, stepsText);
}

async function navigateLightbox(dir) {
  if (!visible.length) return;
  if (currentIndex < 0) currentIndex = 0;
  currentIndex = (currentIndex + dir + visible.length) % visible.length;
  const ex = visible[currentIndex];
  const stepsText = await getStepsText(ex);
  lightbox.open(ex, stepsText);
}

async function getStepsText(ex) {
  const key = ex.stepsPath || ex.slug;
  if (stepsCache.has(key)) return stepsCache.get(key);

  if (!ex.stepsPath) {
    const fallback = 'Sin pasos';
    stepsCache.set(key, fallback);
    return fallback;
  }

  try {
    const res = await fetch(ex.stepsPath, { cache: 'force-cache' });
    const text = res.ok ? await res.text() : 'Sin pasos';
    stepsCache.set(key, text);
    return text;
  } catch {
    const fallback = 'Sin pasos';
    stepsCache.set(key, fallback);
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
