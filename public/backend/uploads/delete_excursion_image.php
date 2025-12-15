<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/db.php";
require_once __DIR__ . "/../config/cors.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Проверка прав администратора
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешен']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['image_id']) || !is_numeric($input['image_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID изображения не указан']);
    exit;
}

$image_id = (int)$input['image_id'];

$db = new Database();
$conn = $db->getConnection();

try {
    // Получаем путь к файлу
    $stmt = $conn->prepare("SELECT image_path FROM Excursion_Images WHERE image_id = ?");
    $stmt->execute([$image_id]);
    $image = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$image) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Изображение не найдено']);
        exit;
    }
    
    // Удаляем файл
    $file_path = __DIR__ . '/../' . $image['image_path'];
    if (file_exists($file_path)) {
        unlink($file_path);
    }
    
    // Удаляем запись из БД
    $delete_stmt = $conn->prepare("DELETE FROM Excursion_Images WHERE image_id = ?");
    $delete_stmt->execute([$image_id]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Изображение удалено'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка удаления изображения: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

