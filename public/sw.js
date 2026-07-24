const SHELL_CACHE = 'calistenia-shell-v12';
const RUNTIME_CACHE = 'calistenia-runtime-v1';
const APP_SHELL = [
  './',
  './index.html',
  './banco-ejercicios.html',
  './rutina.html',
  './desk-mobility.html',
  './semaforo-dolor.html',
  './manifest.json',
  './pwa-init.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(APP_SHELL);

    // Vite hashes the index CSS/JS. Read the built page so those exact files are
    // precached without globbing public/data/. A transient failure here must not
    // discard the already-cached base shell.
    try {
      const indexResponse = await fetch('./index.html');
      const indexHtml = await indexResponse.text();
      const assetUrls = [...indexHtml.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
        .map(([, value]) => new URL(value, self.location.href))
        .filter((url) => url.origin === self.location.origin && url.pathname.includes('/assets/'))
        .map((url) => url.href);
      await cache.addAll(assetUrls);
    } catch (error) {
      console.error('Failed to precache Vite assets:', error);
    }

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => (
        (key.startsWith('calistenia-shell-') && key !== SHELL_CACHE)
        || (key.startsWith('calistenia-runtime-') && key !== RUNTIME_CACHE)
      ))
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const dataPath = new URL('./data/', self.location.href).pathname;
  const isLocalExerciseAsset = url.origin === self.location.origin && url.pathname.startsWith(dataPath);
  const isFitbodVideo = url.hostname === 'app-media-r2.fitbod.me';
  const isBuiltAsset = url.origin === self.location.origin && url.pathname.includes('/assets/');
  const isShellPage = isBuiltAsset || (url.origin === self.location.origin && APP_SHELL.some((path) =>
    url.href === new URL(path, self.location.href).href));

  if (!isLocalExerciseAsset && !isFitbodVideo && !isShellPage) return;

  event.respondWith(cacheFirst(request, isShellPage ? SHELL_CACHE : RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}
