export type OfflineAvailability = 'checking' | 'preparing' | 'ready' | 'unsupported' | 'error';

// Inspect the same scoped precache used by Workbox. An active worker alone
// cannot guarantee an offline launch if browser storage was cleared.
export async function readOfflineAvailability(): Promise<OfflineAvailability> {
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('caches' in window)) return 'unsupported';
  try {
    const scope = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    const registration = await navigator.serviceWorker.getRegistration(scope);
    if (registration?.scope !== scope || registration.active?.state !== 'activated'
      || registration.active.scriptURL !== new URL('sw.js', scope).href) return 'preparing';

    const cacheName = `workbox-precache-v2-${scope}`;
    if (!(await caches.keys()).includes(cacheName)) return 'preparing';
    const cache = await caches.open(cacheName);
    const indexUrl = new URL('index.html', scope).href;
    const html = await cache.match(indexUrl, { ignoreSearch: true });
    if (!html?.ok) return 'preparing';
    const document = new DOMParser().parseFromString(await html.text(), 'text/html');
    const assets = [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')]
      .map((element) => new URL(element.getAttribute('src') ?? element.getAttribute('href')!, indexUrl).href);
    if (!document.querySelector('script[type="module"][src]') || assets.length === 0) return 'preparing';
    for (const asset of assets) {
      if (!(await cache.match(asset, { ignoreSearch: true }))?.ok) return 'preparing';
    }
    return 'ready';
  } catch {
    return 'error';
  }
}
