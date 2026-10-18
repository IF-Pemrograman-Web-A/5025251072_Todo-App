<?php
require __DIR__ . '/../config.php';
require_post();

$uid  = current_user_id();
$id   = (int)($_POST['id'] ?? 0);
$page = page_name($_POST['page'] ?? 'personal');

// Cari Todo yang dimiliki pengguna aktif
$s = $conn->prepare(
    "SELECT image FROM todos WHERE id=? AND user_id=?"
);
$s->bind_param("ii", $id, $uid);
$s->execute();

$row = $s->get_result()->fetch_assoc();

if ($row) {
    // Hapus file foto jika ada
    $deleteImage = $row['image'];

    // Hapus Todo dari database
    $d = $conn->prepare(
        "DELETE FROM todos WHERE id=? AND user_id=?"
    );
    $d->bind_param("ii", $id, $uid);
    $d->execute();

    // Hapus foto setelah penghapusan Todo berhasil
    if ($d->affected_rows > 0) {
        delete_image($deleteImage);
        flash('Todo berhasil dihapus.');
    } else {
        flash('Todo gagal dihapus.');
    }
} else {
    flash('Todo tidak ditemukan atau bukan milikmu.');
}

redirect('../index.php?page=' . $page);