<?php
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

// Простой тестовый endpoint для диагностики
$result = [
    'session' => [
        'logged_in' => isset($_SESSION['logged_in']) ? $_SESSION['logged_in'] : false,
        'user_id' => isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null
    ],
    'database' => []
];

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Проверяем структуру таблицы Favorites
    $columns_sql = "SHOW COLUMNS FROM Favorites";
    $columns_result = $conn->query($columns_sql);
    $result['database']['favorites_columns'] = $columns_result->fetchAll(PDO::FETCH_ASSOC);
    
    // Проверяем количество записей
    $count_sql = "SELECT COUNT(*) as cnt FROM Favorites";
    $count_result = $conn->query($count_sql);
    $result['database']['favorites_count'] = $count_result->fetch(PDO::FETCH_ASSOC);
    
    // Проверяем наличие колонки excursion_id
    $check_sql = "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS 
                 WHERE TABLE_SCHEMA = DATABASE() 
                 AND TABLE_NAME = 'Favorites' 
                 AND COLUMN_NAME = 'excursion_id'";
    $check_result = $conn->query($check_sql);
    $result['database']['has_excursion_id'] = $check_result->fetch(PDO::FETCH_ASSOC);
    
} catch (Exception $e) {
    $result['error'] = $e->getMessage();
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>

