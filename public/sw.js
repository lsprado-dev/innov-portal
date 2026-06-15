// public/sw.js
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// O Chrome exige um evento de "fetch" para considerar a App instalável, 
// mesmo que vazio!
self.addEventListener('fetch', (e) => {
  // Não fazemos cache de nada para não interferir com o seu sistema Next.js,
  // apenas deixamos o evento passar.
});