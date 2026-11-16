<?php
require __DIR__ . '/config.php';

$page  = page_name($_GET['page'] ?? 'personal');

$users = $conn->query("SELECT id, name, api_key FROM users ORDER BY id")
              ->fetch_all(MYSQLI_ASSOC);

$me = current_user_id();

$meName = 'Guest';
$meKey = '';

foreach ($users as $u) {
    if ((int)$u['id'] === $me) {
        $meName = $u['name'];
        $meKey = $u['api_key'];
    }
}

include __DIR__ . '/includes/header.php';
include __DIR__ . '/includes/menu-bar.php';
?>

<?php if ($msg = pull_flash()): ?>
    <p class="flash" role="status"><?= e($msg) ?></p>
<?php endif; ?>

<main id="main-content" tabindex="-1">
    <?php include __DIR__ . '/includes/content.php'; ?>
</main>

<?php include __DIR__ . '/includes/footer.php'; ?>
