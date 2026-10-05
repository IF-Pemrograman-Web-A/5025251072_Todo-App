// Mengambil elemen dari HTML
const listSection = document.querySelector('.list');
const createForm = document.querySelector('form.create');
const detailSection = document.querySelector('.editToDo');
const header = document.querySelector("header");

const inputText = document.getElementById('newList');
const inputDate = document.getElementById('dateList');
const inputNotify = document.getElementById('notifyList');
const inputNotes = document.getElementById('message');

const submitBtn = document.querySelector('button[type="submit"]');
const statusEl = document.getElementById('status');
function announce(msg){
  statusEl.textContent='';
  setTimeout(() => {statusEl.textContent = msg;}, 50);
}
const formTitle = document.querySelector('.forCreate');

let todos = [];
let nextId = 1;
let editingId = null;

let db;

function openDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('todo-app', 1);

    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore('todos',{
        keyPath: 'id',
        autoIncrement: true
      });
      scrapeInitialTodos().forEach((t) => {
        delete t.id;
        store.add(t);
      });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

  function tx(mode, fn){
    return new Promise((resolve, reject) => {
      const t = db.transaction('todos', mode);
      const req = fn(t.objectStore('todos'));
      t.oncomplete = () => resolve(req.result);
      t.onerror = () => reject(t.error);
    });
  }

  async function saveTodo(todo){
    todo.id = await tx('readwrite', (store) => store.put(todo));
  }

  function removeTodo(id) {
    return tx('readwrite', (store) => store.delete(id));
  }

  async function deleteTodo(id) {
    const todo = todos.find((t) => t.id === id);
    await removeTodo(id);
    todos = todos.filter((t) => t.id !== id);
    if(editingId === id) resetForm();
    renderTodos();
    announce(`Deleted "${todo ? todo.text : 'to-do'}".`);
    const h = document.querySelector('#todoList h2');
    if(h) h.focus();
  }

function scrapeInitialTodos() {

    const listItems = listSection.querySelectorAll('.todoList');
    const detailItems = detailSection.querySelectorAll('.detailToDo');
    const result = [];

    listItems.forEach((item, index) => {

        const checkbox = item.querySelector('input');
        const label = item.querySelector('label');
        const time = item.querySelector('time');
        const detail = detailItems[index];

        let priority = "Sedang";
        let status = "";
        let notesText = "";
        let notesHTML = "";

        if (detail) {
          const priorityEl = detail.querySelector(".priority");
          
            if (priorityEl) {
              priority = priorityEl.textContent.replace("Prioritas:", "").trim();
            }
            const select = detail.querySelector("select");

            if (select) {
                status = select.value;
            }

            const notesEl = detail.querySelector(".notes");

            if (notesEl) {

                const clone = notesEl.cloneNode(true);

                const sbNotes = clone.querySelector(".sbNotes");

                if (sbNotes) {
                    sbNotes.remove();
                }

                const span = clone.querySelector("span");

                if (span) {
                    notesHTML = span.innerHTML.trim();
                    span.remove();
                }

                notesText = clone.textContent.trim();
            }
        }

        result.push({
            id: index + 1,
            text: label ? label.textContent.trim() : `Todo ${index + 1}`,
            deadline: time ? time.getAttribute('datetime') : "",
            priority: priority,
            status: status,
            completed: checkbox ? checkbox.checked : false,
            notesText: notesText,
            notesHTML: notesHTML
        });

    });

    return result;
}

