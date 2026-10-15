/* SamaDokita Service Worker — Offline-first pour dossier patient */
const CACHE_NAME = "samadokita-v3";
const STATIC_ASSETS = ["/", "/login", "/register", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API GET: network-first, fallback cache
  if (request.url.includes("/api/") && request.method === "GET") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Sync offline dossier patient
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-patient-data") {
    event.waitUntil(syncPatientData());
  }
});

async function syncPatientData() {
  const db = await openDB();
  const pending = await db.getAll("pendingPatientUpdates");
  for (const item of pending) {
    try {
      await fetch(item.url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.data),
      });
      await db.delete("pendingPatientUpdates", item.id);
    } catch {
      /* reste en attente */
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("samadokita-offline", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("pendingPatientUpdates", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
