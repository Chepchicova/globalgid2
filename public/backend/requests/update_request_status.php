<?php
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../admin/admin_functions.php';

header('Content-Type: application/json');

// Проверка прав администратора
checkAdminAccess();

$input = json_decode(file_get_contents('php://input'), true);
$request_id = isset($input['request_id']) ? (int)$input['request_id'] : null;
$status = isset($input['status']) ? $input['status'] : null;

if (!$request_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'ID заявки не указан'
    ]);
    exit;
}

if (!in_array($status, ['pending', 'processed'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Некорректный статус'
    ]);
    exit;
}

$db = new Database();
$conn = $db->getConnection();

try {
    // Обновляем статус заявки
    $sql = "UPDATE Requests SET status = ? WHERE request_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$status, $request_id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Заявка не найдена'
        ]);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Статус заявки обновлен'
    ]);
} catch (PDOException $e) {
    error_log("Update request status error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

