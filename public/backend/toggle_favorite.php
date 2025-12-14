<?php
session_start();
require_once 'auth/cors.php';
require_once 'db.php';

header('Content-Type: application/json');

// Проверка авторизации
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Необходима авторизация'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Получаем данные из запроса
$input = json_decode(file_get_contents('php://input'), true);
$excursion_id = isset($input['excursion_id']) ? (int)$input['excursion_id'] : null;

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
    // Проверяем, существует ли экскурсия
    $check_excursion = $conn->prepare("SELECT excursion_id FROM Excursion WHERE excursion_id = ?");
    $check_excursion->execute([$excursion_id]);
    if (!$check_excursion->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Экскурсия не найдена'
        ]);
        exit;
    }

    // Проверяем, есть ли уже запись в избранном
    // Таблица Favorites теперь содержит только excursion_id и user_id
    $check_favorite = $conn->prepare("SELECT favorite_id FROM Favorites WHERE user_id = ? AND excursion_id = ?");
    $check_favorite->execute([$user_id, $excursion_id]);
    $existing = $check_favorite->fetch();

    if ($existing) {
        // Удаляем из избранного
        $delete = $conn->prepare("DELETE FROM Favorites WHERE user_id = ? AND excursion_id = ?");
        $delete->execute([$user_id, $excursion_id]);
        
        echo json_encode([
            'success' => true,
            'is_favorite' => false,
            'message' => 'Экскурсия удалена из избранного'
        ]);
    } else {
        // Добавляем в избранное
        $insert = $conn->prepare("INSERT INTO Favorites (user_id, excursion_id) VALUES (?, ?)");
        $insert->execute([$user_id, $excursion_id]);
        
        echo json_encode([
            'success' => true,
            'is_favorite' => true,
            'message' => 'Экскурсия добавлена в избранное'
        ]);
    }
} catch (PDOException $e) {
    error_log("Toggle favorite error: " . $e->getMessage());
    error_log("Error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("Toggle favorite general error: " . $e->getMessage());
    error_log("Error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

