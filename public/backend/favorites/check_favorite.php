<?php
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json');

// Проверка авторизации
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode([
        'success' => true,
        'is_favorite' => false
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];
$excursion_id = isset($_GET['excursion_id']) ? (int)$_GET['excursion_id'] : null;

if (!$excursion_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Не указан ID экскурсии'
    ]);
    exit;
}

$db = new Database();
$conn = $db->getConnection();

try {
    // Таблица Favorites теперь содержит только excursion_id и user_id
    $check = $conn->prepare("SELECT favorite_id FROM Favorites WHERE user_id = ? AND excursion_id = ?");
    $check->execute([$user_id, $excursion_id]);
    $result = $check->fetch();
    
    echo json_encode([
        'success' => true,
        'is_favorite' => $result !== false
    ]);
} catch (PDOException $e) {
    error_log("Check favorite error: " . $e->getMessage());
    echo json_encode([
        'success' => true,
        'is_favorite' => false
    ]);
}
?>

