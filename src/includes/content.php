<?php
// content.php - panel kiri (daftar + form) dan panel kanan (detail)
$order = "ORDER BY t.deadline IS NULL, t.deadline, t.id";
if ($page === 'shared') {
  $stmt = $conn->prepare("SELECT t.*, u.name AS owner FROM todos t JOIN users u ON u.id=t.user_id
                          WHERE t.is_shared=1 $order");
} else {
  $stmt = $conn->prepare("SELECT t.*, u.name AS owner FROM todos t JOIN users u ON u.id=t.user_id
                          WHERE t.user_id=? $order");
  $stmt->bind_param("i", $me);
}
$stmt->execute();
$todos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

$edit = null;                                   // mode edit: index.php?page=..&edit=ID
if (isset($_GET['edit'])) {
  $s = $conn->prepare("SELECT * FROM todos WHERE id=? AND user_id=?");
  $eid = (int)$_GET['edit'];
  $s->bind_param("ii", $eid, $me);
  $s->execute();
  $edit = $s->get_result()->fetch_assoc() ?: null;
}
$statusLabels = ['' => 'Pilih status', 'done' => 'Done', 'onProgress' => 'On Progress', 'none' => 'None'];
?>
<div class="leftPanel">
  <section class="list">
    <div id="todoList">
      <h2 tabindex="-1">List of Todos (<?= ucfirst($page) ?>)</h2>
      <?php foreach ($todos as $t): $mine = (int)$t['user_id'] === $me; ?>
        <article class="todoList"
          <?php if ($mine && $t['notify_at'] && $t['status'] !== 'done'): ?>
            data-notify="<?= e(dt_attr($t['notify_at'])) ?>" data-id="<?= (int)$t['id'] ?>" data-title="<?= e($t['title']) ?>"
          <?php endif; ?>>
          <input type="checkbox" id="toDo<?= (int)$t['id'] ?>" <?= $t['status'] === 'done' ? 'checked' : '' ?> disabled>
          <div>
            <label for="toDo<?= (int)$t['id'] ?>" <?= $t['status'] === 'done' ? 'style="text-decoration:line-through"' : '' ?>><?= e($t['title']) ?></label>
            <p>
              <time datetime="<?= e(dt_attr($t['deadline'])) ?>"><?= e(dt_show($t['deadline'])) ?></time>
              <span class="owner">oleh <?= e($t['owner']) ?></span>
            </p>
            <?php if ($mine): ?>
              <div class="actions">
                <a class="btn" href="index.php?page=<?= $page ?>&amp;edit=<?= (int)$t['id'] ?>#newList" aria-label="Edit <?= e($t['title']) ?>">Edit</a>
                <form method="post" action="actions/delete.php" onsubmit="return confirm('Hapus todo ini?')">
                  <input type="hidden" name="id" value="<?= (int)$t['id'] ?>">
                  <input type="hidden" name="page" value="<?= $page ?>">
                  <button type="submit" aria-label="Delete <?= e($t['title']) ?>">Delete</button>
                </form>
              </div>
            <?php endif; ?>
          </div>
        </article>
      <?php endforeach; ?>
      <?php if (!$todos): ?><p>Belum ada todo di menu ini.</p><?php endif; ?>
    </div>
  </section>

  <form class="create" method="post" action="actions/<?= $edit ? 'update' : 'create' ?>.php">
    <h2 class="forCreate"><?= $edit ? 'Edit To Do' : 'Create a New To Do' ?></h2>
    <?php if ($edit): ?><input type="hidden" name="id" value="<?= (int)$edit['id'] ?>"><?php endif; ?>
    <input type="hidden" name="page" value="<?= $page ?>">

    <label for="newList">New To Do:</label>
    <input type="text" id="newList" name="title" required aria-required="true" maxlength="128" value="<?= e($edit['title'] ?? '') ?>">
    <br><br>
    <label for="dateList">Deadline:</label>
    <input type="datetime-local" id="dateList" name="deadline" value="<?= e(dt_attr($edit['deadline'] ?? null)) ?>">
    <br><br>
    <label for="notifyList">Reminder time:</label>
    <input type="datetime-local" id="notifyList" name="notify_at" value="<?= e(dt_attr($edit['notify_at'] ?? null)) ?>">
    <br><br>
    <label for="priorityList">Prioritas:</label>
    <select id="priorityList" name="priority">
      <?php foreach (['Tinggi', 'Sedang', 'Rendah'] as $p): ?>
        <option value="<?= $p ?>" <?= ($edit['priority'] ?? 'Sedang') === $p ? 'selected' : '' ?>><?= $p ?></option>
      <?php endforeach; ?>
    </select>
    <br><br>
    <label for="message">Notes:</label>
    <textarea id="message" name="notes" rows="4" cols="50"><?= e($edit['notes'] ?? '') ?></textarea>
    <br>
    <label><input type="checkbox" name="is_shared" value="1"
      <?= ($edit ? !empty($edit['is_shared']) : $page === 'shared') ? 'checked' : '' ?>> Bagikan ke menu Shared</label>

    <fieldset>
      <legend>Photo (optional)</legend>
      <?php if ($edit && $edit['image']): ?>
        <img class="todo-image" src="<?= e($edit['image']) ?>" alt="Foto saat ini untuk <?= e($edit['title']) ?>">
        <label><input type="checkbox" name="remove_image" value="1"> Hapus foto ini</label>
        <br>
      <?php endif; ?>
      <button type="button" id="cameraStart">Open Camera</button>
      <button type="button" id="takeButton" hidden>Take photo</button>
      <button type="button" id="cameraStop" hidden>Close camera</button>

      <video id="camera-video" autoplay playsinline muted hidden aria-label="Live camera preview"></video>
      <img id="imagePreview" alt="Preview of the captured photo" hidden>
      <button type="button" id="imageRemove" hidden>Remove photo</button>
      <input type="hidden" id="imageData" name="image_data">
    </fieldset>
    <button type="submit"><?= $edit ? 'Update' : 'Add' ?></button>
    <?php if ($edit): ?><a class="btn" href="index.php?page=<?= $page ?>">Batal</a><?php endif; ?>
  </form>
</div>

<div class="rightPanel">
  <section class="editToDo">
    <h2>Detail To Do</h2>
    <?php foreach ($todos as $t): $mine = (int)$t['user_id'] === $me; ?>
      <article class="detailToDo">
        <h3 class="todos"><?= e($t['title']) ?></h3>
        <?php if ($mine): ?>
          <form method="post" action="actions/status.php">
            <input type="hidden" name="id" value="<?= (int)$t['id'] ?>">
            <input type="hidden" name="page" value="<?= $page ?>">
            <label for="progress-<?= (int)$t['id'] ?>">Status:</label>
            <select id="progress-<?= (int)$t['id'] ?>" name="status">
              <?php foreach ($statusLabels as $v => $l): ?>
                <option value="<?= $v ?>" <?= $t['status'] === $v ? 'selected' : '' ?>><?= $l ?></option>
              <?php endforeach; ?>
            </select>
            <button type="submit">Simpan status</button>
          </form>
        <?php else: ?>
          <p>Status: <?= e($statusLabels[$t['status']] ?? '-') ?> · dibagikan oleh <?= e($t['owner']) ?></p>
        <?php endif; ?>
        <p class="deadline">Deadline: <time datetime="<?= e(dt_attr($t['deadline'])) ?>"><?= e(dt_show($t['deadline'])) ?></time></p>
        <p class="priority">Prioritas: <?= e($t['priority']) ?></p>
        <?php if ($t['image']): ?>
          <img class="todo-image" src="<?= e($t['image']) ?>" alt="Photo for <?= e($t['title']) ?>">
        <?php endif; ?>
        <div class="notes">
          <p class="sbNotes">Notes:</p>
          <?= $t['notes'] ? nl2br(e($t['notes'])) : 'Tidak ada catatan' ?>
        </div>
      </article>
    <?php endforeach; ?>
    <?php if (!$todos): ?><p>Belum ada todo untuk ditampilkan.</p><?php endif; ?>
  </section>
</div>