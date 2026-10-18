<?php
require __DIR__ . '/../config.php';
require_post();

$uid    = current_user_id();
$id     = (int)($_POST['id'] ?? 0);
$shared = isset($_POST['is_shared']) ? 1 : 0;
$page   = page_name($_POST['page'] ?? 'personal');

// Hanya pemilik yang boleh mengubah Todo
$s = $conn->prepare("SELECT image FROM todos WHERE id=? AND user_id=?");
$s->bind_param("ii", $id, $uid);
$s->execute();
$old = $s->get_result()->fetch_assoc();

if (!$old) {
    flash('Todo tidak ditemukan atau bukan milikmu.');
    redirect('../index.php?page=' . $page);
}

$title = trim($_POST['title'] ?? '');

if ($title === '') {
    flash('Judul todo wajib diisi.');
    redirect('../index.php?page=' . $page);
}

$deadline = to_dt($_POST['deadline'] ?? '');
$notify   = to_dt($_POST['notify_at'] ?? '');

$priority = in_array(
    $_POST['priority'] ?? '',
    ['Tinggi', 'Sedang', 'Rendah'],
    true
) ? $_POST['priority'] : 'Sedang';

$notes = trim($_POST['notes'] ?? '');

// Tentukan foto baru tanpa langsung menghapus foto lama
$image  = $old['image'];
$newImg = save_image($_POST['image_data'] ?? '');
$removeOldImage = false;

if ($newImg) {
    $image = $newImg;
    $removeOldImage = true;
} elseif (isset($_POST['remove_image'])) {
    $image = null;
    $removeOldImage = true;
}

$stmt = $conn->prepare(
    "UPDATE todos
     SET title=?, deadline=?, notify_at=?, priority=?, notes=?, image=?, is_shared=?
     WHERE id=? AND user_id=?"
);

$stmt->bind_param(
    "ssssssiii",
    $title,
    $deadline,
    $notify,
    $priority,
    $notes,
    $image,
    $shared,
    $id,
    $uid
);

$stmt->execute();

// Hapus foto lama hanya setelah update database berhasil
if ($removeOldImage && $old['image']) {
    delete_image($old['image']);
}

flash('Todo berhasil diperbarui.');
redirect('../index.php?page=' . $page);