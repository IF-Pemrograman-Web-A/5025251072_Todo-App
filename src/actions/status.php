<?php
require __DIR__ . '/../config.php';
require_post();

$uid    = current_user_id();
$id     = (int)($_POST['id'] ?? 0);
$page   = page_name($_POST['page'] ?? 'personal');
$status = $_POST['status'] ?? '';

// Validasi status
if (!in_array($status, ['', 'done', 'onProgress', 'none'], true)) {
    $status = '';
}

// Update status hanya jika Todo milik pengguna aktif
$stmt = $conn->prepare(
    "UPDATE todos SET status=? WHERE id=? AND user_id=?"
);
$stmt->bind_param("sii", $status, $id, $uid);
$stmt->execute();

// Periksa apakah Todo milik pengguna ditemukan
if ($stmt->affected_rows === 0) {
    $check = $conn->prepare(
        "SELECT id FROM todos WHERE id=? AND user_id=?"
    );
    $check->bind_param("ii", $id, $uid);
    $check->execute();

    if (!$check->get_result()->fetch_assoc()) {
        flash('Todo tidak ditemukan atau bukan milikmu.');
        redirect('../index.php?page=' . $page);
    }
}

flash('Status todo diperbarui.');
redirect('../index.php?page=' . $page);