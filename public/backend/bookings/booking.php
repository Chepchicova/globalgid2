<?php
// Файл для обработки бронирования экскурсий
require_once __DIR__ . "/../config/cors.php";
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/db.php";

// Обработка preflight запросов
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Необходимо авторизоваться для бронирования'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Метод не разрешен'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Валидация входных данных
if (!isset($input['excursion_id']) || !isset($input['seats'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Не указаны обязательные поля: excursion_id и seats'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];
$excursion_id = (int)$input['excursion_id'];
$seats = (int)$input['seats'];

// Валидация количества мест
if ($seats <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Количество мест должно быть больше 0'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Начинаем транзакцию
    $conn->beginTransaction();
    
    // Проверяем существование экскурсии и получаем текущее количество мест
    $checkSql = "SELECT count_seats, status, date_event FROM Excursion WHERE excursion_id = ? FOR UPDATE";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([$excursion_id]);
    $excursion = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$excursion) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Экскурсия не найдена'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Проверяем статус экскурсии
    if ($excursion['status'] !== 'active') {
        $conn->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Экскурсия недоступна для бронирования'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Проверяем, что дата экскурсии не в прошлом
    $today = date('Y-m-d');
    if ($excursion['date_event'] < $today) {
        $conn->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Нельзя забронировать экскурсию на прошедшую дату'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Проверяем доступность мест
    $availableSeats = (int)$excursion['count_seats'];
    if ($seats > $availableSeats) {
        $conn->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => "Недостаточно мест. Доступно мест: {$availableSeats}, запрошено: {$seats}"
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Создаем бронирование
    $bookingSql = "INSERT INTO Booking (user_id, excursion_id, seats) VALUES (?, ?, ?)";
    $bookingStmt = $conn->prepare($bookingSql);
    $bookingStmt->execute([$user_id, $excursion_id, $seats]);
    
    // Обновляем количество доступных мест
    $newSeatsCount = $availableSeats - $seats;
    $updateSql = "UPDATE Excursion SET count_seats = ? WHERE excursion_id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->execute([$newSeatsCount, $excursion_id]);
    
    // Подтверждаем транзакцию
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Экскурсия успешно забронирована',
        'booking_id' => $conn->lastInsertId(),
        'remaining_seats' => $newSeatsCount
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    error_log("Booking error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при бронировании: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    error_log("Booking error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при бронировании'
    ], JSON_UNESCAPED_UNICODE);
}

