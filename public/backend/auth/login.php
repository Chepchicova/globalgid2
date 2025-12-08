<?php
// backend/auth/login.php
require_once 'cors.php';
header('Content-Type: application/json');
session_start();

// Подключаем класс БД
require_once __DIR__ . '/../db.php';

// Создаем подключение
$database = new Database();
$pdo = $database->getConnection();

// Проверяем что подключение удалось
if (!$pdo) {
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных']);
    exit;
}

// Проверяем метод
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Только POST запросы']);
    exit;
}

// Получаем данные
$json = file_get_contents('php://input');

if (empty($json)) {
    echo json_encode(['success' => false, 'message' => 'Нет данных']);
    exit;
}

$data = json_decode($json, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Некорректный JSON']);
    exit;
}

// Проверяем поля
if (empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Введите email и пароль']);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

try {
    // Ищем пользователя
    $query = "SELECT * FROM Users WHERE email = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Неверный email или пароль']);
        exit;
    }
    
    // Проверяем пароль
    if (!password_verify($password, $user['password_hash'])) {
        echo json_encode(['success' => false, 'message' => 'Неверный email или пароль']);
        exit;
    }
    
    // Сохраняем в сессию
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['firstname'] = $user['firstname'];
    $_SESSION['lastname'] = $user['lastname'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['logged_in'] = true;
    
    echo json_encode([
        'success' => true,
        'message' => 'Вход выполнен успешно',
        'user' => [
            'id' => $user['user_id'],
            'firstname' => $user['firstname'],
            'lastname' => $user['lastname'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера'
    ]);
}
?>