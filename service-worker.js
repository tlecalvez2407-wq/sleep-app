const CACHE_NAME = 'sleep-cycle-v5'; // Nouvelle version
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './debug.js',
  './manifest.json',
  './icons/icon-192.png'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (event.request.method === 'GET' && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

/* =========================
   NOTIFICATIONS LOGIC
========================= */

// Écouter les messages venant de l'app (pour programmer des notifications)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, options, delay } = event.data;
    
    // On utilise setTimeout dans le SW (attention, le SW peut s'endormir)
    // Pour une version de production plus robuste, on utiliserait l'API Push ou Background Sync
    setTimeout(() => {
      self.registration.showNotification(title, options);
    }, delay);
  }
});

// Gérer le clic sur la notification
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
