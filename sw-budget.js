const CACHE_NAME = "budget-cache-v2";
const ASSETS = [
  "./budget.html",
  "./manifest-budget.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
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
// 아이콘/매니페스트 같은 정적 자산은 캐시를 우선 사용해 빠르게 로드한다.
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
