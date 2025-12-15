<?php
require_once __DIR__ . "/../config/db.php";

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
    
    $sql .= " ORDER BY e.excursion_id ASC";
    
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
        
        // Логируем полную ошибку для отладки
        error_log("createAdminExcursion error: " . $errorMessage);
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'foreign key constraint') !== false) {
            $errorMessage = 'Ошибка: выбранное значение не существует в базе данных';
        } elseif (strpos($errorMessage, 'Duplicate entry') !== false) {
            // Проверяем, для какого именно поля возникла ошибка дубликата
            if (strpos($errorMessage, 'emailG') !== false || strpos($errorMessage, 'email') !== false) {
                $errorMessage = 'Ошибка: запись с таким email уже существует';
            } elseif (strpos($errorMessage, 'title') !== false) {
                $errorMessage = 'Ошибка: экскурсия с таким заголовком уже существует';
            } else {
                $errorMessage = 'Ошибка: запись с такими данными уже существует. Детали: ' . $errorMessage;
            }
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

// Получение всех гидов для выпадающих списков (упрощенная версия)
function getAdminGuidesList() {
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

// Получение всех гидов для администратора
function getAdminGuides() {
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
            g.guide_id,
            g.firstname_guide,
            g.lastname_guide,
            g.EmailG,
            g.location_id,
            g.status,
            CONCAT(l.city, ', ', l.country) AS location_name
        FROM Guides g
        LEFT JOIN Locations l ON g.location_id = l.location_id
        WHERE 1=1
    ";
    
    $params = [];
    
    // Поиск по имени, фамилии или локации
    if (!empty($searchQuery)) {
        $sql .= " AND (g.firstname_guide LIKE ? OR g.lastname_guide LIKE ? OR l.city LIKE ? OR l.country LIKE ?)";
        $like = '%' . $searchQuery . '%';
        $params = array_merge($params, [$like, $like, $like, $like]);
    }
    
    $sql .= " ORDER BY g.guide_id ASC";
    
    try {
        error_log("SQL запрос: " . $sql);
        error_log("Параметры: " . print_r($params, true));
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $guides = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Найдено гидов: " . count($guides));
        
        echo json_encode([
            'success' => true,
            'data' => $guides,
            'count' => count($guides)
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

// Переключение статуса гида (active/inactive)
function toggleAdminGuideStatus() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['guide_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID гида не указан']);
        return;
    }
    
    $id = (int)$input['guide_id'];
    
    try {
        // Получаем текущий статус
        $stmt = $conn->prepare("SELECT status FROM Guides WHERE guide_id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Гид не найден']);
            return;
        }
        
        // Переключаем статус
        $newStatus = $current['status'] === 'active' ? 'inactive' : 'active';
        
        $stmt = $conn->prepare("UPDATE Guides SET status = ? WHERE guide_id = ?");
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

// Удаление гида
function deleteAdminGuide() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['guide_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID гида не указан']);
        return;
    }
    
    $id = (int)$input['guide_id'];
    
    try {
        // Проверяем существование гида
        $stmt = $conn->prepare("SELECT guide_id FROM Guides WHERE guide_id = ?");
        $stmt->execute([$id]);
        $guide = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$guide) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Гид не найден']);
            return;
        }
        
        // Удаляем гида (каскадное удаление удалит связанные записи)
        $stmt = $conn->prepare("DELETE FROM Guides WHERE guide_id = ?");
        $stmt->execute([$id]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Гид удален'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Получение одного гида для редактирования
function getAdminGuide($id) {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $sql = "
            SELECT 
                g.*,
                CONCAT(l.city, ', ', l.country) AS location_name
            FROM Guides g
            LEFT JOIN Locations l ON g.location_id = l.location_id
            WHERE g.guide_id = ?
        ";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute([$id]);
        $guide = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$guide) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Гид не найден']);
            return;
        }
        
        // Получаем специализации гида
        $specsSql = "
            SELECT specialization_id
            FROM Guide_Specializations
            WHERE guide_id = ?
        ";
        $specsStmt = $conn->prepare($specsSql);
        $specsStmt->execute([$id]);
        $guide['specializations'] = $specsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Получаем языки гида
        $langsSql = "
            SELECT language_id
            FROM Guide_Languages
            WHERE guide_id = ?
        ";
        $langsStmt = $conn->prepare($langsSql);
        $langsStmt->execute([$id]);
        $guide['languages'] = $langsStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Получаем изображение гида
        $imageSql = "
            SELECT image_id, image_path
            FROM Guide_Images
            WHERE guide_id = ?
            ORDER BY image_id ASC
            LIMIT 1
        ";
        $imageStmt = $conn->prepare($imageSql);
        $imageStmt->execute([$id]);
        $image = $imageStmt->fetch(PDO::FETCH_ASSOC);
        $guide['image'] = $image ? $image : null;
        
        echo json_encode([
            'success' => true,
            'data' => $guide
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Создание нового гида
function createAdminGuide() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    $required = ['firstname_guide', 'lastname_guide', 'emailG', 'location_id'];
    $fieldNames = [
        'firstname_guide' => 'Имя',
        'lastname_guide' => 'Фамилия',
        'emailG' => 'Email',
        'location_id' => 'Локация'
    ];
    
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            http_response_code(400);
            $fieldName = $fieldNames[$field] ?? $field;
            echo json_encode(['success' => false, 'error' => "Поле '$fieldName' обязательно для заполнения"]);
            return;
        }
    }
    
    // Валидация email
    if (!filter_var($input['emailG'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Некорректный email']);
        return;
    }
    
    try {
        // Начинаем транзакцию
        $conn->beginTransaction();
        
        // Создаем гида
        $sql = "
            INSERT INTO Guides (
                firstname_guide, lastname_guide, emailG, bio, status, location_id
            ) VALUES (?, ?, ?, ?, ?, ?)
        ";
        
        $params = [
            trim($input['firstname_guide']),
            trim($input['lastname_guide']),
            trim($input['emailG']),
            $input['bio'] ?? null,
            $input['status'] ?? 'active',
            $input['location_id']
        ];
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $guide_id = $conn->lastInsertId();
        
        // Добавляем специализации
        if (!empty($input['specializations']) && is_array($input['specializations'])) {
            $specSql = "INSERT INTO Guide_Specializations (guide_id, specialization_id) VALUES (?, ?)";
            $specStmt = $conn->prepare($specSql);
            foreach ($input['specializations'] as $specId) {
                $specStmt->execute([$guide_id, (int)$specId]);
            }
        }
        
        // Добавляем языки
        if (!empty($input['languages']) && is_array($input['languages'])) {
            $langSql = "INSERT INTO Guide_Languages (guide_id, language_id) VALUES (?, ?)";
            $langStmt = $conn->prepare($langSql);
            foreach ($input['languages'] as $langId) {
                $langStmt->execute([$guide_id, (int)$langId]);
            }
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Гид создан',
            'guide_id' => $guide_id
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'foreign key constraint') !== false) {
            $errorMessage = 'Ошибка: выбранное значение не существует в базе данных';
        } elseif (strpos($errorMessage, 'Duplicate entry') !== false) {
            // Проверяем, для какого именно поля возникла ошибка дубликата
            if (strpos($errorMessage, 'emailG') !== false || strpos($errorMessage, 'email') !== false) {
                $errorMessage = 'Ошибка: гид с таким email уже существует';
            } else {
                $errorMessage = 'Ошибка: запись с такими данными уже существует. ' . $errorMessage;
            }
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

// Обновление гида
function updateAdminGuide() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['guide_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID гида не указан']);
        return;
    }
    
    $id = (int)$input['guide_id'];
    
    // Валидация email, если передан
    if (isset($input['emailG']) && !filter_var($input['emailG'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Некорректный email']);
        return;
    }
    
    try {
        // Начинаем транзакцию
        $conn->beginTransaction();
        
        // Подготовка данных для обновления
        $fields = [];
        $params = [];
        
        $allowedFields = [
            'firstname_guide', 'lastname_guide', 'emailG', 'bio', 'status', 'location_id'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                if ($field === 'firstname_guide' || $field === 'lastname_guide' || $field === 'emailG') {
                    $fields[] = "$field = ?";
                    $params[] = trim($input[$field]);
                } else {
                    $fields[] = "$field = ?";
                    $params[] = $input[$field];
                }
            }
        }
        
        if (!empty($fields)) {
            $params[] = $id;
            $sql = "UPDATE Guides SET " . implode(', ', $fields) . " WHERE guide_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
        }
        
        // Обновляем специализации
        if (isset($input['specializations'])) {
            // Удаляем старые
            $deleteSpecsSql = "DELETE FROM Guide_Specializations WHERE guide_id = ?";
            $deleteSpecsStmt = $conn->prepare($deleteSpecsSql);
            $deleteSpecsStmt->execute([$id]);
            
            // Добавляем новые
            if (!empty($input['specializations']) && is_array($input['specializations'])) {
                $specSql = "INSERT INTO Guide_Specializations (guide_id, specialization_id) VALUES (?, ?)";
                $specStmt = $conn->prepare($specSql);
                foreach ($input['specializations'] as $specId) {
                    $specStmt->execute([$id, (int)$specId]);
                }
            }
        }
        
        // Обновляем языки
        if (isset($input['languages'])) {
            // Удаляем старые
            $deleteLangsSql = "DELETE FROM Guide_Languages WHERE guide_id = ?";
            $deleteLangsStmt = $conn->prepare($deleteLangsSql);
            $deleteLangsStmt->execute([$id]);
            
            // Добавляем новые
            if (!empty($input['languages']) && is_array($input['languages'])) {
                $langSql = "INSERT INTO Guide_Languages (guide_id, language_id) VALUES (?, ?)";
                $langStmt = $conn->prepare($langSql);
                foreach ($input['languages'] as $langId) {
                    $langStmt->execute([$id, (int)$langId]);
                }
            }
        }
        
        $conn->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Гид обновлен'
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'foreign key constraint') !== false) {
            $errorMessage = 'Ошибка: выбранное значение не существует в базе данных';
        } elseif (strpos($errorMessage, 'Duplicate entry') !== false) {
            // Проверяем, для какого именно поля возникла ошибка дубликата
            if (strpos($errorMessage, 'emailG') !== false || strpos($errorMessage, 'email') !== false) {
                $errorMessage = 'Ошибка: гид с таким email уже существует';
            } else {
                $errorMessage = 'Ошибка: запись с такими данными уже существует. ' . $errorMessage;
            }
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

// Создание новой локации
function createLocation() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    if (!isset($input['city']) || trim($input['city']) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Поле "Город" обязательно для заполнения']);
        return;
    }
    
    if (!isset($input['country']) || trim($input['country']) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Поле "Страна" обязательно для заполнения']);
        return;
    }
    
    $city = trim($input['city']);
    $country = trim($input['country']);
    
    try {
        // Проверяем, не существует ли уже такая локация
        $checkSql = "SELECT location_id FROM Locations WHERE city = ? AND country = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->execute([$city, $country]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Локация уже существует, возвращаем её ID
            echo json_encode([
                'success' => true,
                'message' => 'Локация уже существует',
                'location_id' => $existing['location_id']
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // Создаем новую локацию
        $sql = "INSERT INTO Locations (city, country) VALUES (?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$city, $country]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Локация создана',
            'location_id' => $conn->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            $errorMessage = 'Ошибка: локация с такими данными уже существует';
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

// Создание новой специализации
function createSpecialization() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    if (!isset($input['name']) || trim($input['name']) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Поле "Название" обязательно для заполнения']);
        return;
    }
    
    $name = trim($input['name']);
    
    try {
        // Проверяем, не существует ли уже такая специализация
        $checkSql = "SELECT specialization_id FROM Specializations WHERE name = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->execute([$name]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Специализация уже существует, возвращаем её ID
            echo json_encode([
                'success' => true,
                'message' => 'Специализация уже существует',
                'specialization_id' => $existing['specialization_id']
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // Создаем новую специализацию
        $sql = "INSERT INTO Specializations (name) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$name]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Специализация создана',
            'specialization_id' => $conn->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            $errorMessage = 'Ошибка: специализация с таким названием уже существует';
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

// Создание нового языка
function createLanguage() {
    checkAdminAccess();
    
    $db = new Database();
    $conn = $db->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Обязательные поля
    if (!isset($input['name']) || trim($input['name']) === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Поле "Название" обязательно для заполнения']);
        return;
    }
    
    $name = trim($input['name']);
    
    try {
        // Проверяем, не существует ли уже такой язык
        $checkSql = "SELECT language_id FROM Languages WHERE name = ?";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->execute([$name]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Язык уже существует, возвращаем его ID
            echo json_encode([
                'success' => true,
                'message' => 'Язык уже существует',
                'language_id' => $existing['language_id']
            ], JSON_UNESCAPED_UNICODE);
            return;
        }
        
        // Создаем новый язык
        $sql = "INSERT INTO Languages (name) VALUES (?)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([$name]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Язык создан',
            'language_id' => $conn->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        http_response_code(500);
        $errorMessage = $e->getMessage();
        
        // Перевод типичных ошибок БД на русский
        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            $errorMessage = 'Ошибка: язык с таким названием уже существует';
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

