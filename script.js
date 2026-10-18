// ==================================================================
// [E02a] The JavaScript Dungeon - Todo App Logic
// This script works with the EXISTING index.html / style.css as-is.
// It does NOT rely on any new id/class added to the HTML file -
// it only uses selectors that already exist there (.list, .create,
// .editToDo, .todoList, .detailToDo, #newList, #dateList, #message).
// Anything extra it needs (Edit/Delete buttons, dark mode button,
// dark mode styling) is created dynamically with JavaScript.
// ==================================================================

// ----- Grab the existing sections from the original HTML -----
const listSection = document.querySelector(".list");
const createForm = document.querySelector("form.create");
const detailSection = document.querySelector(".editToDo");
const header = document.querySelector("header");

const inputText = document.getElementById("newList");
const inputDate = document.getElementById("dateList");
const inputNotify = document.getElementById('notifyList');
const inputNotes = document.getElementById("message");
const submitBtn = createForm.querySelector("button[type='submit']");
const formTitle = createForm.querySelector(".forCreate");

// ----- In-memory data (resets to default on refresh) -----
let todos = [];
let nextId = 1;
let editingId = null; // null = create mode, otherwise the id being edited

// ==================================================================
// STEP 1: Read the todos that are already written in index.html
// so we don't have to duplicate that content inside the JS file.
// ==================================================================
function scrapeInitialTodos() {
  const listItems = listSection.querySelectorAll(".todoList");
  const detailItems = detailSection.querySelectorAll(".detailToDo");
  const result = [];

  listItems.forEach((item, index) => {
    const checkbox = item.querySelector("input");
    const label = item.querySelector("label");
    const time = item.querySelector("time");
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
      if (select) status = select.value;

      const notesEl = detail.querySelector(".notes");
      if (notesEl) {
        const clone = notesEl.cloneNode(true);
        const sbNotes = clone.querySelector(".sbNotes");
        if (sbNotes) sbNotes.remove();
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
      deadline: time ? time.getAttribute("datetime") : "",
      priority: priority,
      status: status,
      completed: checkbox ? checkbox.checked : false,
      notesText: notesText,
      notesHTML: notesHTML
    });
  });

  return result;
}

// ==================================================================
// STEP 2: Render both panels from the `todos` array.
// This is the DOM Manipulation part: it replaces the content of
// .list and .editToDo, but keeps their existing <h2> headings intact.
// ==================================================================
function renderTodos() {
  // Remove old rendered items but keep the section's <h2>
  listSection.querySelectorAll(".todoList").forEach((el) => el.remove());
  detailSection.querySelectorAll(".detailToDo").forEach((el) => el.remove());

  todos.forEach((todo) => {
    listSection.appendChild(buildListItem(todo));
    detailSection.appendChild(buildDetailItem(todo));
  });
}

