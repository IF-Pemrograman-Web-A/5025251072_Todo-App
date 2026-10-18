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