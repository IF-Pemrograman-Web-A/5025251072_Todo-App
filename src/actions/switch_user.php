<?php
require __DIR__ . '/../config.php';
require_post();

$id   = (int)($_POST['user_id'] ?? 0);
$page = page_name($_POST['page'] ?? 'personal');

// Pastikan pengguna yang dipilih tersedia di database
$s = $conn->prepare("SELECT id FROM users WHERE id=?");
$s->bind_param("i", $id);
$s->execute();

if ($s->get_result()->fetch_assoc()) {
    $_SESSION['uid'] = $id;
}

redirect('../index.php?page=' . $page);