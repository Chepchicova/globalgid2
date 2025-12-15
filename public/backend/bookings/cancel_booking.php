<?php
// Файл для отмены бронирования
require_once __DIR__ . "/../config/cors.php";
session_start();
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/db.php";

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'error' => 'Необходимо авторизоваться'
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
if (!isset($input['booking_id'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Не указан ID бронирования'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$user_id = $_SESSION['user_id'];
$booking_id = (int)$input['booking_id'];

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Начинаем транзакцию
    $conn->beginTransaction();
    
    // Получаем информацию о бронировании
    $checkSql = "SELECT booking_id, user_id, excursion_id, seats, booking_date FROM Booking WHERE booking_id = ? AND user_id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([$booking_id, $user_id]);
    $booking = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$booking) {
        $conn->rollBack();
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Бронирование не найдено'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Проверяем, прошло ли 24 часа с момента бронирования
    $bookingDate = strtotime($booking['booking_date']);
    $currentTime = time();
    $hoursSinceBooking = ($currentTime - $bookingDate) / 3600;
    
    if ($hoursSinceBooking > 24) {
        $conn->rollBack();
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Отмена бронирования возможна только в течение 24 часов с момента бронирования'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // Удаляем бронирование
    $deleteSql = "DELETE FROM Booking WHERE booking_id = ? AND user_id = ?";
    $deleteStmt = $conn->prepare($deleteSql);
    $deleteStmt->execute([$booking_id, $user_id]);
    
    // Возвращаем места обратно в экскурсию
    $seatsToReturn = (int)$booking['seats'];
    $excursion_id = (int)$booking['excursion_id'];
    
    $updateSql = "UPDATE Excursion SET count_seats = count_seats + ? WHERE excursion_id = ?";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->execute([$seatsToReturn, $excursion_id]);
    
    // Подтверждаем транзакцию
    $conn->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Бронирование успешно отменено',
        'seats_returned' => $seatsToReturn
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    error_log("Cancel booking error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при отмене бронирования: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) {
        $conn->rollBack();
    }
    
    http_response_code(500);
    error_log("Cancel booking error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при отмене бронирования'
    ], JSON_UNESCAPED_UNICODE);
}

