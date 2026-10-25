// Bende van ellende: zorgt dat de app opstart zonder wifi, en ontvangt pushmeldingen.
try {
  importScripts("./firebase-config.js");
  const C = self.BVE_CONFIG && self.BVE_CONFIG.firebase;
  if (C && self.BVE_CONFIG.vapidKey) {
    importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
                  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
    firebase.initializeApp(C);
    firebase.messaging(); // toont meldingen als de app dicht is
  }
} catch (e) { /* zonder internet bij de eerste start: meldingen later */ }

// Na een update van de bestanden: verhoog het versienummer hieronder.
const VERSIE = "bende-v5";
const BASIS = ["./", "./index.html", "./firebase-config.js", "./manifest.webmanifest",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIE).then(c => c.addAll(BASIS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSIE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  const eigen = u.origin === location.origin;
  const extern = u.hostname === "www.gstatic.com" || u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com";
  if (!eigen && !extern) return; // Firebase-verkeer gaat gewoon naar het net
  e.respondWith(caches.open(VERSIE).then(async cache => {
    const opgeslagen = await cache.match(e.request);
    const vers = fetch(e.request).then(r => {
      if (r.ok || r.type === "opaque") cache.put(e.request, r.clone());
      return r;
    }).catch(() => opgeslagen);
    // Eigen bestanden: eerst het net (zodat updates meteen binnenkomen), anders de opgeslagen versie.
    return eigen ? vers.then(r => r || opgeslagen) : (opgeslagen || vers);
  }));
});
