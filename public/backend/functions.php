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
        WHERE e.status != 'hidden'
        GROUP BY e.excursion_id
        ORDER BY e.date_event ASC
    ";

    $stmt = $conn->query($sql);
    $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Получаем первое изображение для каждой экскурсии
    $imageSql = "
        SELECT excursion_id, image_path 
        FROM Excursion_Images 
        WHERE excursion_id = ? 
        ORDER BY image_id ASC 
        LIMIT 1
    ";
    $imageStmt = $conn->prepare($imageSql);
    $defaultImage = "uploads/excursions/default.png";

    foreach ($excursions as &$ex) {
        // обрезаем описание
        $ex['short_description'] = mb_substr($ex['description'], 0, 100) . "...";

        // считаем старую цену (фиксированные 20% сверху)
        $ex['old_price'] = round($ex['price'] * 1.2);
        
        // Получаем первое изображение экскурсии
        $imageStmt->execute([$ex['excursion_id']]);
        $image = $imageStmt->fetch(PDO::FETCH_ASSOC);
        $ex['image'] = $image ? $image['image_path'] : $defaultImage;
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
    error_log('INPUT: ' . print_r($input, true));

    //поиск
    // ===================== ФИЛЬТР ПО ЛОКАЦИИ (ПОИСКОВИК) =====================
$locationQuery = isset($input['locationQuery']) ? trim($input['locationQuery']) : null;
$locationIds = [];

if (!empty($locationQuery)) {
    // Ищем по city или country
    $sqlLoc = "
        SELECT location_id 
        FROM Locations 
        WHERE city LIKE ? 
           OR country LIKE ?
    ";

    $stmtLoc = $conn->prepare($sqlLoc);
    $like = '%' . $locationQuery . '%';
    $stmtLoc->execute([$like, $like]);
    $foundLocations = $stmtLoc->fetchAll(PDO::FETCH_COLUMN);

    if (!empty($foundLocations)) {
        $locationIds = $foundLocations;
    } else {
        // Если ничего не найдено — возвращаем пустой список
        echo json_encode([
            'success' => true,
            'data' => [],
            'total' => 0,
            'filters_received' => $input,
            'note' => 'no locations matched searchQuery'
        ], JSON_UNESCAPED_UNICODE);
        return;
    }
}

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
        WHERE e.status != 'hidden'
    ";

    $params = [];

        // Фильтр по локации
    if (!empty($locationIds)) {
        $placeholders = implode(',', array_fill(0, count($locationIds), '?'));
        $sql .= " AND e.location_id IN ($placeholders)";
        $params = array_merge($params, $locationIds);
    }

// ===================== ФИЛЬТР ПО ДИАПАЗОНУ ДАТ =====================
$start = $input['dateStart'] ?? null;
$end = $input['dateEnd'] ?? null;

if ($start && $end) {
    // Делаем конец диапазона включительным
    $endInclusive = date('Y-m-d', strtotime($end . ' +1 day'));

    $sql .= " AND e.date_event >= ? AND e.date_event < ?";
    $params[] = $start;
    $params[] = $endInclusive;
}

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

// 8. Фильтр "Можно с детьми"
if (isset($input['withChildren']) && $input['withChildren'] == 1) {
    // Показываем только экскурсии, где children = TRUE
    $sql .= " AND e.children = 1";
}

    // 8. Фильтр по длительности
// 7. Фильтр по длительности
if (isset($input['minDuration']) && $input['minDuration'] !== '') {
    $minDuration = floatval($input['minDuration']);
    if ($minDuration > 0) {
        $sql .= " AND e.duration >= ?";
        $params[] = $minDuration;
    }
}

if (isset($input['maxDuration']) && $input['maxDuration'] !== '') {
    $maxDuration = floatval($input['maxDuration']);
    if ($maxDuration > 0) {
        $sql .= " AND e.duration <= ?";
        $params[] = $maxDuration;
    }
}

    $sql .= " GROUP BY e.excursion_id ORDER BY e.date_event ASC";

    try {
        error_log("SQL запрос: " . $sql);
        error_log("Параметры: " . print_r($params, true));
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Получаем первое изображение для каждой экскурсии
        $imageSql = "
            SELECT excursion_id, image_path 
            FROM Excursion_Images 
            WHERE excursion_id = ? 
            ORDER BY image_id ASC 
            LIMIT 1
        ";
        $imageStmt = $conn->prepare($imageSql);
        $defaultImage = "uploads/excursions/default.png";

        foreach ($excursions as &$ex) {
            $ex['short_description'] = mb_strlen($ex['description']) > 100 
                ? mb_substr($ex['description'], 0, 100) . "..." 
                : $ex['description'];
            $percent = rand(20, 40);
            $ex['old_price'] = round($ex['price'] * (1 + $percent / 100));
            
            // Получаем первое изображение экскурсии
            $imageStmt->execute([$ex['excursion_id']]);
            $image = $imageStmt->fetch(PDO::FETCH_ASSOC);
            $ex['image'] = $image ? $image['image_path'] : $defaultImage;
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

// ==================== АДМИНИСТРАТОРСКИЕ ФУНКЦИИ ====================

// Получение всех экскурсий для администратора (с полными данными)
function getAdminExcursions() {
    session_start();
    
    // Проверка прав администратора
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    $searchQuery = isset($input['search']) ? trim($input['search']) : '';
    
    $sql = "
        SELECT 
            e.excursion_id,
            e.title,
            e.location_id,
            e.date_event,
            e.guide_id,
            e.status,
            e.created_at,
            e.updated_at,
            CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
            CONCAT(l.city, ', ', l.country) AS location_name
        FROM Excursion e
        LEFT JOIN Guides g ON e.guide_id = g.guide_id
        LEFT JOIN Locations l ON e.location_id = l.location_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Поиск по локации или гиду
    if (!empty($searchQuery)) {
        $sql .= " AND (l.city LIKE ? OR l.country LIKE ? OR g.firstname_guide LIKE ? OR g.lastname_guide LIKE ?)";
        $like = '%' . $searchQuery . '%';
        $params = array_merge($params, [$like, $like, $like, $like]);
    }
    
    $sql .= " ORDER BY e.created_at DESC";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $excursions
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Получение одной экскурсии для редактирования
function getAdminExcursion($id) {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $sql = "
            SELECT e.*,
                   CONCAT(g.firstname_guide, ' ', g.lastname_guide) AS guide_name,
                   CONCAT(l.city, ', ', l.country) AS location_name
            FROM Excursion e
            LEFT JOIN Guides g ON e.guide_id = g.guide_id
            LEFT JOIN Locations l ON e.location_id = l.location_id
            WHERE e.excursion_id = ?
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);
        $excursion = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$excursion) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Экскурсия не найдена']);
            return;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $excursion
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Обновление экскурсии
function updateAdminExcursion() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['excursion_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID экскурсии не указан']);
        return;
    }
    
    $id = (int)$input['excursion_id'];
    
    // Подготовка данных для обновления
    $fields = [];
    $params = [];
    
    $allowedFields = [
        'title', 'description', 'duration', 'price', 'type', 
        'transport_type', 'status', 'count_seats', 'children', 
        'activity', 'date_event', 'location_id', 'guide_id', 
        'specialization_id', 'language_id'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = ?";
            $params[] = $input[$field];
        }
    }
    
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Нет данных для обновления']);
        return;
    }
    
    $params[] = $id;
    
    $sql = "UPDATE Excursion SET " . implode(', ', $fields) . " WHERE excursion_id = ?";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Экскурсия обновлена'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Создание новой экскурсии
