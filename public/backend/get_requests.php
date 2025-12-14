<?php
session_start();
require_once 'auth/cors.php';
require_once 'db.php';
require_once 'admin_functions.php';

header('Content-Type: application/json');

// Проверка прав администратора
checkAdminAccess();

$db = new Database();
$conn = $db->getConnection();

try {
    // Получаем все заявки, отсортированные по статусу и ID
    $sql = "
        SELECT 
            request_id,
            name,
            phone_req,
            status
        FROM Requests
        ORDER BY 
            CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
            request_id DESC
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Разделяем на обработанные и необработанные
    $pending = [];
    $processed = [];
    
    foreach ($requests as $request) {
        if ($request['status'] === 'pending') {
            $pending[] = $request;
        } else {
            $processed[] = $request;
        }
    }
    
    echo json_encode([
        'success' => true,
        'pending' => $pending,
        'processed' => $processed
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log("Get requests error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

