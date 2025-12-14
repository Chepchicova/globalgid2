<?php
// Файл для сохранения отзыва на гида
require_once "auth/cors.php";
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once "db.php";

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Необходимо авторизоваться'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];

// Получаем данные из запроса
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['guide_id']) || !isset($input['rating']) || !isset($input['comment'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Не все обязательные поля заполнены'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$guide_id = (int)$input['guide_id'];
$rating = (int)$input['rating'];
$comment = trim($input['comment']);

// Валидация рейтинга
if ($rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Рейтинг должен быть от 1 до 5'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Валидация комментария
if (empty($comment)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Комментарий не может быть пустым'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Проверяем, существует ли гид
    $guideCheckSql = "SELECT guide_id FROM Guides WHERE guide_id = ?";
    $guideStmt = $conn->prepare($guideCheckSql);
    $guideStmt->execute([$guide_id]);
    if (!$guideStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Гид не найден'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Проверяем, не оставил ли пользователь ррррррруже отзыв на этого гида
    $existingReviewSql = "SELECT review_id FROM Reviews WHERE user_id = ? AND guide_id = ?";
    $existingStmt = $conn->prepare($existingReviewSql);
    $existingStmt->execute([$user_id, $guide_id]);
    if ($existingStmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Вы уже оставили отзыв на этого гида'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Сохраняем отзыв
    $insertSql = "
        INSERT INTO Reviews (user_id, guide_id, rating, comment, create_at)
        VALUES (?, ?, ?, ?, NOW())
    ";
    
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->execute([$user_id, $guide_id, $rating, $comment]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Отзыв успешно сохранен'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Submit review error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при сохранении отзыва'
    ], JSON_UNESCAPED_UNICODE);
}

