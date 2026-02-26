import './styles.css';
import { defaultFilters, matchesFilters } from './lib/filters.js';
import { renderGrid } from './lib/renderGrid.js';
import { createLightbox } from './lib/renderLightbox.js';
import { FILTER_CONFIG, localizeTaxonomyValue, normalizeFilterValues } from './lib/taxonomy.js';

const PAGE_SIZE = 18;

const app = document.getElementById('app');
app.innerHTML = `
  <div class="shell">
    <header class="hero">
      <div class="hero-copy">
        <h1>Banco de Ejercicios</h1>
        <p>Tu biblioteca de ejercicios con filtros y demos en video.</p>
      </div>
      <div class="hero-stats">
        <strong id="result-count">0</strong>
        <span>ejercicios</span>
      </div>
    </header>

    <div class="filters-toggle-wrap">
      <button class="filters-toggle" id="filters-toggle" type="button" aria-expanded="false" aria-controls="filters">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
        Filtros
      </button>
    </div>
    <section class="filters" id="filters"></section>

    <section class="grid-wrap">
      <div class="grid" id="grid"></div>
      <button class="load-more" id="load-more" type="button">Cargar mas</button>
    </section>
  </div>
`;

const gridEl = document.getElementById('grid');
const filtersEl = document.getElementById('filters');
const filtersToggleBtn = document.getElementById('filters-toggle');
const countEl = document.getElementById('result-count');
const loadMoreBtn = document.getElementById('load-more');

let manifest = null;
let catalog = [];
let filtered = [];
let page = 1;
let visible = [];
let currentIndex = -1;
const filters = { ...defaultFilters };
const cardCache = new Map();
let gridVideoObserver = null;
let gridVideoWarmObserver = null;
let loadMoreObserver = null;
let autoPagingLocked = false;
let suppressUrlSync = false;

const lightbox = createLightbox((dir) => navigateLightbox(dir));
document.body.appendChild(lightbox.root);

document.addEventListener('keydown', (e) => {
  if (!lightbox.isOpen()) return;
  if (e.key === 'Escape') lightbox.close();
  if (e.key === 'ArrowLeft') navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(1);
});

window.addEventListener('popstate', () => {
  if (!manifest) return;
  const filterValues = normalizeFilterValues(manifest);
  applyFiltersFromUrl(filterValues);
  page = 1;
  buildFilters(filterValues);
  applyFilters();
});

loadMoreBtn.addEventListener('click', () => {
  loadNextPage();
});

filtersToggleBtn.addEventListener('click', () => {
  const nextOpen = !filtersEl.classList.contains('is-open');
  setFiltersPanelOpen(nextOpen);
});

init().catch((error) => {
  console.error(error);
  app.innerHTML = `<div class="fatal">No se pudo cargar el catalogo local. ${escapeHtml(error.message)}</div>`;
});

async function init() {
  const res = await fetch('./data/exercises.manifest.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  manifest = await res.json();
  catalog = Array.isArray(manifest.exercises) ? manifest.exercises.map(normalizeExercisePaths) : [];

  const filterValues = normalizeFilterValues(manifest);
  applyFiltersFromUrl(filterValues);
  buildFilters(filterValues);
  applyFilters();
}

function normalizeExercisePaths(ex) {
  if (!ex || typeof ex !== 'object') return ex;
  const out = { ...ex };
  delete out.stepsPath;

  if (out.media && typeof out.media === 'object') {
    out.media = Object.fromEntries(
      Object.entries(out.media).map(([angle, media]) => [angle, normalizeMediaPaths(media)])
    );
  }

  return out;
}

function normalizeMediaPaths(media) {
  if (!media || typeof media !== 'object') return media;
  const out = { ...media };
  for (const key of ['src', 'mp4', 'webm', 'poster', 'image']) {
    if (out[key]) out[key] = resolveAppUrl(out[key]);
  }
  return out;
}

function resolveAppUrl(value) {
  if (typeof value !== 'string' || !value) return value;
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('data:') || value.startsWith('blob:')) {
    return value;
  }
  const relative = value.startsWith('/') ? value.slice(1) : value;
  return new URL(relative, document.baseURI).href;
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
      btn.className = 'pill' + (isFilterValueSelected(config.key, value) ? ' active' : '');
      btn.dataset.key = config.key;
      btn.dataset.value = value;
      btn.textContent = formatFilterOption(config.key, value);
      btn.addEventListener('click', () => {
        const next = toggleFilterValue(filters[config.key], value);
        if (sameFilterSelection(filters[config.key], next)) return;
        filters[config.key] = next;
        page = 1;
        buildFilters(values);
        applyFilters();
        if (window.matchMedia('(max-width: 760px)').matches) {
          setFiltersPanelOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setFiltersPanelOpen(filtersEl.classList.contains('is-open'));
        }
      });
      box.appendChild(btn);
    }
    box.prepend(title);
    filtersEl.appendChild(box);
  }
}

