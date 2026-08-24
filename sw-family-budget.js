const CACHE_NAME = "family-budget-cache-v1";
const ASSETS = [
  "./family_budget.html",
  "./manifest-family-budget.json",
  "./icons-family/icon-192.png",
  "./icons-family/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// HTML은 항상 네트워크를 먼저 시도해 최신 버전을 받아온다(오프라인일 때만 캐시 사용).
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const isHTML = e.request.mode === "navigate" || (e.request.headers.get("accept") || "").includes("text/html");

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      });
    })
  );
});