function formatDate(dtString) {
  if (!dtString) return "Belum ditentukan";
  const d = new Date(dtString);
  if (isNaN(d)) return dtString;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusLabel(value) {
  if (value === "done") return "Done";
  if (value === "onProgress") return "On Progress";
  if (value === "none") return "None";
  return "Pilih status";
}

// ---- Build one <article class="todoList"> (left panel) ----
function buildListItem(todo) {
  const article = document.createElement("article");
  article.className = "todoList";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = `toDo${todo.id}`;
  checkbox.checked = todo.completed;
  checkbox.addEventListener("change", () => toggleComplete(todo.id));

  const wrapper = document.createElement("div");

  const label = document.createElement("label");
  label.setAttribute("for", `toDo${todo.id}`);
  label.textContent = todo.text;
  if (todo.completed) {
    label.style.textDecoration = "line-through";
    label.style.opacity = "0.6";
  }

  const p = document.createElement("p");
  const time = document.createElement("time");
  time.setAttribute("datetime", todo.deadline || "");
  time.textContent = formatDate(todo.deadline);
  p.appendChild(time);

  // Edit / Delete buttons (created purely via JS, not present in the HTML)
  const actions = document.createElement("div");
  actions.style.marginTop = "6px";
  actions.style.display = "flex";
  actions.style.gap = "8px";

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => startEdit(todo.id));

  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => deleteTodo(todo.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  wrapper.appendChild(label);
  wrapper.appendChild(p);
  wrapper.appendChild(actions);

  article.appendChild(checkbox);
  article.appendChild(wrapper);
  return article;
}

// ---- Build one <article class="detailToDo"> (right panel) ----
function buildDetailItem(todo) {
  const article = document.createElement("article");
  article.className = "detailToDo";

  const h3 = document.createElement("h3");
  h3.className = "todos";
  h3.textContent = todo.text;

  const statusP = document.createElement("p");
  const statusLbl = document.createElement("label");
  statusLbl.setAttribute("for", `progress-${todo.id}`);
  statusLbl.textContent = "Status:";
  const select = document.createElement("select");
  select.id = `progress-${todo.id}`;
  ["", "done", "onProgress", "none"].forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = statusLabel(val);
    if (todo.status === val) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", (e) => updateStatus(todo.id, e.target.value));
  statusP.appendChild(statusLbl);
  statusP.appendChild(select);

  const deadlineP = document.createElement("p");
  deadlineP.className = "deadline";
  deadlineP.append("Deadline: ");
  const timeEl = document.createElement("time");
  timeEl.setAttribute("datetime", todo.deadline || "");
  timeEl.textContent = formatDate(todo.deadline);
  deadlineP.appendChild(timeEl);

  const priorityP = document.createElement("p");
  priorityP.className = "priority";
  priorityP.textContent = `Prioritas: ${todo.priority}`;

  const notesDiv = document.createElement("div");
  notesDiv.className = "notes";
  const notesLabel = document.createElement("p");
  notesLabel.className = "sbNotes";
  notesLabel.textContent = "Notes:";
  notesDiv.appendChild(notesLabel);
  notesDiv.appendChild(document.createTextNode(todo.notesText || "(tidak ada catatan)"));
  if (todo.notesHTML) {
    const span = document.createElement("span");
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

// ==================================================================
// ACTIONS
// ==================================================================
function toggleComplete(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.completed = !todo.completed;
  todo.status = todo.completed ? "done" : todo.status === "done" ? "" : todo.status;
  renderTodos();
}

function updateStatus(id, value) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.status = value;
  todo.completed = value === "done";
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  if (editingId === id) resetForm();
  renderTodos();
}

function startEdit(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  editingId = id;
  inputText.value = todo.text;
  inputDate.value = todo.deadline || "";
  inputNotes.value = todo.notesText || "";
  submitBtn.textContent = "Update";
  if (formTitle) formTitle.textContent = "Edit To Do";
  inputText.focus();
}

function resetForm() {
  editingId = null;
  createForm.reset();
  submitBtn.textContent = "Add";
  if (formTitle) formTitle.textContent = "Create a New To Do";
}


createForm.addEventListener("submit", function (e) {
  e.preventDefault(); 

  const text = inputText.value.trim();
  if (!text) return;

  if (editingId !== null) {
    const todo = todos.find((t) => t.id === editingId);
    if (todo) {
      todo.text = text;
      todo.deadline = inputDate.value;
      todo.notesText = inputNotes.value.trim();
    }
  } else {
    todos.push({
      id: nextId++,
      text: text,
      deadline: inputDate.value,
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

// ==================================================================
// DARK MODE: button + styles are injected purely via JS,
// so style.css and index.html don't need to be touched at all.
// ==================================================================
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

// ==================================================================
// INIT
// ==================================================================
todos = scrapeInitialTodos();
nextId = todos.length + 1;
injectDarkModeStyles();
addThemeToggleButton();
renderTodos();