function renderTodos() {
  const activeId =document.activeElement && document.activeElement.id;
  listSection.querySelectorAll('.todoList').forEach((el)=> el.remove());
  detailSection.querySelectorAll('.detailToDo').forEach((el)=> el.remove()); 
  todos.forEach((todo) => {
    listSection.appendChild(buildListItem(todo));
    detailSection.appendChild(buildDetailItem(todo));
  });
  if(activeId){
    const el = document.getElementById(activeId);
    if(el) el.focus();
  }
  }

  function formatDate(dtString){
    if(!dtString) return "Belum ditentukan";
    const d = new Date(dtString);
    if(isNaN(d)) return dtString;
    return d.toLocaleString("id-ID",{
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function statusLabel(value){
    if(value === "done") return "Done";
    if(value === "onProgress") return "On Progress";
    if(value === "none") return "None";
    return "Pilih Status";
  }

  function buildListItem(todo) {
    const article = document.createElement('article');
    article.className = 'todoList';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `toDo${todo.id}`;
    checkbox.checked = todo.completed;

    checkbox.addEventListener('change', () => toggleComplete(todo.id));

    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    label.setAttribute('for', `toDo${todo.id}`);
    label.textContent = todo.text;

    if(todo.completed) {
      label.style.textDecoration = "line-through";
    }

    const p = document.createElement('p');
    const time = document.createElement('time');
    time.setAttribute('datetime', todo.deadline || '');
    time.textContent = formatDate(todo.deadline);
    p.appendChild(time);

    const actions = document.createElement('div');
    actions.style.marginTop = '5px';
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Edit';
    editBtn.id = `edit-${todo.id}`;
    editBtn.setAttribute('aria-label', `Edit ${todo.text}`);
    editBtn.addEventListener('click', () => startEdit(todo.id));

    const delBtn = document.createElement("button");
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.id = `delete-${todo.id}`;
    delBtn.setAttribute('aria-label', `Delete ${todo.text}`);
    delBtn.addEventListener('click', () => deleteTodo(todo.id));
    
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    wrapper.appendChild(label);
    wrapper.appendChild(p);
    wrapper.appendChild(actions);
    
    article.appendChild(checkbox);
    article.appendChild(wrapper);
    return article; 
  }

  function buildDetailItem(todo) {
    const article = document.createElement('article');
    article.className = 'detailToDo';
    
    const h3 = document.createElement('h3');
    h3.className = 'todos';
    h3.textContent = todo.text;

    const statusP = document.createElement('p');
    const statusLbl = document.createElement('label');
    statusLbl.setAttribute('for', `progress-${todo.id}`);
    statusLbl.textContent = 'Status: ';
    const select = document.createElement('select');
    select.id = `progress-${todo.id}`;

    ["", "done", "onProgress", "none"].forEach((value) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = statusLabel(value);
      if (value === todo.status) {
        opt.selected = true;
      }
       select.appendChild(opt);
    });

    select.addEventListener('change', (e) => updateStatus(todo.id, e.target.value));

    statusP.appendChild(statusLbl);
    statusP.appendChild(select);

    const deadlineP = document.createElement('p');
    deadlineP.className = 'deadline';
    deadlineP.append('Deadline:');
    const timeEl = document.createElement('time');
    timeEl.setAttribute('datetime', todo.deadline || '');
    timeEl.textContent = formatDate(todo.deadline);
    deadlineP.appendChild(timeEl);

    const priorityP = document.createElement('p');
    priorityP.className = 'priority';
    priorityP.textContent = `Priority: ${todo.priority}`;

    const notesDiv = document.createElement('div');
    notesDiv.className = 'notes';
    const notesLabel = document.createElement('p');
    notesLabel.className = 'sbNotes';
    notesLabel.textContent = 'Notes:';

    notesDiv.appendChild(notesLabel);
    notesDiv.appendChild(document.createTextNode(todo.notesText || 'Tidak ada catatan'));

    if(todo.notesHTML){
      const span = document.createElement('span');
      span.innerHTML = todo.notesHTML;
      notesDiv.appendChild(span);
    }

    article.appendChild(h3);
    article.appendChild(statusP);
    article.appendChild(deadlineP);
    article.appendChild(priorityP);

    if(todo.image){
      const img = document.createElement('img');
      img.className = 'todo-image';
      img.src = todo.image;
      img.alt = `Photo for ${todo.text}`;
      article.appendChild(img);
    }
    article.appendChild(notesDiv);

    return article;
  }

    async function toggleComplete(id) {
    const todo = todos.find((t) => t.id === id);
    if(!todo) return;
    todo.completed = !todo.completed;
    todo.status = todo.completed ? "done" : todo.status === "done" ? "" : todo.status;
    await saveTodo(todo);
    renderTodos();
    }

    async function updateStatus(id, value){
      const todo = todos.find((t) => t.id === id);
      if(!todo) return;
      todo.status = value;
      todo.completed = value === "done";
      await saveTodo(todo);
      renderTodos();
    }

    function startEdit(id) {
      const todo = todos.find((t) => t.id === id);
      if(!todo) return;
      editingId = id;
      inputText.value = todo.text;
      inputDate.value = todo.deadline || '';
      inputNotify.value = todo.notifyAt || '';
      inputNotes.value = todo.notesText || '';
      setPendingImage(todo.image || '');
      submitBtn.textContent = 'Update';
      if(formTitle) formTitle.textContent = 'Edit To Do';
      inputText.focus();
    }

    function resetForm() {
      editingId = null;
      createForm.reset();
      cameraStop();
      setPendingImage('');
      submitBtn.textContent = 'Add';
      if(formTitle) formTitle.textContent = 'Create a New To Do';
    }

    createForm.addEventListener('submit', async function(e){
      e.preventDefault();

    const text = inputText.value.trim();
    if(!text) return;

    if(inputNotify.value && Notification.permission === 'default'){
      await Notification.requestPermission();
    }
    if(editingId !== null){
      const todo = todos.find((t) => t.id === editingId);
      if(todo){
        todo.text = text;
        todo.deadline = inputDate.value || '';
        todo.notifyAt = inputNotify.value || '';
        if(todo.notifyAt !== inputNotify.value){
          todo.notifyAt = inputNotify.value;
          todo.notified = false;
        }
        todo.notesText = inputNotes.value.trim();
        todo.image = pendingImage;
        await saveTodo(todo);
      }
    } else{
      const todo = {
        text: text,
        deadline: inputDate.value || '',
        notifyAt: inputNotify.value || '',
        notified: false,
        priority: "Sedang",
        status: "",
        completed: false,
        notesText: inputNotes.value.trim(),
        notesHTML: "",
        image: pendingImage
      };
      await saveTodo(todo);
      todos.push(todo)
    }
    resetForm();
    renderTodos();
  });
const cameraVideo = document.getElementById('camera-video');
const cameraStartBtn = document.getElementById('cameraStart');
const takeButton = document.getElementById('takeButton');
const cameraStopBtn = document.getElementById('cameraStop');
const imagePreview = document.getElementById('imagePreview');
const imageRemoveBtn = document.getElementById('imageRemove');

let stream = null;
let pendingImage = '';

async function getStream() {
  return await navigator.mediaDevices.getUserMedia({video: true});
}

function cameraLaunch(s){
  cameraVideo.srcObject = s;
  cameraVideo.hidden= false;
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
  cameraVideo.srcObject= null;
  cameraVideo.hidden = true;
  takeButton.hidden = true;
  cameraStopBtn.hidden = true;
  cameraStartBtn.hidden  = false;
}

function setPendingImage(dataUrl){
  pendingImage = dataUrl;
  imagePreview.hidden = !dataUrl;
  imageRemoveBtn.hidden = !dataUrl;
  if(dataUrl) imagePreview.src = dataUrl;
  else imagePreview.removeAttribute('src');
}

function cameraTakePicture(){
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth;
  canvas.height = cameraVideo.videoHeight;
  canvas.getContext('2d').drawImage(cameraVideo, 0 , 0 , canvas.width, canvas.height);
  setPendingImage(canvas.toDataURL('image/jpeg', 0.8));
  cameraStop();
}

cameraStartBtn.addEventListener('click', async() => {
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

const themeToggle =  document.getElementById('themeToggle');
function applyTheme(theme){
  document.documentElement.dataset.theme = theme;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
}

applyTheme(localStorage.getItem('theme') || 'light');

themeToggle.addEventListener('click', () => {
  const next =document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('theme', next);
});

async function init(){
  db = await openDB();
  todos = await tx('readonly', (store) => store.getAll());
  renderTodos();
}

init();

async function checkReminders() {
  for(const t of todos){
    if(t.notifyAt && !t.notified && new Date(t.notifyAt) <= Date.now()) {
      if(Notification.permission === 'granted'){
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('Reminder: ' + t.text, {body: 'Deadline: ' + formatDate(t.deadline)});
        t.notified = true;
        await saveTodo(t);
      }
    }
  }
}
setInterval(checkReminders, 15000);
let swReg;
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then((r) => (swReg = r));
}

