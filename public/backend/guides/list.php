<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . "/../config/db.php";

$db = new Database();
$conn = $db->getConnection();

try {
    // Основной запрос: получаем всех активных гидов с их данными
    $sql = "
        SELECT 
            g.guide_id,
            g.firstname_guide,
            g.lastname_guide,
            g.bio,
            g.location_id,
            l.city,
            l.country,
            -- Рейтинг гида (средний из отзывов)
            COALESCE((
                SELECT AVG(rating)
                FROM Reviews
                WHERE guide_id = g.guide_id
            ), 0) AS avg_rating,
            -- Количество отзывов
            COALESCE((
                SELECT COUNT(*)
                FROM Reviews
                WHERE guide_id = g.guide_id
            ), 0) AS reviews_count,
            -- Количество активных экскурсий
            COALESCE((
                SELECT COUNT(*)
                FROM Excursion
                WHERE guide_id = g.guide_id AND status = 'active'
            ), 0) AS excursions_count,
            -- Количество языков
            COALESCE((
                SELECT COUNT(*)
                FROM Guide_Languages
                WHERE guide_id = g.guide_id
            ), 0) AS languages_count
        FROM Guides g
        LEFT JOIN Locations l ON g.location_id = l.location_id
        WHERE g.status = 'active'
        ORDER BY avg_rating DESC, reviews_count DESC, g.firstname_guide ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Получаем изображения для всех гидов одним запросом
    $imageSql = "
        SELECT gi.guide_id, gi.image_path
        FROM Guide_Images gi
        INNER JOIN (
            SELECT guide_id, MIN(image_id) as min_image_id
            FROM Guide_Images
            GROUP BY guide_id
        ) AS first_images ON gi.guide_id = first_images.guide_id 
            AND gi.image_id = first_images.min_image_id
    ";
    
    $imageStmt = $conn->prepare($imageSql);
    $imageStmt->execute();
    $images = $imageStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Создаем массив изображений по guide_id
    $imagesMap = [];
    foreach ($images as $img) {
        $imagesMap[$img['guide_id']] = $img['image_path'];
    }

    $defaultImage = "uploads/excursions/default.png";

    // Обрабатываем результаты
    foreach ($guides as &$guide) {
        // Добавляем изображение
        $guide['image'] = isset($imagesMap[$guide['guide_id']]) 
            ? $imagesMap[$guide['guide_id']] 
            : $defaultImage;
        
        // Убеждаемся, что локация есть (уже получена через JOIN)
        $guide['city'] = $guide['city'] ?? null;
        $guide['country'] = $guide['country'] ?? null;
        
        // Приводим числовые значения к правильным типам
        $guide['avg_rating'] = (float)$guide['avg_rating'];
        $guide['reviews_count'] = (int)$guide['reviews_count'];
        $guide['excursions_count'] = (int)$guide['excursions_count'];
        $guide['languages_count'] = (int)$guide['languages_count'];
    }

    echo json_encode($guides, JSON_UNESCAPED_UNICODE | JSON_NUMERIC_CHECK);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
