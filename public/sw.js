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

// ==========================================
// NOVOS EVENTOS PARA NOTIFICAÇÕES PUSH
// ==========================================

// Quando o servidor manda o alerta, o motor "acorda" o celular e desenha a notificação
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon.png', // A logo do seu app
      badge: '/icon.png', // Ícone que fica na barra superior do celular
      vibrate: [200, 100, 200, 100, 200], // Padrão de vibração chamativo
      data: {
        url: data.url || '/' // Rota para onde enviar o usuário ao clicar
      }
    };
    
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// O que acontece quando a pessoa clica na notificação que apareceu na tela
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});