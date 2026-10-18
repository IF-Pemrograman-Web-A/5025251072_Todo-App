<nav class="menu-bar" aria-label="Main menu">
  <a href="index.php?page=personal" <?= $page === 'personal' ? 'aria-current="page"' : '' ?>>Personal</a>
  <a href="index.php?page=shared" <?= $page === 'shared' ? 'aria-current="page"' : '' ?>>Shared</a>

  <form class="user-switch" method="post" action="actions/switch_user.php">
    <label for="userSwitch">Pengguna:</label>
    <select id="userSwitch" name="user_id">
      <?php foreach ($users as $u): ?>
        <option value="<?= (int)$u['id'] ?>" <?= (int)$u['id'] === $me ? 'selected' : '' ?>><?= e($u['name']) ?></option>
      <?php endforeach; ?>
    </select>
    <input type="hidden" name="page" value="<?= $page ?>">
    <button type="submit">Ganti</button>
  </form>
</nav>