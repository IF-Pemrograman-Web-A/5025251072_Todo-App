const CACHE = 'todo-v1';
const SHELL = ['./', './index.html', './style.css', './newScript.js'];

self.addEventListener('install', (e) => e.waitUntil(caches.open(CACHE). then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));

self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
    if(e.request.method !== 'GET') return;
    e.respondWith(
        fetch(e.request)
        .then((res) => {
            if(res.ok){
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
        })
        .catch(() => caches.match(e.request))
    );
});
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(self.clients.openWindow('./'));
});

async function checkReminders() {
  for (const t of todos) {
    if (t.notifyAt && !t.notified && new Date(t.notifyAt) <= Date.now()) {
      if (Notification.permission === 'granted') {
        new Notification('Reminder: ' + t.text, { body: 'Deadline: ' + formatDate(t.deadline) });
        t.notified = true;
        await saveTodo(t);
      }
    }
  }
}
setInterval(checkReminders, 15000);