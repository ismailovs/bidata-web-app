const CACHE = 'bidata-shell-v12';
const SHELL = ['/', '/theme.js', '/app.js', '/style.css', '/manifest.webmanifest', '/icons/bidata-red-192.png', '/icons/bidata-red-512.png', '/icons/bidata-red-180.png'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('bidata-shell-') && key !== CACHE).map(key => caches.delete(key)))));
});
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
 if (!SHELL.includes(url.pathname)) return;
 event.respondWith(fetch(event.request).then(response => {
   // Do not replace a working cached shell with an upstream error page.
   return response.ok ? response : caches.match(url.pathname).then(cached => cached || response);
 }).catch(() => caches.match(url.pathname)));
});
