<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once "../db.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode(['error' => 'Invalid excursion ID']);
    exit;
}

$excursion_id = (int)$_GET['id'];

$db = new Database();
$conn = $db->getConnection();

try {
    // Упрощенный запрос без лишних полей
    $sql = "
        SELECT 
            e.*,
            CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
            g.bio AS guide_bio,
            l.city,
            l.country,
            s.name AS specialization_name,
            lang.name AS language_name,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.review_id) AS reviews_count
        FROM Excursion e
        JOIN Guides g ON e.guide_id = g.guide_id
        LEFT JOIN Locations l ON e.location_id = l.location_id
        LEFT JOIN Specializations s ON e.specialization_id = s.specialization_id
        LEFT JOIN Languages lang ON e.language_id = lang.language_id
        LEFT JOIN Reviews r ON r.guide_id = g.guide_id
        WHERE e.excursion_id = ?
        GROUP BY e.excursion_id
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$excursion_id]);
    $excursion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$excursion) {
        echo json_encode(['error' => 'Excursion not found']);
        exit;
    }
    
    // Для отладки - посмотрим что в программе
    error_log("Program for excursion $excursion_id: " . substr($excursion['program'] ?? 'NULL', 0, 100));
    
    // Получаем отзывы
    $reviews_sql = "
        SELECT 
            r.*,
            CONCAT(u.firstname, ' ', u.lastname) AS user_name
        FROM Reviews r
        JOIN Users u ON r.user_id = u.user_id
        WHERE r.guide_id = ?
        ORDER BY r.create_at DESC
        LIMIT 10
    ";
    
    $reviews_stmt = $conn->prepare($reviews_sql);
    $reviews_stmt->execute([$excursion['guide_id']]);
    $reviews = $reviews_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $result = [
        'success' => true,
        'data' => $excursion,
        'reviews' => $reviews
    ];
    
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>