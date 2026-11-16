<?php

const PRIORITIES = ['Tinggi', 'Sedang', 'Rendah'];
const STATUSES = ['', 'done', 'onProgress', 'none'];

// Respons

function api_json(int $status, $payload = null) : void {
    http_response_code($status);
    if($payload !== null) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}

function api_error(int $status, string $message, array $fields = []): void{
    $err = ['status' => $status, 'message' => $message];
    if($fields) $err['fields'] = $fields;
    api_json($status, ['error' => $err]);
}

//request

function read_json(): array {
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($type, 'application/json') !== 0){
        api_error(415, 'Content-Type harus application/json');
    }

    $raw = file_get_contents('php://input');
    if(trim($raw) === '') api_error(400, 'Body request kosong');

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || ($data !== [] && array_is_list($data))) {
        api_error(400, 'Body bukan JSON object yang valid');
    }
    return $data;
}

// autentikasi 
function authenticate(mysqli $conn): array {
    $key = trim($_SERVER['HTTP_X_API_KEY'] ?? '');
    if($key === '') api_error(401, 'API key wajib dikirim lewat header X-API-key');

    $s = $conn->prepare("SELECT id, name FROM users WHERE api_key = ?");
    $s->bind_param("s", $key);
    $s->execute();
    $user = $s->get_result()->fetch_assoc();
    if(!$user) api_error(401, 'API key tidak valid, user tidak ditemukan');
    return $user;
}

// bentuk data 
function iso(?string $dt): ?string {
return $dt ? date('c', strtotime($dt)) : null;
}
function todo_json(array $r): array {
return [
    'id' => (int)$r['id'],
    'user_id' => (int)$r['user_id'],
    'owner' => $r['owner'] ?? null,
    'title' => $r['title'],
    'deadline' => iso($r['deadline']),
    'notify_at' => iso($r['notify_at']),
    'priority' => $r['priority'],
    'status' => $r['status'],
    'notes' => $r['notes'],
    'image' => $r['image'],
    'is_shared' => (bool)$r['is_shared'],
    'created_at' => iso($r['created_at']),
];
}

//validasi


function validate_todo(array $in, bool $partial): array {
    // $partial = true (PATCH): hanya field yang dikirim yang diperiksa.
    // $partial = false (POST/PUT): title wajib ada.
    // Hasil: [data_bersih, error_per_field]

    $out = [];
    $err = [];

    if (array_key_exists('title', $in)) {
        $t = is_string($in['title']) ? trim($in['title']) : '';

        if ($t === '') {
            $err['title'] = 'wajib diisi (teks)';
        } elseif (mb_strlen($t) > 128) {
            $err['title'] = 'maksimal 128 karakter';
        } else {
            $out['title'] = $t;
        }
    } elseif (!$partial) {
        $err['title'] = 'wajib diisi';
    }

    foreach (['deadline', 'notify_at'] as $f) {
        if (!array_key_exists($f, $in)) continue;

        $v = $in[$f];

        if ($v === null || $v === '') {
            $out[$f] = null;
            continue;
        }

        $ts = is_string($v) ? strtotime($v) : false;

        if ($ts === false) {
            $err[$f] = 'format tanggal tidak valid (contoh 2026-11-20T10:00)';
        } else {
            $out[$f] = date('Y-m-d H:i:s', $ts);
        }
    }

    if (array_key_exists('priority', $in)) {
        if (in_array($in['priority'], PRIORITIES, true)) {
            $out['priority'] = $in['priority'];
        } else {
            $err['priority'] = 'harus salah satu dari: ' . implode(', ', PRIORITIES);
        }
    }

    if (array_key_exists('status', $in)) {
        if (in_array($in['status'], STATUSES, true)) {
            $out['status'] = $in['status'];
        } else {
            $err['status'] = "harus salah satu dari: '', done, onProgress, none";
        }
    }

    if (array_key_exists('notes', $in)) {
        if ($in['notes'] === null || is_string($in['notes'])) {
            $n = trim((string)$in['notes']);
            $out['notes'] = $n === '' ? null : $n;
        } else {
            $err['notes'] = 'harus berupa teks';
        }
    }

    if (array_key_exists('is_shared', $in)) {
        if (is_bool($in['is_shared']) || in_array($in['is_shared'], [0, 1], true)) {
            $out['is_shared'] = (int)$in['is_shared'];
        } else {
            $err['is_shared'] = 'harus true atau false';
        }
    }

    return [$out, $err];
}


