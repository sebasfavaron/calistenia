window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => console.error('Service worker registration failed:', error));
  }
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
});
