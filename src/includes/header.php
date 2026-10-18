<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo List - <?= ucfirst($page) ?></title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap" rel="stylesheet">
</head>
<body>
    <a href="#main-content" class="skip-to-content">Skip to main content</a>
    <header>
        <h1 class="title">Todo List</h1>
        <p>Hello, <?= e($meName) ?>! You can survive one more day!</p>
        <button type="button" id="themeToggle" aria-pressed="false">Dark mode</button>
        <p id="status" class="visually-hidden" role="status" aria-live="polite"></p>
    </header>