// service-worker.js
const CACHE_NAME = 'labor-test-menu-v1';

// Dateien, die im Cache gespeichert werden sollen
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/index-fd0caf33.js',
  '/assets/index-309e17d0.css',
  '/fonts/roboto/roboto.css',
  '/fonts/roboto/roboto-v47-latin-300.woff2',
  '/fonts/roboto/roboto-v47-latin-regular.woff2',
  '/fonts/roboto/roboto-v47-latin-500.woff2',
  '/fonts/roboto/roboto-v47-latin-700.woff2',
  '/fonts/material-icons/material-icons.css',
  '/fonts/material-icons/material-icons.woff2',
  '/tests.json',
  '/profile.json',
  '/manifest.json',
  '/images/icon-512x512.png',
  '/images/icons/icon-72x72.png',
  '/images/icons/icon-96x96.png',
  '/images/icons/icon-512x512.png',
  '/images/icons/icon-144x144.png',
  '/images/icons/icon-152x152.png',
  '/images/icons/icon-192x192.png',
  '/images/icons/icon-384x384.png',
  '/images/icons/icon-512x512.png'
];

// Installation des Service Workers
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
  );
});

// Verwendung des Service Workers mit Cache-First-Strategie
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - Datei aus dem Cache zurückgeben
        if (response) {
          return response;
        }

        // Clone des Requests erstellen, da er nur einmal verwendet werden kann
        const fetchRequest = event.request.clone();

        // Netzwerk-Anfrage stellen und ergebnis im cache speichern
        return fetch(fetchRequest).then(
          response => {
            // Überprüfen, ob wir eine gültige Antwort erhalten haben
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone der Antwort erstellen, da sie auch nur einmal verwendet werden kann
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Aktualisierung des Service Workers
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Alte Caches löschen
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
