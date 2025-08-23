const CACHE_NAME = "fay-cache-v1";
const urlsToCache = [
  "/FayWooooo_official_website/",
  "/FayWooooo_official_website/index.html",
  "/FayWooooo_official_website/logo.ico",
  "/FayWooooo_official_website/manifest.json",
  "/FayWooooo_official_website/about_us.html",
  "/FayWooooo_official_website/courses.html",
  "/FayWooooo_official_website/exchange.html",
  "/FayWooooo_official_website/earn.html",
  "/FayWooooo_official_website/free-coin.html",
  "/FayWooooo_official_website/leaderboard.html",
  "/FayWooooo_official_website/login.html",
  "/FayWooooo_official_website/setting.html",
  "/FayWooooo_official_website/icons/logo.ico",
  "/FayWooooo_official_website/Level1-_P.1.png",
  "/FayWooooo_official_website/Level1-_P.2.png",
  "/FayWooooo_official_website/Level1-_P.3.png",
  "/FayWooooo_official_website/bg.png",
  "/FayWooooo_official_website/icon-192.png",
  "/FayWooooo_official_website/icon-512.png",
  "/FayWooooo_official_website/download.html",
  "/FayWooooo_official_website/faycoin-sync.js" // 你網站的 JS
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
