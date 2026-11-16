const statusEl = document.getElementById('status');

function announce(msg){
  statusEl.textContent = '';
  setTimeout(() => { statusEl.textContent = msg; }, 50);
}

// Kamera
const cameraVideo = document.getElementById('camera-video');
const cameraStartBtn = document.getElementById('cameraStart');
const takeButton = document.getElementById('takeButton');
const cameraStopBtn = document.getElementById('cameraStop');
const imagePreview = document.getElementById('imagePreview');
const imageRemoveBtn = document.getElementById('imageRemove');
const imageData = document.getElementById('imageData');

let stream = null;

async function getStream() {
  return await navigator.mediaDevices.getUserMedia({ video: true });
}

function cameraLaunch(s){
  cameraVideo.srcObject = s;
  cameraVideo.hidden = false;
  takeButton.hidden = false;
  cameraStopBtn.hidden = false;
  cameraStartBtn.hidden = true;
  cameraVideo.play();
}

function cameraStop(){
  if(stream){
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  cameraVideo.srcObject = null;
  cameraVideo.hidden = true;
  takeButton.hidden = true;
  cameraStopBtn.hidden = true;
  cameraStartBtn.hidden = false;
}

function setPendingImage(dataUrl){
  imageData.value = dataUrl;
  imagePreview.hidden = !dataUrl;
  imageRemoveBtn.hidden = !dataUrl;

  if(dataUrl) imagePreview.src = dataUrl;
  else imagePreview.removeAttribute('src');
}

function cameraTakePicture(){
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  canvas.getContext('2d').drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
  setPendingImage(canvas.toDataURL('image/jpeg', 0.8));
  cameraStop();
  announce('Photo captured.');
}

cameraStartBtn.addEventListener('click', async () => {
  try{
    stream = await getStream();
    cameraLaunch(stream);
  } catch (err) {
    announce('Can not open the camera: ' + err.name);
  }
});

takeButton.addEventListener('click', cameraTakePicture);
cameraStopBtn.addEventListener('click', cameraStop);
imageRemoveBtn.addEventListener('click', () => setPendingImage(''));
window.addEventListener('pagehide', cameraStop);

// Tema gelap
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
}

applyTheme(localStorage.getItem('theme') || 'light');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

// Pengingat
document.getElementById('notifyList').addEventListener('change', (e) => {
  if (e.target.value && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

async function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const done = JSON.parse(localStorage.getItem('notified') || '[]');

  for (const el of document.querySelectorAll('.todoList[data-notify]')) {
    const key = el.dataset.id + '@' + el.dataset.notify;

    if (!done.includes(key) && new Date(el.dataset.notify) <= Date.now()) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification('Reminder: ' + el.dataset.title, {
        body: 'Waktunya mengerjakan todo ini.'
      });

      done.push(key);
      localStorage.setItem('notified', JSON.stringify(done));
    }
  }
}

setInterval(checkReminders, 15000);
checkReminders();

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('SW registered:', reg.scope);
    } catch (err) {
      console.error('SW registration failed:', err);
    }
  });
}
let deferredPrompt;
const installBtn = document.querySelector('#install-button');
const installStatus = document.querySelector('#status');

if (installBtn) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();          // cegah mini-infobar bawaan browser
    deferredPrompt = e;          // simpan event untuk dipakai nanti
    installBtn.hidden = false;   // tampilkan tombol
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();     // munculkan dialog install
    const { outcome } = await deferredPrompt.userChoice;
    if (installStatus) {
      installStatus.textContent = outcome === 'accepted'
        ? 'Aplikasi berhasil di-install.'
        : 'Install dibatalkan.';
    }
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
  });
}


const API_KEY = document.querySelector('meta[name="api-key"]')?.content || '';

// Satu fungsi untuk semua request ke API
async function api(method, url, body) {
    const options = {
        method,
        headers: {
            'Accept': 'application/json',
            'X-API-Key': API_KEY
        }
    };

    if (body !== undefined) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }

    let res;

    try {
        res = await fetch(url, options);
    } catch (err) {
        // Jaringan putus / offline
        throw new Error('Tidak ada koneksi ke server. Coba lagi saat online.');
    }

    const data = res.status === 204
        ? null
        : await res.json().catch(() => null);

    if (!res.ok) {
        const fields = data?.error?.fields || {};
        const detail = Object.values(fields).join('; ');

        throw new Error(
            (data?.error?.message || 'Terjadi kesalahan') +
            (detail ? ': ' + detail : '')
        );
    }

    return data;
}


// Pesan sukses/gagal yang terlihat di layar + dibacakan screen reader
function showMessage(msg, isError = false) {
    let box = document.querySelector('.flash');

    if (!box) {
        box = document.createElement('p');
        box.className = 'flash';
        document.querySelector('main').before(box);
    }

    box.textContent = msg;
    box.setAttribute('role', isError ? 'alert' : 'status');

    announce(msg);
}

// Pesan yang harus tetap tampil setelah halaman dimuat ulang
function reloadWith(msg, page) {
    sessionStorage.setItem('flash', msg);
    location.href = 'index.php?page=' + page;
}

const savedFlash = sessionStorage.getItem('flash');

if (savedFlash) {
    sessionStorage.removeItem('flash');
    showMessage(savedFlash);
}


 // CREATE (POST) dan UPDATE (PATCH) memakai form yang sama
const todoForm = document.querySelector('form.create');

todoForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const f = todoForm.elements;
    const id = todoForm.dataset.id; // ada = mode edit

    const payload = {
        title: f.title.value.trim(),
        deadline: f.deadline.value || null,
        notify_at: f.notify_at.value || null,
        priority: f.priority.value,
        notes: f.notes.value.trim(),
        is_shared: f.is_shared.checked
    };

    if (f.image_data.value) {
        payload.image_data = f.image_data.value;
    }

    if (f.remove_image && f.remove_image.checked) {
        payload.remove_image = true;
    }

    try {
        if (id) {
            await api('PATCH', `api/todos/${id}`, payload);
            reloadWith('Todo berhasil diperbarui.', todoForm.dataset.page);
        } else {
            await api('POST', 'api/todos', payload);
            reloadWith(
                'Todo berhasil ditambahkan.',
                payload.is_shared ? 'shared' : 'personal'
            );
        }
    } catch (err) {
        showMessage(err.message, true);
    }
});

// UPDATE status (PATCH)
document.querySelectorAll('.status-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            await api('PATCH', `api/todos/${form.dataset.id}`, {
                status: form.elements.status.value
            });

            reloadWith('Status todo diperbarui.', form.dataset.page);
        } catch (err) {
            showMessage(err.message, true);
        }
    });
});

// DELETE
document.querySelectorAll('.delete-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!confirm('Hapus todo ini?')) return;

        try {
            await api('DELETE', `api/todos/${form.dataset.id}`);
            reloadWith('Todo berhasil dihapus.', form.dataset.page);
        } catch (err) {
            showMessage(err.message, true);
        }
    });
});


