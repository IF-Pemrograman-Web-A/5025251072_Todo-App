const CACHE = 'todo-v3';
const SHELL = [
   './style.css', 
   './newScript.js',
   './offline.html',
   './manifest.webmanifest',
   './img/icon-192.png',
   './img/icon-512.png'
];

//Halaman utama coba disimpan tapi tidak boleh menggagalkan instal
const PAGES = ['./', './index.php'];
// Install Service Worker
self.addEventListener('install', (e) =>
  e.waitUntil(
    caches.open(CACHE)
      .then(async(c) => {
        await c.addAll(SHELL);
        await Promise.all(PAGES.map((p) =>
          c.add(p).catch(() => {}
      )))
      })
      .then(() => self.skipWaiting())
  )
);

// Activate Service Worker
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('todo-') && k !== CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
);

// Mengambil halaman dari jaringan terlebih dahulu, cache digunakan saat offline
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/actions/')) return;

  if(req.mode === 'navigate'){
     e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && !res.redirected) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async() =>
      (await caches.match(req)) ||
      (await caches.match('./')) ||
      (await caches.match('./index.php')) ||
      caches.match('./offline.html')
      )
  );
  return;
  }

  e.respondWith(
    caches.open(CACHE).then(async(cache) =>{
      const cached = await cache.match(req);
      const fetching = fetch(req) .then((res)=> {
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => cached || Response.error());
      return cached || fetching;
  })
  );
});

// Membuka aplikasi saat notifikasi diklik
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.openWindow('./'));
});
