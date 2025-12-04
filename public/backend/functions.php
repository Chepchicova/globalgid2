<?php
require_once "db.php";

function createRequest() {
    $db = new Database();
    $conn = $db->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');

    if (!$name || !$phone) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Поля обязательны']);
        return;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO Requests (name, phone_req) VALUES (:name, :phone)");
        $stmt->execute([':name' => $name, ':phone' => $phone]);

        echo json_encode(['status' => 'ok', 'request_id' => $conn->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
}

function getExcursions() {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->query("SELECT * FROM Excursion ORDER BY date_event ASC");
    $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($excursions, JSON_UNESCAPED_UNICODE);
}

function getPriceRange() {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->query("SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM Excursion");
    $range = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode($range, JSON_UNESCAPED_UNICODE);
}

function getLanguages() {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->query("SELECT * FROM Languages ORDER BY name ASC");
    $langs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($langs, JSON_UNESCAPED_UNICODE);
}

function getSpecializations() {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->query("SELECT * FROM Specializations ORDER BY name ASC");
    $specs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($specs, JSON_UNESCAPED_UNICODE);
}

function getEnumValues($table, $column) {
    $db = new Database();
    $conn = $db->getConnection();

    $stmt = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    $values = [];
    if ($row && isset($row['Type'])) {
        if (preg_match("/^enum\((.*)\)$/", $row['Type'], $matches)) {
            $values = str_getcsv($matches[1], ',', "'");
        }
    }
    echo json_encode($values, JSON_UNESCAPED_UNICODE);
}

/*доб */

function getExcursionCards() {
    $db = new Database();
    $conn = $db->getConnection();

    $sql = "
        SELECT 
            e.excursion_id,
            e.title,
            e.description,
            e.duration,
            e.price,
            CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.review_id) AS reviews_count
        FROM Excursion e
        JOIN Guides g ON e.guide_id = g.guide_id
        LEFT JOIN Reviews r ON r.guide_id = g.guide_id
        GROUP BY e.excursion_id
        ORDER BY e.date_event ASC
    ";

    $stmt = $conn->query($sql);
    $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($excursions as &$ex) {
        // обрезаем описание
        $ex['short_description'] = mb_substr($ex['description'], 0, 100) . "...";

        // считаем старую цену (20–40% сверху) переделать
        $percent = rand(20, 40);
        $ex['old_price'] = round($ex['price'] * (1 + $percent / 100));
    }

    echo json_encode($excursions, JSON_UNESCAPED_UNICODE);
}

/*для фильтрации*/
function getExcursionsFiltered() {
    $db = new Database();
    $conn = $db->getConnection();

    $input = json_decode(file_get_contents('php://input'), true);

    // Для отладки
    error_log("Принятые фильтры: " . print_r($input, true));

    $sql = "
        SELECT 
            e.excursion_id,
            e.title,
            e.description,
            e.duration,
            e.price,
            CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
            COALESCE(AVG(r.rating), 0) AS avg_rating,
            COUNT(r.review_id) AS reviews_count
        FROM Excursion e
        JOIN Guides g ON e.guide_id = g.guide_id
        LEFT JOIN Reviews r ON r.guide_id = g.guide_id
        WHERE 1=1
    ";

    $params = [];

    // 1. Фильтр по типу
    if (!empty($input['types'])) {
        $placeholders = implode(',', array_fill(0, count($input['types']), '?'));
        $sql .= " AND e.type IN ($placeholders)";
        $params = array_merge($params, $input['types']);
    }


        // Фильтр по категориям - переделка
   if (!empty($input['specializations'])) {
    $specializationsIds = [];
    
    // Получаем ID категорий по названиям
    $specSql = "SELECT specialization_id FROM specializations WHERE name = ?";
    $specStmt = $conn->prepare($specSql);
    
    foreach ($input['specializations'] as $specializationName) {
        $specStmt->execute([$specializationName]);
        $specId = $specStmt->fetch(PDO::FETCH_COLUMN);
        
        if ($specId) {
            $specializationsIds[] = $specId;
        } else {
            error_log("Категория не найдена в базе: " . $specializationName);
        }
    }
    
    if (!empty($specializationsIds)) {
        $placeholders = implode(',', array_fill(0, count($specializationsIds), '?'));
        $sql .= " AND e.specialization_id IN ($placeholders)";
        $params = array_merge($params, $specializationsIds);
    }
}


    // 3. ФИКС: Фильтр по языкам - преобразуем названия в ID
    if (!empty($input['languages'])) {
        $languageIds = [];
        
        // Получаем ID языков по названиям
        $langSql = "SELECT language_id FROM Languages WHERE name = ?";
        $langStmt = $conn->prepare($langSql);
        
        foreach ($input['languages'] as $languageName) {
            $langStmt->execute([$languageName]);
            $langId = $langStmt->fetch(PDO::FETCH_COLUMN);
            
            if ($langId) {
                $languageIds[] = $langId;
            } else {
                // Если язык не найден, логируем
                error_log("Язык не найден в базе: " . $languageName);
            }
        }
        
        if (!empty($languageIds)) {
            $placeholders = implode(',', array_fill(0, count($languageIds), '?'));
            $sql .= " AND e.language_id IN ($placeholders)";
            $params = array_merge($params, $languageIds);
        }
    }

    // 4. Фильтр по транспорту - УПРОЩАЕМ
    if (!empty($input['transport'])) {
        $transportValues = [];
        foreach ($input['transport'] as $transport) {
            if (is_string($transport)) {
                $transportValues[] = $transport;
            }
        }
        
        if (!empty($transportValues)) {
            $placeholders = implode(',', array_fill(0, count($transportValues), '?'));
            $sql .= " AND e.transport_type IN ($placeholders)";
            $params = array_merge($params, $transportValues);
        }
    }

    // 5. Фильтр по активности - УПРОЩАЕМ
    if (!empty($input['activities'])) {
        $activityValues = [];
        foreach ($input['activities'] as $activity) {
            if (is_string($activity)) {
                $activityValues[] = $activity;
            }
        }
        
        if (!empty($activityValues)) {
            $placeholders = implode(',', array_fill(0, count($activityValues), '?'));
            $sql .= " AND e.activity IN ($placeholders)";
            $params = array_merge($params, $activityValues);
        }
    }

    // 6. Фильтр по цене
// Простая и надежная фильтрация
if (isset($input['minPrice']) && $input['minPrice'] !== '') {
    $minPrice = floatval($input['minPrice']);
    if ($minPrice > 0) {
        $sql .= " AND e.price >= ?";
        $params[] = $minPrice;
    }
}

if (isset($input['maxPrice']) && $input['maxPrice'] !== '') {
    $maxPrice = floatval($input['maxPrice']);
    if ($maxPrice > 0) {
        $sql .= " AND e.price <= ?";
        $params[] = $maxPrice;
    }
}

    // 7. Фильтр "можно ли с детьми"
    if (isset($input['withChildren']) && $input['withChildren'] !== null) {
        $sql .= " AND e.children = ?";
        $params[] = $input['withChildren'] ? 1 : 0;
    }

    // 8. Фильтр по длительности
    if (!empty($input['minDuration']) && is_numeric($input['minDuration'])) {
        $sql .= " AND e.duration >= ?";
        $params[] = intval($input['minDuration']);
    }
    if (!empty($input['maxDuration']) && is_numeric($input['maxDuration'])) {
        $sql .= " AND e.duration <= ?";
        $params[] = intval($input['maxDuration']);
    }

    $sql .= " GROUP BY e.excursion_id ORDER BY e.date_event ASC";

    try {
        error_log("SQL запрос: " . $sql);
        error_log("Параметры: " . print_r($params, true));
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($excursions as &$ex) {
            $ex['short_description'] = mb_strlen($ex['description']) > 100 
                ? mb_substr($ex['description'], 0, 100) . "..." 
                : $ex['description'];
            $percent = rand(20, 40);
            $ex['old_price'] = round($ex['price'] * (1 + $percent / 100));
        }

        $response = [
            'success' => true,
            'data' => $excursions,
            'total' => count($excursions),
            'filters_received' => $input,
            'sql' => $sql,
            'params' => $params
        ];

        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        
    } catch (PDOException $e) {
        $response = [
            'success' => false,
            'error' => $e->getMessage(),
            'sql' => $sql,
            'params' => $params
        ];
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }
}