// Mengambil elemen dari HTML
const listSection = document.querySelector('.list');
const createForm = document.querySelector('form.create');
const detailSection = document.querySelector('.editToDo');
const header = document.querySelector("header");

const inputText = document.getElementById('newList');
const inputDate = document.getElementById('dateList');
const inputNotes = document.getElementById('message');

const submitBtn = document.querySelector('button[type="submit"]');
const formTitle = document.querySelector('.forCreate');

let todos = [];
let nextId = 1;
let editingId = null;

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
  listSection.querySelectorAll('.todoList').forEach((el)=> el.remove());
  detailSection.querySelectorAll('.detailToDo').forEach((el)=> el.remove()); 
  todos.forEach((todo) => {
    listSection.appendChild(buildListItem(todo));

    detailSection.appendChild(buildDetailItem(todo));
  });
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
      label.style.opacity = '0.6';
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
    editBtn.addEventListener('click', () => startEdit(todo.id));

    const delBtn = document.createElement("button");
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
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
    article.appendChild(notesDiv);

    return article;
  }

    function toggleComplete(id) {
    const todo = todos.find((t) => t.id === id);
    if(!todo) return;
    todo.completed = !todo.completed;
    todo.status = todo.completed ? "done" : todo.status === "done" ? "" : todo.status;
    renderTodos();
    }

    function updateStatus(id, value){
      const todo = todos.find((t) => t.id === id);
      if(!todo) return;
      todo.status = value;
      todo.completed = value === "done";
      renderTodos();
    }

    function startEdit(id) {
      const todo = todos.find((t) => t.id === id);
      if(!todo) return;
      editingId = id;
      inputText.value = todo.text;
      inputDate.value = todo.deadline || '';
      inputNotes.value = todo.notesText || '';
      submitBtn.textContent = 'Update';
      if(formTitle) formTitle.textContent = 'Edit To Do';
      inputText.focus();
    }

    function resetForm() {
      editingId = null;
      createForm.reset();
      submitBtn.textContent = 'Add';
      if(formTitle) formTitle.textContent = 'Create a New To Do';
    }

    createForm.addEventListener('submit', function(e){
      e.preventDefault();

    const text = inputText.value.trim();
    if(!text) return;

    if(editingId !== null){
      const todo = todos.find((t) => t.id === editingId);
      if(todo){
        todo.text = text;
        todo.deadline = inputDate.value || '';
        todo.notesText = inputNotes.value.trim();
      }
    } else{
      todos.push({
        id: nextId++,
        text: text,
        deadline: inputDate.value || '',
        priority: "Sedang",
        status: "",
        completed: false,
        notesText: inputNotes.value.trim(),
        notesHTML: ""
      });
    }
    resetForm();
    renderTodos();
  });

  function injectDarkModeStyles() {
  const style = document.createElement("style");
  style.textContent = `
    body.dark { background-color: #1e1e24; color: #eee; }
    body.dark header, body.dark footer { background-color: #14141a; color: #eee; }
    body.dark .list, body.dark .todoList, body.dark .create,
    body.dark .editToDo, body.dark .detailToDo, body.dark .notes {
      background-color: #2b2b34; color: #eee;
    }
    body.dark .notes { background-color: #3a3225; border-left-color: #a9793f; }
    body.dark button { background-color: #7a5a46; color: #fff; }
    body.dark a { color: #8ab4ff; }
  `;
  document.head.appendChild(style);
}

function addThemeToggleButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = "🌙 Dark Mode";
  btn.style.marginTop = "10px";
  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    btn.textContent = document.body.classList.contains("dark")
      ? "☀️ Light Mode"
      : "🌙 Dark Mode";
  });
  header.appendChild(btn);
}

todos = scrapeInitialTodos();
nextId = todos.length + 1;
injectDarkModeStyles();
addThemeToggleButton();
renderTodos();