function createAdminExcursion() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    $required = ['title', 'guide_id', 'duration', 'price', 'type', 'transport_type', 'activity', 'date_event', 'count_seats'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Поле $field обязательно"]);
            return;
        }
    }
    
    $sql = "
        INSERT INTO Excursion (
            title, description, guide_id, duration, price, type, 
            transport_type, status, count_seats, children, activity, 
            date_event, location_id, specialization_id, language_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $params = [
        $input['title'],
        $input['description'] ?? null,
        $input['guide_id'],
        $input['duration'],
        $input['price'],
        $input['type'],
        $input['transport_type'],
        $input['status'] ?? 'hidden',
        $input['count_seats'],
        $input['children'] ?? 0,
        $input['activity'],
        $input['date_event'],
        $input['location_id'] ?? null,
        $input['specialization_id'] ?? null,
        $input['language_id'] ?? null
    ];
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Экскурсия создана',
            'excursion_id' => $conn->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Удаление экскурсии
function deleteAdminExcursion() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['excursion_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID экскурсии не указан']);
        return;
    }
    
    $id = (int)$input['excursion_id'];
    
    try {
        $stmt = $conn->prepare("DELETE FROM Excursion WHERE excursion_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Экскурсия удалена'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Изменение статуса экскурсии (скрыть/показать)
function toggleAdminExcursionStatus() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['excursion_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID экскурсии не указан']);
        return;
    }
    
    $id = (int)$input['excursion_id'];
    
    try {
        // Получаем текущий статус
        $stmt = $conn->prepare("SELECT status FROM Excursion WHERE excursion_id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Экскурсия не найдена']);
            return;
        }
        
        // Переключаем статус
        $newStatus = $current['status'] === 'active' ? 'hidden' : 'active';
        
        $stmt = $conn->prepare("UPDATE Excursion SET status = ? WHERE excursion_id = ?");
        $stmt->execute([$newStatus, $id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Статус изменен',
            'status' => $newStatus
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Получение всех гидов для выпадающих списков
function getAdminGuides() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->query("SELECT guide_id, CONCAT(firstname_guide, ' ', lastname_guide) AS name FROM Guides ORDER BY firstname_guide");
        $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $guides
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Получение всех локаций для выпадающих списков
function getAdminLocations() {
    session_start();
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
        return;
    }
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->query("SELECT location_id, CONCAT(city, ', ', country) AS name FROM Locations ORDER BY city");
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => $locations
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
} 