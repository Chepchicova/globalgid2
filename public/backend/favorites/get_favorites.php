<?php
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

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

$db = new Database();
$conn = $db->getConnection();

try {
    $current_date = date('Y-m-d');
    
    // Таблица Favorites теперь содержит только excursion_id и user_id
    $sql = "
        SELECT 
            e.excursion_id,
            e.title,
            e.description,
            e.duration,
            e.price,
            e.type,
            e.transport_type,
            e.date_event,
            e.status,
            CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
            l.city,
            l.country,
            s.name AS specialization_name,
            lang.name AS language_name,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.review_id) AS reviews_count,
            (SELECT image_path FROM Excursion_Images WHERE excursion_id = e.excursion_id LIMIT 1) AS image_path
        FROM Favorites f
        JOIN Excursion e ON f.excursion_id = e.excursion_id
        JOIN Guides g ON e.guide_id = g.guide_id
        LEFT JOIN Locations l ON e.location_id = l.location_id
        LEFT JOIN Specializations s ON e.specialization_id = s.specialization_id
        LEFT JOIN Languages lang ON e.language_id = lang.language_id
        LEFT JOIN Reviews r ON r.guide_id = g.guide_id
        WHERE f.user_id = ?
            AND e.status = 'active'
            AND e.date_event >= ?
        GROUP BY e.excursion_id
        ORDER BY f.favorite_id DESC
    ";
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception("Ошибка подготовки запроса: " . implode(", ", $conn->errorInfo()));
    }
    $exec_result = $stmt->execute([$user_id, $current_date]);
    if ($exec_result === false) {
        throw new Exception("Ошибка выполнения запроса: " . implode(", ", $stmt->errorInfo()));
    }
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Если favorites пуст, это нормально - просто нет избранных
    if (!is_array($favorites)) {
        $favorites = [];
    }

    // Формируем короткое описание
    foreach ($favorites as &$favorite) {
        if ($favorite['description']) {
            $favorite['short_description'] = mb_substr($favorite['description'], 0, 150) . '...';
        } else {
            $favorite['short_description'] = '';
        }
    }

    echo json_encode([
        'success' => true,
        'favorites' => $favorites
    ], JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    error_log("Get favorites error: " . $e->getMessage());
    error_log("Error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    error_log("Get favorites general error: " . $e->getMessage());
    error_log("Error trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Ошибка сервера: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>

