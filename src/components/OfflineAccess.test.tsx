// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

const scope = 'http://localhost/';
const cacheName = `workbox-precache-v2-${scope}`;
const cachedHtml = '<html><head><link rel="stylesheet" href="/assets/app.css"></head><body><script type="module" src="/assets/app.js"></script></body></html>';

function browserCache(options: { missing?: string; state?: string; otherScope?: boolean; broken?: boolean } = {}) {
  // These browser APIs are unavailable in jsdom. Store responses by real cache URLs.
  const entries = new Map([
    ['http://localhost/index.html', cachedHtml],
    ['http://localhost/assets/app.js', 'export {};'],
    ['http://localhost/assets/app.css', 'body { color: black; }'],
  ]);
  if (options.missing) entries.delete(options.missing);
  const worker = { state: options.state ?? 'activated', scriptURL: `${scope}sw.js` };
  const registration = { scope: options.otherScope ? `${scope}another-app/` : scope, active: worker };
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
    getRegistration: async () => registration,
  } });
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('caches', {
    keys: async () => { if (options.broken) throw new Error('Cache access denied'); return [cacheName]; },
    open: async (name: string) => ({
      match: async (url: string, options?: CacheQueryOptions) => {
        if (name !== cacheName) return undefined;
        const key = new URL(url);
        if (options?.ignoreSearch) key.search = '';
        const body = entries.get(key.href);
        return body === undefined ? undefined : new Response(body);
      },
    }),
  });
}

beforeEach(() => { window.localStorage.clear(); });
afterEach(() => {
  cleanup(); vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
});

it('confirms offline launch only after the active worker and all page assets are cached', async () => {
  browserCache();
  render(<App />);
  expect(await screen.findByText('Готово к работе офлайн')).toBeInTheDocument();
});

it.each([
  { missing: 'http://localhost/assets/app.js' },
  { missing: 'http://localhost/assets/app.css' },
  { missing: 'http://localhost/index.html' },
  { state: 'installing' },
  { otherScope: true },
])('does not claim offline readiness for an incomplete installation: %j', async (options) => {
  browserCache(options);
  render(<App />);
  await waitFor(() => expect(screen.getByLabelText('Доступность без интернета')).toHaveTextContent('Подготовка офлайн-версии'));
  expect(screen.queryByText('Готово к работе офлайн')).not.toBeInTheDocument();
});

it('lets the teacher retry a failed readiness check without losing the current work', async () => {
  browserCache({ broken: true });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Аспект 1: полно' }));
  await screen.findByText('Не удалось проверить офлайн-версию');
  browserCache();
  fireEvent.click(screen.getByText('Установка и работа без интернета'));
  fireEvent.click(screen.getByRole('button', { name: 'Проверить готовность' }));
  expect(await screen.findByText('Готово к работе офлайн')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Аспект 1: полно' })).toHaveAttribute('aria-pressed', 'true');
});

it('keeps installation instructions available in browsers without offline support', async () => {
  render(<App />);
  fireEvent.click(screen.getByText('Установка и работа без интернета'));
  expect(await screen.findByText('Офлайн-режим недоступен в этом браузере')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'iPhone и iPad' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Android' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Ноутбук или компьютер' })).toBeInTheDocument();
});

it('offers native installation when the browser supports it and keeps instructions after dismissal', async () => {
  browserCache();
  render(<App />);
  const installEvent = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(installEvent, { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'dismissed' }) });
  fireEvent(window, installEvent);
  fireEvent.click(screen.getByText('Установка и работа без интернета'));
  fireEvent.click(screen.getByRole('button', { name: 'Установить приложение' }));
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Установить приложение' })).not.toBeInTheDocument());
  expect(screen.getByRole('heading', { name: 'iPhone и iPad' })).toBeInTheDocument();
});
