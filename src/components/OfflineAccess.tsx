import { useCallback, useEffect, useRef, useState } from 'react';
import { readOfflineAvailability } from '../offline/availability';
import type { OfflineAvailability } from '../offline/availability';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const labels: Record<OfflineAvailability, string> = {
  checking: 'Проверяем офлайн-версию…',
  preparing: 'Подготовка офлайн-версии',
  ready: 'Готово к работе офлайн',
  unsupported: 'Офлайн-режим недоступен в этом браузере',
  error: 'Не удалось проверить офлайн-версию',
};

export default function OfflineAccess() {
  const [availability, setAvailability] = useState<OfflineAvailability>('checking');
  const [online, setOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(null);
  const [installMessage, setInstallMessage] = useState('');
  const mounted = useRef(false);
  const checking = useRef(false);

  const refresh = useCallback(async () => {
    if (checking.current) return;
    checking.current = true;
    const next = await readOfflineAvailability();
    checking.current = false;
    if (mounted.current) setAvailability(next);
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    const onConnectionChange = () => { setOnline(navigator.onLine); void refresh(); };
    const onInstallPrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstallPrompt(null); setInstallMessage('Приложение установлено. Открывайте его через значок.'); };
    window.addEventListener('online', onConnectionChange);
    window.addEventListener('offline', onConnectionChange);
    window.addEventListener('focus', refresh);
    window.addEventListener('beforeinstallprompt', onInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    navigator.serviceWorker?.addEventListener?.('controllerchange', refresh);
    return () => {
      mounted.current = false;
      window.removeEventListener('online', onConnectionChange);
      window.removeEventListener('offline', onConnectionChange);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('beforeinstallprompt', onInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      navigator.serviceWorker?.removeEventListener?.('controllerchange', refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (availability !== 'checking' && availability !== 'preparing') return;
    const timer = window.setInterval(refresh, 3000);
    return () => window.clearInterval(timer);
  }, [availability, refresh]);

  async function install() {
    const prompt = installPrompt;
    if (!prompt) return;
    setInstallPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (mounted.current) setInstallMessage(choice.outcome === 'accepted'
        ? 'Установка запрошена. После завершения приложение появится среди ваших приложений.'
        : 'Можно установить позже через меню браузера. Инструкции ниже.');
    } catch {
      if (mounted.current) setInstallMessage('Установите приложение через меню браузера по инструкции ниже.');
    }
  }

  return <section className="offline-access no-print" aria-label="Офлайн-версия">
    <div className="offline-status-row">
      <span className={`offline-status ${availability}`} role="status" aria-label="Доступность без интернета">{labels[availability]}</span>
      <span className="connection-status">{online ? 'Есть подключение к интернету' : 'Нет подключения к интернету'}</span>
    </div>
    <details className="offline-help">
      <summary>Установка и работа без интернета</summary>
      <div className="offline-help-body">
        <p>Откройте сервис с интернетом на каждом устройстве и дождитесь сообщения «Готово к работе офлайн».
          Затем можно открывать его без сети — из закладок или через значок установленного приложения.</p>
        {(availability === 'preparing' || availability === 'checking') && <p className="offline-hint">Оставьте страницу открытой с интернетом, пока загрузятся нужные файлы. Если подготовка не заканчивается, закройте и снова откройте приложение с интернетом.</p>}
        {availability === 'unsupported' && <p className="offline-hint">Откройте опубликованный HTTPS-адрес в обычном Safari, Chrome или Edge. Встроенный браузер другого приложения может не поддерживать установку и автономный запуск.</p>}
        {availability === 'error' && <p className="offline-hint">Браузер не позволил проверить сохранённые файлы. Попробуйте снова или откройте сервис в обычном браузере.</p>}
        <div className="offline-actions">
          {installPrompt && <button type="button" onClick={install}>Установить приложение</button>}
          <button type="button" onClick={() => { void refresh(); }}>Проверить готовность</button>
        </div>
        {installMessage && <p role="status">{installMessage}</p>}
        <div className="install-guides">
          <div><h3>iPhone и iPad</h3><p>Откройте в Safari: «Поделиться» → «На экран Домой» → «Добавить». Если есть переключатель «Открывать как веб-приложение», включите его.</p></div>
          <div><h3>Android</h3><p>Откройте в Chrome: меню ⋮ → «Добавить на главный экран» или «Установить приложение». Название пункта зависит от версии браузера.</p></div>
          <div><h3>Ноутбук или компьютер</h3><p>В Chrome или Edge нажмите значок установки в адресной строке либо выберите установку сайта как приложения в меню браузера. Можно также сохранить сайт в закладках.</p></div>
        </div>
        <h3>Что работает без сети</h3>
        <p>Проверка и подсчёт баллов, встроенная справка с примерами, сохранённые работы, печать, экспорт и импорт JSON.
          Ссылки на полные PDF ФИПИ требуют интернета.</p>
        <p className="offline-hint">Работы хранятся отдельно на каждом устройстве. Переносите их через экспорт и импорт JSON.
          Перед очисткой данных браузера сохраните резервную копию: очистка удаляет и работы, и офлайн-версию.</p>
        <p>Проверьте установку: после появления готовности закройте приложение, включите авиарежим и откройте его снова.</p>
      </div>
    </details>
  </section>;
}
