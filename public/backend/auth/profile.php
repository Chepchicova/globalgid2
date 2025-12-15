<?php
// C:\xampp\htdocs\globalgid\public\backend\auth\profile.php

require_once __DIR__ . '/../config/cors.php';
header('Content-Type: application/json');

session_start();

// Проверяем авторизацию
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => false,
        'message' => 'Не авторизован'
    ]);
    exit();
}

// Подключаем класс БД
require_once __DIR__ . '/../config/db.php';

// Создаем подключение
$database = new Database();
$pdo = $database->getConnection();

// Проверяем что подключение удалось
if (!$pdo) {
    echo json_encode(['success' => false, 'message' => 'Ошибка подключения к базе данных']);
    exit;
}


$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get') {
    // Получение профиля
    $user_id = $_SESSION['user_id'];
    
    try {
        $stmt = $pdo->prepare("SELECT user_id, firstname, lastname, email FROM Users WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Форматируем как check.php
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['user_id'],
                    'firstname' => $user['firstname'],
                    'lastname' => $user['lastname'],
                    'email' => $user['email']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Пользователь не найден'
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Ошибка базы данных'
        ]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'update') {
    // Обновление профиля
    $user_id = $_SESSION['user_id'];
    
    // Получаем JSON данные
    $input = json_decode(file_get_contents('php://input'), true);
    
    $firstname = trim($input['firstname'] ?? '');
    $lastname = trim($input['lastname'] ?? '');
    $email = trim($input['email'] ?? '');
    
    // Валидация
    if (empty($firstname) || empty($lastname) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Все поля обязательны']);
        exit();
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Некорректный email']);
        exit();
    }
    
    try {
        // Проверяем email
        $checkStmt = $pdo->prepare("SELECT user_id FROM Users WHERE email = ? AND user_id != ?");
        $checkStmt->execute([$email, $user_id]);
        
        if ($checkStmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email уже используется']);
            exit();
        }
        
        // Обновляем
        $updateStmt = $pdo->prepare("UPDATE Users SET firstname = ?, lastname = ?, email = ? WHERE user_id = ?");
        $success = $updateStmt->execute([$firstname, $lastname, $email, $user_id]);
        
        if ($success) {
            // Обновляем сессию
            $_SESSION['firstname'] = $firstname;
            $_SESSION['lastname'] = $lastname;
            $_SESSION['email'] = $email;
            
            echo json_encode([
                'success' => true,
                'message' => 'Профиль обновлен',
                'user' => [
                    'id' => $user_id,
                    'firstname' => $firstname,
                    'lastname' => $lastname,
                    'email' => $email
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Ошибка обновления']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка базы данных']);
    }
    
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Неизвестное действие'
    ]);
}

exit();
?>