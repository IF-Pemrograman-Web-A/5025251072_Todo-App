CREATE DATABASE IF NOT EXISTS todo_app 
CHARACTER SET utf8mb4;
USE todo_app;

DROP TABLE IF EXISTS todos;
DROP TABLE IF EXISTS users;

CREATE TABLE users(
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(64) NOT NULL
);

CREATE TABLE todos(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(128) NOT NULL,
    deadline DATETIME NULL,
    notify_at DATETIME NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'Sedang',
    status VARCHAR(16) NOT NULL DEFAULT '',
    notes TEXT NULL,
    image VARCHAR(255) NULL,
    is_shared TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name) VALUES ('Amel'), ('Budi'), ('Hesti');

INSERT INTO todos (user_id, title, deadline, priority, status, notes, is_shared) VALUES
(1, 'Makan', '2026-10-19 12:00:00', 'Tinggi', '', 'Beli makanan under 15k', 0),
(1, 'Ngerjain PWEB', '2026-10-19 08:30:00', 'Tinggi', 'onProgress', 'Memahami php', 1),
(1, 'Ngerjain PBO', '2026-10-20 17:30:00', 'Sedang', '', 'Pelajari materi', 0),
(1, 'Ngerjian KPPL sama kelompok', '2026-10-21 10:00:00', 'Sedang', '', 'Bahas tentang UML', 1),
(3, 'Mengumpulkan laporan', '2026-10-22 23:59:00', 'Tinggi', 'none', 'Upload ke classroom', 1);