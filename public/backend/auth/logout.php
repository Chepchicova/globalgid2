<?php
// backend/auth/logout.php
require_once __DIR__ . '/../config/cors.php';
header('Content-Type: application/json');
session_start();

// Очищаем сессию
$_SESSION = array();

// Удаляем cookie сессии
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Уничтожаем сессию
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Вы успешно вышли из системы'
]);
?>