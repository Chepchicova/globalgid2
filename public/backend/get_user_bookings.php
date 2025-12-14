<?php
// Файл для получения бронирований пользователя
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

try {
    $db = new Database();
    $conn = $db->getConnection();
    
    // Получаем все бронирования пользователя с информацией об экскурсиях
    $sql = "
        SELECT 
            b.booking_id,
            b.user_id,
            b.excursion_id,
            b.seats,
            b.booking_date,
            e.title,
            e.description,
            e.price,
            e.duration,
            e.date_event,
            e.status as excursion_status,
            l.city,
            l.country,
            g.firstname_guide,
            g.lastname_guide,
            (SELECT image_path FROM Excursion_Images WHERE excursion_id = e.excursion_id LIMIT 1) as image_path
        FROM Booking b
        INNER JOIN Excursion e ON b.excursion_id = e.excursion_id
        LEFT JOIN Locations l ON e.location_id = l.location_id
        INNER JOIN Guides g ON e.guide_id = g.guide_id
        WHERE b.user_id = ?
        ORDER BY b.booking_date DESC
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$user_id]);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Добавляем информацию о возможности отмены (в течение 24 часов)
    $currentTime = time();
    foreach ($bookings as &$booking) {
        $bookingDate = strtotime($booking['booking_date']);
        $hoursSinceBooking = ($currentTime - $bookingDate) / 3600;
        $booking['can_cancel'] = $hoursSinceBooking <= 24;
        $booking['hours_remaining'] = max(0, 24 - $hoursSinceBooking);
    }
    
    echo json_encode([
        'success' => true,
        'bookings' => $bookings
    ], JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Get user bookings error: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка при получении бронирований'
    ], JSON_UNESCAPED_UNICODE);
}

