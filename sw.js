const CACHE_NAME = 'overemployment-pwa-v2';
const ASSETS = [
  './','./index.html','./styles.css','./main.js','./manifest.webmanifest',
  './scenes/BootScene.js','./scenes/MenuScene.js','./scenes/CharacterScene.js','./scenes/DetailsScene.js','./scenes/RulesScene.js','./scenes/GameScene.js',
  './systems/CardDeck.js','./data/cards.js','./icons/icon-192.png','./icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/phaser@3.80.0/dist/phaser.min.js',  './assets/rarity/common.svg',
  './assets/rarity/rare.svg',
  './assets/rarity/epic.svg',

];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => (k === CACHE_NAME ? null : caches.delete(k))))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('.js') || event.request.url.includes('.css')) {
    event.respondWith(
      fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((resp) => resp || fetch(event.request))
    );
  }
});
