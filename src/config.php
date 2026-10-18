<?php
// config.php - koneksi database + fungsi bantu (dipakai semua halaman)
date_default_timezone_set('Asia/Jakarta');
session_start();

function e($s) { return htmlspecialchars((string)($s ?? ''), ENT_QUOTES, 'UTF-8'); }

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
  $conn = new mysqli(
    getenv('DB_HOST') ?: 'localhost',
    getenv('DB_USER') ?: 'root',
    getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    getenv('DB_NAME') ?: 'todo_app'
  );
  $conn->set_charset('utf8mb4');
} catch (mysqli_sql_exception $ex) {
  http_response_code(500);
  die('Koneksi database gagal: ' . e($ex->getMessage()) .
      '<br>Kalau baru menjalankan Docker, tunggu ~30 detik lalu refresh.');
}

// pengguna saat ini (tanpa login, dipilih lewat menu bar)
function current_user_id(): int { return (int)($_SESSION['uid'] ?? 1); }

// pesan sekali tampil
function flash(string $msg): void { $_SESSION['flash'] = $msg; }
function pull_flash(): ?string {
  $m = $_SESSION['flash'] ?? null; unset($_SESSION['flash']); return $m;
}

// bantuan untuk file di folder actions/
function redirect(string $url): void { header('Location: ' . $url); exit; }
function require_post(): void {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') redirect('../index.php');
}
function page_name($v): string { return $v === 'shared' ? 'shared' : 'personal'; }

// tanggal: input datetime-local <-> DATETIME MySQL
function to_dt($v): ?string {
  $v = trim((string)$v);
  if ($v === '') return null;
  $t = strtotime($v);
  return $t ? date('Y-m-d H:i:s', $t) : null;
}
function dt_attr($v): string {
  return $v ? date('Y-m-d\TH:i', strtotime($v)) : '';
}
function dt_show($v): string {
  return $v ? date('d M Y H.i', strtotime($v)) : 'Belum ditentukan';
}

// file handling: simpan & hapus foto (materi slide 70-73)
function save_image(string $dataUrl): ?string {
  $prefix = 'data:image/jpeg;base64,';
  if (!str_starts_with($dataUrl, $prefix)) return null;
  $bin = base64_decode(substr($dataUrl, strlen($prefix)), true);
  if ($bin === false || strlen($bin) > 5 * 1024 * 1024) return null;
  $info = @getimagesizefromstring($bin);
  if (!$info || $info[2] !== IMAGETYPE_JPEG) return null;
  $dir = __DIR__ . '/uploads';
  if (!is_dir($dir)) mkdir($dir, 0775, true);
  $path = 'uploads/todo_' . bin2hex(random_bytes(8)) . '.jpg';
  return file_put_contents(__DIR__ . '/' . $path, $bin) !== false ? $path : null;
}
function delete_image(?string $path): void {
  if ($path && preg_match('#^uploads/todo_[a-f0-9]+\.jpg$#', $path) && file_exists(__DIR__ . '/' . $path)) {
    unlink(__DIR__ . '/' . $path);
  }
}