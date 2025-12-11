<?php
// Тестовый файл для проверки подключения
require_once "auth/cors.php";
header("Content-Type: application/json; charset=utf-8");

session_start();

echo json_encode([
    'success' => true,
    'message' => 'Admin API работает',
    'session_id' => session_id(),
    'role' => $_SESSION['role'] ?? 'не установлена',
    'user_id' => $_SESSION['user_id'] ?? 'не установлен',
    'method' => $_SERVER['REQUEST_METHOD'],
    'get_params' => $_GET
], JSON_UNESCAPED_UNICODE);

