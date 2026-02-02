/* ============================================
   KoYun Coffee V2.0 - Service Worker
   Progressive Web App Cache Strategy
   ============================================ */

const CACHE_VERSION = 'koyun-customer-v2.0';
const CACHE_NAME = `${CACHE_VERSION}-${Date.now()}`;

// Files to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/menu.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap'
];

// Firebase CDN URLs (don't cache - always fetch fresh)
const FIREBASE_URLS = [
    'https://www.gstatic.com/firebasejs/',
    'https://firestore.googleapis.com/'
];

// ============================================
// Install Event - Cache essential files
// ============================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker v2.0...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return Promise.allSettled(
                    PRECACHE_URLS.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn('[SW] Failed to cache:', url, err);
                            return Promise.resolve();
                        });
                    })
                );
            })
            .then(() => {
                console.log('[SW] App shell cached successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch(err => {
                console.error('[SW] Cache installation failed:', err);
            })
    );
});

// ============================================
// Activate Event - Clean old caches
// ============================================

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker v2.0...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName.startsWith('koyun-customer-') && cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service Worker activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// ============================================
// Fetch Event - Network First Strategy
// ============================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Skip Chrome extensions
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Skip Firebase/Firestore - always fetch fresh
    if (FIREBASE_URLS.some(fbUrl => request.url.includes(fbUrl))) {
        event.respondWith(fetch(request));
        return;
    }
    
    // Network First with Cache Fallback
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Only cache valid responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                
                // Clone response for caching
                const responseToCache = response.clone();
                
                caches.open(CACHE_NAME).then((cache) => {
                    // Cache images and static assets
                    if (request.destination === 'image' || 
                        request.destination === 'style' || 
                        request.destination === 'script') {
                        cache.put(request, responseToCache);
                    }
                });
                
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            console.log('[SW] Serving from cache:', request.url);
                            return cachedResponse;
                        }
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return minimal response for other requests
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// ============================================
// Message Event - Manual cache update
// ============================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Clearing all caches...');
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

// ============================================
// Push Notification (Future Feature)
// ============================================

self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'KoYun Coffee';
    const options = {
        body: data.body || 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'koyun-notification',
        data: data
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('[SW] Service Worker v2.0 loaded');
