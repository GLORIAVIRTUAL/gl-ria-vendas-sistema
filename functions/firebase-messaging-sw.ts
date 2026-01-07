// Serve o Firebase Messaging Service Worker
Deno.serve(async (req) => {
  const serviceWorkerCode = `
// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gloria-vendas",
  messagingSenderId: "19066612248",
  appId: "1:19066612248:web:1206105e95972329db316d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Mensagem recebida em background:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo.png',
    badge: '/logo.png',
    tag: 'gloria-notification',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.link || window.location.origin + '/ChatIA';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(window.location.hostname) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
  `;

  return new Response(serviceWorkerCode, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache'
    }
  });
});