function isFilterValueSelected(key, value) {
  const selected = Array.isArray(filters[key]) ? filters[key] : [filters[key] ?? 'todos'];
  return selected.includes(value);
}

function toggleFilterValue(current, value) {
  const selected = new Set(Array.isArray(current) ? current : [current ?? 'todos']);

  if (value === 'todos') return ['todos'];

  selected.delete('todos');
  if (selected.has(value)) {
    selected.delete(value);
  } else {
    selected.add(value);
  }

  return selected.size ? [...selected] : ['todos'];
}

function sameFilterSelection(a, b) {
  const aList = Array.isArray(a) ? a : [a ?? 'todos'];
  const bList = Array.isArray(b) ? b : [b ?? 'todos'];
  if (aList.length !== bList.length) return false;
  return aList.every((v, i) => v === bList[i]);
}

function setFiltersPanelOpen(isOpen) {
  filtersEl.classList.toggle('is-open', isOpen);
  filtersToggleBtn.setAttribute('aria-expanded', String(isOpen));
  const activeCount = getActiveFilterCount();
  const badge = activeCount > 0 ? ` (${activeCount})` : '';
  if (isOpen) {
    filtersToggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cerrar`;
  } else {
    filtersToggleBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg> Filtros${badge}`;
  }
}

function getActiveFilterCount() {
  let count = 0;
  for (const config of FILTER_CONFIG) {
    const selected = Array.isArray(filters[config.key]) ? filters[config.key] : [filters[config.key] ?? 'todos'];
    if (!selected.includes('todos')) count += selected.length;
  }
  return count;
}

function formatFilterOption(key, value) {
  return localizeTaxonomyValue(key, value);
}

function applyFilters() {
  filtered = catalog.filter((ex) => matchesFilters(ex, filters));
  countEl.textContent = String(filtered.length);
  syncFiltersToUrl();
  rerenderGrid();
}

function rerenderGrid() {
  visible = filtered.slice(0, page * PAGE_SIZE);
  const videos = renderGrid({
    grid: gridEl,
    items: visible,
    onOpen: openExercise,
    cardCache,
  });
  setupGridVideoObserver(videos);

  const hasMore = visible.length < filtered.length;
  loadMoreBtn.style.display = hasMore ? 'inline-flex' : 'none';
  loadMoreBtn.disabled = !hasMore;
  loadMoreBtn.textContent = hasMore ? 'Cargando mas…' : 'Cargar mas';
  setupInfiniteScroll(hasMore);
}

function setupGridVideoObserver(videos) {
  if (gridVideoObserver) gridVideoObserver.disconnect();
  if (gridVideoWarmObserver) gridVideoWarmObserver.disconnect();

  gridVideoWarmObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      warmGridVideo(entry.target);
    }
  }, { rootMargin: '700px 0px' });

  gridVideoObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target;
      if (entry.isIntersecting) {
        warmGridVideo(video);
        video.dataset.wantPlay = '1';
        playGridVideoIfReady(video);
      } else {
        delete video.dataset.wantPlay;
        video.pause();
      }
    }
  }, { rootMargin: '200px' });

  videos.forEach((video) => {
    bindGridVideoLifecycle(video);
    gridVideoWarmObserver.observe(video);
    gridVideoObserver.observe(video);
  });
}

