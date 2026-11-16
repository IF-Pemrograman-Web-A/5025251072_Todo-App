<?php

// api/todos.php -> handler untuk setiap endpoint (satu fungsi = satu endpoint)

function fetch_todo(mysqli $conn, int $id): ?array
{
    $s = $conn->prepare("
        SELECT t.*, u.name AS owner
        FROM todos t
        JOIN users u ON u.id = t.user_id
        WHERE t.id = ?
    ");

    $s->bind_param("i", $id);
    $s->execute();

    return $s->get_result()->fetch_assoc() ?: null;
}

// 404 jika todo tidak ada, 403 jika ada tapi tidak boleh diakses user ini
function load_todo(mysqli $conn, array $user, int $id, bool $ownerOnly): array
{
    $todo = fetch_todo($conn, $id);

    if (!$todo) {
        api_error(404, "Todo dengan id $id tidak ditemukan");
    }

    $isOwner = (int)$todo['user_id'] === (int)$user['id'];

    if ($ownerOnly && !$isOwner) {
        api_error(403, 'Hanya pemilik todo yang boleh mengubah atau menghapusnya');
    }

    if (!$ownerOnly && !$isOwner && !$todo['is_shared']) {
        api_error(403, 'Todo ini bersifat pribadi');
    }

    return $todo;
}

// GET /api/me
function handle_me(mysqli $conn, array $user): void
{
    api_json(200, ['data' => $user]);
}

// GET /api/todos?scope=personal|shared
function handle_list(mysqli $conn, array $user): void
{
    $scope = $_GET['scope'] ?? 'personal';

    if (!in_array($scope, ['personal', 'shared'], true)) {
        api_error(400, "Parameter scope harus 'personal' atau 'shared'");
    }

    $order = "ORDER BY t.deadline IS NULL, t.deadline, t.id";

    $sql = "SELECT t.*, u.name AS owner
            FROM todos t
            JOIN users u ON u.id = t.user_id ";

    if ($scope === 'shared') {
        $s = $conn->prepare($sql . "WHERE t.is_shared = 1 $order");
    } else {
        $s = $conn->prepare($sql . "WHERE t.user_id = ? $order");
        $s->bind_param("i", $user['id']);
    }

    $s->execute();

    $rows = $s->get_result()->fetch_all(MYSQLI_ASSOC);

    api_json(200, [
        'data' => array_map('todo_json', $rows),
        'count' => count($rows)
    ]);
}

// GET /api/todos/{id}
function handle_show(mysqli $conn, array $user, int $id): void
{
    api_json(200, [
        'data' => todo_json(load_todo($conn, $user, $id, false))
    ]);
}

// POST /api/todos
function handle_create(mysqli $conn, array $user): void
{
    $in = read_json();

    [$clean, $errors] = validate_todo($in, false);

    $image = null;

    if (!empty($in['image_data'])) {
        $image = is_string($in['image_data'])
            ? save_image($in['image_data'])
            : null;

        if (!$image) {
            $errors['image_data'] = 'harus data URL JPEG base64 (maks 5 MB)';
        }
    }

    if ($errors) {
        delete_image($image);
        api_error(422, 'Data tidak valid', $errors);
    }

    $d = $clean + [
        'deadline' => null,
        'notify_at' => null,
        'priority' => 'Sedang',
        'notes' => null,
        'is_shared' => 0
    ];

    $uid = (int)$user['id'];

    $s = $conn->prepare("
        INSERT INTO todos
        (user_id, title, deadline, notify_at, priority, notes, image, is_shared)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $s->bind_param(
        "issssssi",
        $uid,
        $d['title'],
        $d['deadline'],
        $d['notify_at'],
        $d['priority'],
        $d['notes'],
        $image,
        $d['is_shared']
    );

    $s->execute();

    $id = $conn->insert_id;

    header('Location: ' . API_BASE . '/todos/' . $id);

    api_json(201, [
        'data' => todo_json(fetch_todo($conn, $id))
    ]);
}

// PUT /api/todos/{id} (ganti seluruh resource) dan PATCH (ubah sebagian)
function handle_update(mysqli $conn, array $user, int $id, bool $partial): void
{
    $old = load_todo($conn, $user, $id, true);

    $in = read_json();

    [$clean, $errors] = validate_todo($in, $partial);

    if ($partial && !$in) {
        $errors['_'] = 'kirim minimal satu field yang ingin diubah';
    }

    // Foto: image_data = ganti foto, remove_image = true -> hapus foto
    $image = $old['image'];
    $newImage = null;

    if (!empty($in['image_data'])) {
        $newImage = is_string($in['image_data'])
            ? save_image($in['image_data'])
            : null;

        if (!$newImage) {
            $errors['image_data'] = 'harus data URL JPEG base64 (maks 5 MB)';
        } else {
            $image = $newImage;
        }
    } elseif (!empty($in['remove_image'])) {
        $image = null;
    }

    if ($errors) {
        delete_image($newImage);
        api_error(422, 'Data tidak valid', $errors);
    }

    // PUT: field yang tidak dikirim kembali ke default.
    // PATCH: tetap memakai nilai lama.
    $defaults = [
        'deadline' => null,
        'notify_at' => null,
        'priority' => 'Sedang',
        'status' => '',
        'notes' => null,
        'is_shared' => 0
    ];

    $base = $partial ? $old : $defaults;
    $d = $clean + $base;

    $s = $conn->prepare("
        UPDATE todos SET
            title = ?,
            deadline = ?,
            notify_at = ?,
            priority = ?,
            status = ?,
            notes = ?,
            image = ?,
            is_shared = ?
        WHERE id = ?
    ");

    $s->bind_param(
        "sssssssii",
        $d['title'],
        $d['deadline'],
        $d['notify_at'],
        $d['priority'],
        $d['status'],
        $d['notes'],
        $image,
        $d['is_shared'],
        $id
    );

    $s->execute();

    // Buang foto lama jika foto berubah
    if ($image !== $old['image']) {
        delete_image($old['image']);
    }

    api_json(200, [
        'data' => todo_json(fetch_todo($conn, $id))
    ]);
}

// PUT
function handle_put(mysqli $conn, array $user, int $id): void
{
    handle_update($conn, $user, $id, false);
}

// PATCH
function handle_patch(mysqli $conn, array $user, int $id): void
{
    handle_update($conn, $user, $id, true);
}

// DELETE /api/todos/{id}
function handle_delete(mysqli $conn, array $user, int $id): void
{
    $old = load_todo($conn, $user, $id, true);

    $s = $conn->prepare("DELETE FROM todos WHERE id = ?");
    $s->bind_param("i", $id);
    $s->execute();

    delete_image($old['image']);

    api_json(204);
}