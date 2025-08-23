const CACHE_NAME = "fay-cache-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/logo.ico",
  "/manifest.json",
  "/about_us.html",
  "/courses.html",
  "/exchange.html",
  "/earn.html",
  "/free-coin.html",
  "/leaderboard.html",
  "/login.html",
  "/setting.html",
  "/icons/logo.ico",
  "/Level1-_P.1.png",
  "/Level1-_P.2.png",
  "/Level1-_P.3.png",
  "/bg.png",
  "/faycoin-sync.js" // 你網站的 JS
];

// 安裝：快取必要檔案
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

// 攔截請求：優先用快取，否則抓網路
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// 更新快取：刪掉舊版本
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
});