function bindGridVideoLifecycle(video) {
  if (video.dataset.gridBound === '1') return;
  video.dataset.gridBound = '1';
  video.addEventListener('loadeddata', () => {
    video.classList.add('is-ready');
    if (video.dataset.wantPlay === '1') playGridVideoIfReady(video);
  });
  video.addEventListener('canplay', () => {
    if (video.dataset.wantPlay === '1') playGridVideoIfReady(video);
  });
  video.addEventListener('error', () => {
    video.classList.add('is-error');
  });
}

function warmGridVideo(video) {
  if (!(video instanceof HTMLVideoElement)) return;
  if (video.dataset.warmed === '1') return;
  video.dataset.warmed = '1';
  video.preload = 'metadata';
  try {
    video.load();
  } catch {}
}

function playGridVideoIfReady(video) {
  if (!(video instanceof HTMLVideoElement)) return;
  if (video.readyState < 2) return;
  video.play().catch(() => {});
}

function setupInfiniteScroll(hasMore) {
  if (!('IntersectionObserver' in window)) return;
  if (!loadMoreObserver) {
    loadMoreObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (autoPagingLocked) continue;
        if (visible.length >= filtered.length) continue;
        autoPagingLocked = true;
        loadNextPage();
        requestAnimationFrame(() => {
          autoPagingLocked = false;
        });
      }
    }, { rootMargin: '300px 0px' });
  }

  loadMoreObserver.unobserve(loadMoreBtn);
  if (hasMore) loadMoreObserver.observe(loadMoreBtn);
}

function loadNextPage() {
  if (visible.length >= filtered.length) return;
  page += 1;
  rerenderGrid();
}

function applyFiltersFromUrl(values) {
  suppressUrlSync = true;
  for (const config of FILTER_CONFIG) {
    filters[config.key] = parseFilterParam(config.key, values);
  }
  suppressUrlSync = false;
}

function parseFilterParam(key, values) {
  const allowedMap = {
    group: values.groups,
    muscle: values.muscles,
    equipment: values.equipment,
    difficulty: values.difficulties,
  };
  const allowed = new Set((allowedMap[key] ?? []).map(String));
  const raw = new URL(window.location.href).searchParams.get(key);
  if (!raw) return ['todos'];

  const list = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .filter((v) => allowed.has(v));

  if (!list.length || list.includes('todos')) return ['todos'];
  return [...new Set(list)];
}

function syncFiltersToUrl() {
  if (suppressUrlSync) return;
  const url = new URL(window.location.href);
  let changed = false;

  for (const config of FILTER_CONFIG) {
    const selected = Array.isArray(filters[config.key]) ? filters[config.key] : [filters[config.key] ?? 'todos'];
    const normalized = selected.includes('todos') ? ['todos'] : selected;
    if (normalized.length === 1 && normalized[0] === 'todos') {
      if (url.searchParams.has(config.key)) {
        url.searchParams.delete(config.key);
        changed = true;
      }
      continue;
    }

    const nextValue = normalized.join(',');
    if (url.searchParams.get(config.key) !== nextValue) {
      url.searchParams.set(config.key, nextValue);
      changed = true;
    }
  }

  if (changed) window.history.replaceState(null, '', url);
}

async function openExercise(ex) {
  currentIndex = visible.findIndex((item) => item.slug === ex.slug);
  lightbox.open(ex);
}

function navigateLightbox(dir) {
  if (!visible.length) return;
  if (currentIndex < 0) currentIndex = 0;

  if (dir > 0 && currentIndex >= visible.length - 1 && visible.length < filtered.length) {
    loadNextPage();
    currentIndex += 1;
  } else {
    currentIndex = (currentIndex + dir + visible.length) % visible.length;
  }

  if (currentIndex >= visible.length) currentIndex = visible.length - 1;
  lightbox.open(visible[currentIndex]);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
