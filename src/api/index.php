<?php

// api/index.php - front controller: semua request /api/... masuk lewat sini

define('API_MODE', true);

require __DIR__ . '/../config.php';
require __DIR__ . '/lib.php';
require __DIR__ . '/todos.php';

// "/api" bagian awal URL, mis. /api/todos/5 -> API_BASE=/api, $path=/todos/5
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$pos = strpos($uri, '/api');

define('API_BASE', substr($uri, 0, $pos + 4));

$path = rtrim(substr($uri, $pos + 4), '/') ?: '/';

// [metode, pola URL, fungsi handler]
$routes = [
    ['GET', '#^/me$#', 'handle_me'],
    ['GET', '#^/todos$#', 'handle_list'],
    ['POST', '#^/todos$#', 'handle_create'],
    ['GET', '#^/todos/(\d+)$#', 'handle_show'],
    ['PUT', '#^/todos/(\d+)$#', 'handle_put'],
    ['PATCH', '#^/todos/(\d+)$#', 'handle_patch'],
    ['DELETE', '#^/todos/(\d+)$#', 'handle_delete'],
];

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $allowed = [];

    foreach ($routes as [$m, $pattern, $handler]) {
        if (!preg_match($pattern, $path, $match)) {
            continue;
        }

        if ($m !== $method) {
            $allowed[] = $m;
            continue;
        }

        $user = authenticate($conn); // 401 jika key salah

        $args = array_map('intval', array_slice($match, 1)); // id dari URL

        $handler($conn, $user, ...$args);
    }

    if ($allowed) {
        // URL benar, metode salah
        header('Allow: ' . implode(', ', $allowed));
        api_error(405, "Metode $method tidak didukung untuk endpoint ini");
    }

    api_error(404, 'Endpoint tidak ditemukan');

} catch (Throwable $ex) {
    error_log($ex);

    api_error(500, 'Terjadi kesalahan pada server');

    // detail hanya ke log server
}