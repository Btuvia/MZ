// Firebase Cloud Messaging Service Worker
// This file handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: 'AIzaSyBRcSFpjUM9kJQvxi-0wD-pAw0Yt1Y9fY8',
    authDomain: 'magenzaha.firebaseapp.com',
    projectId: 'magenzaha',
    storageBucket: 'magenzaha.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:abc123',
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'מגן זהב';
    const notificationOptions = {
        body: payload.notification?.body || 'יש לך הודעה חדשה',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: payload.data?.tag || 'default',
        data: payload.data,
        vibrate: [100, 50, 100],
        actions: [
            {
                action: 'open',
                title: 'פתח',
            },
            {
                action: 'dismiss',
                title: 'סגור',
            },
        ],
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Open the app or focus existing window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if none exists
            if (clients.openWindow) {
                const url = event.notification.data?.url || '/admin/dashboard';
                return clients.openWindow(url);
            }
        })
    );
});

// Handle push events
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push event received:', event);
});

// Service worker install
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installing...');
    self.skipWaiting();
});

// Service worker activate
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activating...');
    event.waitUntil(clients.claim());
});
