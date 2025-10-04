const CACHE_NAME = 'medicare-v1-cache-v5';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/nurse-logo.svg',
  '/medicare-logo.svg',
  '/medicare-logo.png',
  '/favicon.ico'
];

// Rotas críticas para pré-cache (caminhos SPA que devem carregar offline)
const CRITICAL_ROUTES = [
  '/',
  '/patients',
  '/dashboard',
  // Family dashboard usa parâmetros; pré-cache base para garantir shell
  '/family/login',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(CORE_ASSETS);
      // Pré-cache placeholders das rotas críticas apontando para index.html
      const indexResp = await cache.match('/index.html') || await fetch('/index.html');
      for (const route of CRITICAL_ROUTES) {
        await cache.put(route, indexResp.clone());
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Habilita navigation preload quando suportado
  if (self.registration && self.registration.navigationPreload) {
    event.waitUntil(self.registration.navigationPreload.enable());
  }
  self.clients.claim();
});

// Estratégia: assets (cache-first), navegação (network-first com fallback)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Navegação de páginas (HTML)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Usa resposta pré-carregada se disponível
          const preload = event.preloadResponse ? await event.preloadResponse : null;
          if (preload) return preload;

          // Tenta rede normalmente
          const networkResp = await fetch(req);
          return networkResp;
        } catch (err) {
          // Fallback offline
          const cache = await caches.open(CACHE_NAME);
          // tenta retornar rota crítica cacheada
          const criticalMatch = await cache.match(new URL(req.url).pathname);
          if (criticalMatch) return criticalMatch;
  const offline = await cache.match('/offline.html');
  return offline || caches.match('/index.html');
        }
      })()
    );
    return;
  }

  // Assets estáticos (JS, CSS, imagens)
  if (
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.destination === 'font'
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return response;
        });
        return cached || networkFetch;
      })
    );
    return;
  }

// Default: tenta rede, fallback ao cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Mensagens do cliente para controle de atualização
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Solicitação de sincronização manual
  if (event.data && event.data.type === 'REQUEST_SYNC_CARE_EVENTS') {
    // tenta registrar uma sync tag
    if (self.registration && 'sync' in self.registration) {
      self.registration.sync.register('sync-care-events').catch(() => {
        // sem suporte: notifica clientes para drenar diretamente
        self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
          for (const client of clients) {
            client.postMessage({ type: 'SYNC_CARE_EVENTS' });
          }
        });
      });
    } else {
      // fallback
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_CARE_EVENTS' });
        }
      });
    }
  }
});

// Background Sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-care-events') {
    event.waitUntil(
      (async () => {
        // avisa clientes para drenar fila
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_CARE_EVENTS' });
        }
      })()
    );
  }
});

// Push notifications (básico)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'MediCare', body: 'Você tem uma nova atualização.' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MediCare', {
      body: data.body || '',
      icon: '/medicare-logo.png',
      badge: '/favicon.ico',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});