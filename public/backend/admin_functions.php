<?php
require_once "db.php";

// Проверка прав администратора
function checkAdminAccess() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    error_log("Проверка доступа. Роль: " . ($_SESSION['role'] ?? 'не установлена'));
    error_log("User ID: " . ($_SESSION['user_id'] ?? 'не установлен'));
    
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        error_log("Доступ запрещен для пользователя");
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'Доступ запрещен',
            'role' => $_SESSION['role'] ?? 'не установлена'
        ]);
        exit;
    }
}

// Получение всех экскурсий для администратора (с полными данными)
function getAdminExcursions() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    // Получаем данные из POST запроса
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    // Если JSON пустой или невалидный, используем пустой массив
    if ($input === null && $rawInput !== '') {
        error_log("Ошибка декодирования JSON: " . json_last_error_msg());
        $input = [];
    }
    
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
        error_log("SQL запрос: " . $sql);
        error_log("Параметры: " . print_r($params, true));
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $excursions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Найдено экскурсий: " . count($excursions));
        
        echo json_encode([
            'success' => true,
            'data' => $excursions,
            'count' => count($excursions)
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        error_log("Ошибка БД: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Получение одной экскурсии для редактирования
function getAdminExcursion($id) {
    checkAdminAccess();
    
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
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['excursion_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID экскурсии не указан']);
        return;
    }
    
    $id = (int)$input['excursion_id'];
    
    // Валидация заголовка (если передан)
    if (isset($input['title'])) {
        $title = trim($input['title']);
        if (mb_strlen($title) < 2) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Заголовок должен содержать минимум 2 символа']);
            return;
        }
        $input['title'] = $title;
    }
    
    // Валидация даты (если передана)
    if (isset($input['date_event'])) {
        $dateEvent = $input['date_event'];
        $today = date('Y-m-d');
        if ($dateEvent < $today) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Дата проведения не может быть в прошлом']);
            return;
        }
    }
    
    // Подготовка данных для обновления
    $fields = [];
    $params = [];
    
    $allowedFields = [
        'title', 'description', 'program', 'duration', 'price', 'type', 
        'transport_type', 'status', 'count_seats', 'children', 
        'activity', 'date_event', 'location_id', 'guide_id', 
        'specialization_id', 'language_id'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            // Для children преобразуем в int
            if ($field === 'children') {
                $fields[] = "$field = ?";
                $params[] = $input[$field] ? 1 : 0;
            } else {
                $fields[] = "$field = ?";
                $params[] = $input[$field];
            }
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
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'foreign key constraint') !== false) {
            $errorMessage = 'Ошибка: выбранное значение не существует в базе данных';
        } elseif (strpos($errorMessage, 'Duplicate entry') !== false) {
            $errorMessage = 'Ошибка: запись с такими данными уже существует';
        } elseif (strpos($errorMessage, 'Data too long') !== false) {
            $errorMessage = 'Ошибка: введенные данные слишком длинные';
        } else {
            $errorMessage = 'Ошибка сохранения данных: ' . $errorMessage;
        }
        
        echo json_encode([
            'success' => false,
            'error' => $errorMessage
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Создание новой экскурсии
function createAdminExcursion() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    $required = ['title', 'guide_id', 'duration', 'price', 'type', 'transport_type', 'activity', 'date_event', 'count_seats', 'location_id', 'specialization_id', 'language_id'];
    $fieldNames = [
        'title' => 'Заголовок',
        'guide_id' => 'Гид',
        'duration' => 'Длительность',
        'price' => 'Цена',
        'type' => 'Тип экскурсии',
        'transport_type' => 'Тип передвижения',
        'activity' => 'Активность',
        'date_event' => 'Дата проведения',
        'count_seats' => 'Количество мест',
        'location_id' => 'Локация',
        'specialization_id' => 'Категория',
        'language_id' => 'Язык'
    ];
    
    foreach ($required as $field) {
        if (!isset($input[$field]) || $input[$field] === '' || $input[$field] === null) {
            http_response_code(400);
            $fieldName = $fieldNames[$field] ?? $field;
            echo json_encode(['success' => false, 'error' => "Поле '$fieldName' обязательно для заполнения"]);
            return;
        }
    }
    
    // Валидация заголовка (минимум 2 буквы)
    $title = trim($input['title']);
    if (mb_strlen($title) < 2) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Заголовок должен содержать минимум 2 символа']);
        return;
    }
    
    // Валидация даты (не должна быть в прошлом)
    $dateEvent = $input['date_event'];
    $today = date('Y-m-d');
    if ($dateEvent < $today) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Дата проведения не может быть в прошлом']);
        return;
    }
    
    // Преобразование children в int (0 или 1)
    $children = isset($input['children']) && $input['children'] ? 1 : 0;
    
    $sql = "
        INSERT INTO Excursion (
            title, description, program, guide_id, duration, price, type, 
            transport_type, status, count_seats, children, activity, 
            date_event, location_id, specialization_id, language_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $params = [
        $title,
        $input['description'] ?? null,
        $input['program'] ?? null,
        $input['guide_id'],
        $input['duration'],
        $input['price'],
        $input['type'],
        $input['transport_type'],
        $input['status'] ?? 'hidden',
        $input['count_seats'],
        $children,
        $input['activity'],
        $dateEvent,
        $input['location_id'],
        $input['specialization_id'],
        $input['language_id']
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
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'foreign key constraint') !== false) {
            $errorMessage = 'Ошибка: выбранное значение не существует в базе данных';
        } elseif (strpos($errorMessage, 'Duplicate entry') !== false) {
            $errorMessage = 'Ошибка: запись с такими данными уже существует';
        } elseif (strpos($errorMessage, 'Data too long') !== false) {
            $errorMessage = 'Ошибка: введенные данные слишком длинные';
        } else {
            $errorMessage = 'Ошибка сохранения данных: ' . $errorMessage;
        }
        
        echo json_encode([
            'success' => false,
            'error' => $errorMessage
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Удаление экскурсии
function deleteAdminExcursion() {
    checkAdminAccess();
    
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
    checkAdminAccess();
    
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
    checkAdminAccess();
    
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
    checkAdminAccess();
    
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

