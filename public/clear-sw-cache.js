// Cache-Clearing Script
console.log("🧹 Cache-Clearing Script gestartet");

// Service Worker deregistrieren
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log("🗑️ Service Worker deregistriert");
    }
  });
}

// Caches löschen 
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    cacheNames.forEach(function(cacheName) {
      caches.delete(cacheName);
      console.log(`🧼 Cache "${cacheName}" gelöscht`);
    });
  });
}

console.log("✅ Cache-Clearing abgeschlossen");
