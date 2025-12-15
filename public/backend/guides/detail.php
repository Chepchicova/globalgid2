<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/db.php";

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode(['error' => 'Invalid guide ID']);
    exit;
}

$guide_id = (int)$_GET['id'];

$db = new Database();
$conn = $db->getConnection();

try {
    // Получаем основную информацию о гиде
    $sql = "
        SELECT 
            g.guide_id,
            g.firstname_guide,
            g.lastname_guide,
            g.bio,
            g.location_id,
            l.city,
            l.country,
            COALESCE((
                SELECT AVG(rating)
                FROM Reviews
                WHERE guide_id = g.guide_id
            ), 0) AS avg_rating,
            COALESCE((
                SELECT COUNT(*)
                FROM Reviews
                WHERE guide_id = g.guide_id
            ), 0) AS reviews_count
        FROM Guides g
        LEFT JOIN Locations l ON g.location_id = l.location_id
        WHERE g.guide_id = ? AND g.status = 'active'
    ";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$guide_id]);
    $guide = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guide) {
        echo json_encode(['error' => 'Guide not found']);
        exit;
    }
    
    // Получаем изображение гида
    $imageSql = "
        SELECT image_path
        FROM Guide_Images
        WHERE guide_id = ?
        ORDER BY image_id ASC
        LIMIT 1
    ";
    
    $imageStmt = $conn->prepare($imageSql);
    $imageStmt->execute([$guide_id]);
    $image = $imageStmt->fetch(PDO::FETCH_ASSOC);
    $guide['image'] = $image ? $image['image_path'] : "uploads/excursions/default.png";
    
    // Получаем специализации гида
    $specializationsSql = "
        SELECT s.specialization_id, s.name
        FROM Guide_Specializations gs
        JOIN Specializations s ON gs.specialization_id = s.specialization_id
        WHERE gs.guide_id = ?
    ";
    
    $specializationsStmt = $conn->prepare($specializationsSql);
    $specializationsStmt->execute([$guide_id]);
    $specializations = $specializationsStmt->fetchAll(PDO::FETCH_ASSOC);
    $guide['specializations'] = $specializations;
    
    // Получаем языки гида
    $languagesSql = "
        SELECT lang.language_id, lang.name
        FROM Guide_Languages gl
        JOIN Languages lang ON gl.language_id = lang.language_id
        WHERE gl.guide_id = ?
    ";
    
    $languagesStmt = $conn->prepare($languagesSql);
    $languagesStmt->execute([$guide_id]);
    $languages = $languagesStmt->fetchAll(PDO::FETCH_ASSOC);
    $guide['languages'] = $languages;
    
    // Получаем активные экскурсии гида
    $excursionsSql = "
        SELECT 
            e.excursion_id,
            e.title,
            e.description,
            e.duration,
            e.price,
            e.type,
            e.transport_type,
            l.city,
            l.country,
            COALESCE((
                SELECT image_path
                FROM Excursion_Images
                WHERE excursion_id = e.excursion_id
                ORDER BY image_id ASC
                LIMIT 1
            ), 'uploads/excursions/default.png') AS image
        FROM Excursion e
        LEFT JOIN Locations l ON e.location_id = l.location_id
        WHERE e.guide_id = ? AND e.status = 'active'
        ORDER BY e.date_event ASC
    ";
    
    $excursionsStmt = $conn->prepare($excursionsSql);
    $excursionsStmt->execute([$guide_id]);
    $excursions = $excursionsStmt->fetchAll(PDO::FETCH_ASSOC);
    $guide['excursions'] = $excursions;
    
    // Получаем отзывы на гида
    $reviewsSql = "
        SELECT 
            r.review_id,
            r.rating,
            r.comment,
            r.create_at,
            CONCAT(u.firstname, ' ', u.lastname) AS user_name
        FROM Reviews r
        JOIN Users u ON r.user_id = u.user_id
        WHERE r.guide_id = ?
        ORDER BY r.create_at DESC
    ";
    
    $reviewsStmt = $conn->prepare($reviewsSql);
    $reviewsStmt->execute([$guide_id]);
    $reviews = $reviewsStmt->fetchAll(PDO::FETCH_ASSOC);
    $guide['reviews'] = $reviews;
    
    // Приводим числовые значения к правильным типам
    $guide['avg_rating'] = (float)$guide['avg_rating'];
    $guide['reviews_count'] = (int)$guide['reviews_count'];
    
    $result = [
        'success' => true,
        'data' => $guide
    ];
    
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>

