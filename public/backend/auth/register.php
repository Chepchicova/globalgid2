<?php
// backend/auth/register.php
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
if (empty($data['firstname']) || empty($data['lastname']) || empty($data['email']) || empty($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Все поля обязательны']);
    exit;
}

$firstname = trim($data['firstname']);
$lastname = trim($data['lastname']);
$email = trim($data['email']);
$password = $data['password'];

// Валидация
if (strlen($password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Пароль должен быть не менее 6 символов']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Неверный формат email']);
    exit;
}

try {
    // Проверяем есть ли такой email
    $check_query = "SELECT user_id FROM Users WHERE email = ?";
    $check_stmt = $pdo->prepare($check_query);
    $check_stmt->execute([$email]);
    
    if ($check_stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'message' => 'Этот email уже используется']);
        exit;
    }
    
    // Хэшируем пароль
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Вставляем пользователя
    $insert_query = "INSERT INTO Users (firstname, lastname, email, password_hash) VALUES (?, ?, ?, ?)";
    $insert_stmt = $pdo->prepare($insert_query);
    $result = $insert_stmt->execute([$firstname, $lastname, $email, $password_hash]);
    
    if ($result) {
        // Получаем ID нового пользователя
        $user_id = $pdo->lastInsertId();
        
        // Находим пользователя чтобы получить все данные
        $user_query = "SELECT * FROM Users WHERE user_id = ?";
        $user_stmt = $pdo->prepare($user_query);
        $user_stmt->execute([$user_id]);
        $user = $user_stmt->fetch(PDO::FETCH_ASSOC);
        
        // ВАЖНО: Авторизуем пользователя сразу после регистрации
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['firstname'] = $user['firstname'];
        $_SESSION['lastname'] = $user['lastname'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'] ?? 'client';
        $_SESSION['logged_in'] = true;
        
        echo json_encode([
            'success' => true,
            'message' => 'Регистрация успешна! Вы автоматически вошли в систему.',
            'user' => [
                'id' => $user['user_id'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'client'
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Ошибка при регистрации']);
    }
    
} catch (Exception $e) {
    error_log("Register error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка сервера'
    ]);
}
?>