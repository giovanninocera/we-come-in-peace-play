/*
 * Service worker di We Come in Peace.
 * Il build (vite.config.ts, plugin "precache") riempie VERSION e PRECACHE con la versione del
 * build e l'elenco di tutti i suoi file: all'installazione si scarica subito tutto, così il gioco parte
 * offline anche se la prima visita è stata brevissima.
 * - pagina: prima la rete (così gli aggiornamenti arrivano subito), poi la copia salvata se offline;
 * - file del gioco: prima la copia salvata (hanno l'hash nel nome, quindi non cambiano mai).
 * Le cache vecchie si cancellano solo se sono del gioco (prefisso "wcip-"): quelle di altre app restano.
 */
const VERSION = '3d622200429b';
const PREFIX = 'wcip-';
const CACHE = PREFIX + VERSION;
const PRECACHE = ["./","./assets/index-CEvBXXMy.js","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Salva una copia della risposta (aspettando la scrittura, così non si perde se il worker si ferma). */
function store(event, request, response) {
  if (response.ok) {
    const copy = response.clone();
    event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => store(event, request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))),
    );
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => store(event, request, response))));
});
