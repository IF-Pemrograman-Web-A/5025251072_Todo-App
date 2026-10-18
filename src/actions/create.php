<?php
require __DIR__ . '/../config.php';
require_post();

$uid    = current_user_id();
$title  = trim($_POST['title'] ?? '');
$shared = isset($_POST['is_shared']) ? 1 : 0;

$page = page_name($_POST['page'] ?? 'personal');
$target = '../index.php?page=' . ($shared ? 'shared' : 'personal');

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
$image = save_image($_POST['image_data'] ?? '');

$stmt = $conn->prepare(
    "INSERT INTO todos
    (user_id, title, deadline, notify_at, priority, notes, image, is_shared)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
);

$stmt->bind_param(
    "issssssi",
    $uid,
    $title,
    $deadline,
    $notify,
    $priority,
    $notes,
    $image,
    $shared
);

$stmt->execute();

flash('Todo "' . $title . '" berhasil ditambahkan.');
redirect($target);