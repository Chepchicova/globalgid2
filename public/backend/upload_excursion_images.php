<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

require_once "db.php";
require_once "auth/cors.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Проверка прав администратора
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Доступ запрещен']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Метод не разрешен']);
    exit;
}

if (!isset($_POST['excursion_id']) || !is_numeric($_POST['excursion_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID экскурсии не указан']);
    exit;
}

$excursion_id = (int)$_POST['excursion_id'];

// Создаем папку для изображений, если её нет
$upload_dir = __DIR__ . '/../uploads/excursions/';
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$db = new Database();
$conn = $db->getConnection();

$uploaded_files = [];
$errors = [];

// Обработка загруженных файлов
if (isset($_FILES['images'])) {
    // Проверяем, массив ли это или один файл
    $files = [];
    if (is_array($_FILES['images']['name'])) {
        // Множественная загрузка
        $file_count = count($_FILES['images']['name']);
        for ($i = 0; $i < $file_count; $i++) {
            if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                $files[] = [
                    'name' => $_FILES['images']['name'][$i],
                    'type' => $_FILES['images']['type'][$i],
                    'tmp_name' => $_FILES['images']['tmp_name'][$i],
                    'size' => $_FILES['images']['size'][$i],
                    'error' => $_FILES['images']['error'][$i]
                ];
            }
        }
    } else {
        // Один файл
        if ($_FILES['images']['error'] === UPLOAD_ERR_OK) {
            $files[] = $_FILES['images'];
        }
    }
    
    foreach ($files as $file) {
        $original_name = $file['name'];
        $tmp_name = $file['tmp_name'];
        $file_type = $file['type'];
        $file_size = $file['size'];
        
        // Проверка типа файла
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!in_array($file_type, $allowed_types)) {
            $errors[] = "Файл $original_name имеет недопустимый тип";
            continue;
        }
        
        // Проверка размера (максимум 5MB)
        $max_size = 5 * 1024 * 1024; // 5MB
        if ($file_size > $max_size) {
            $errors[] = "Файл $original_name слишком большой (максимум 5MB)";
            continue;
        }
        
        // Генерируем уникальное имя файла
        $extension = pathinfo($original_name, PATHINFO_EXTENSION);
        $new_filename = 'excursion_' . $excursion_id . '_' . time() . '_' . uniqid() . '.' . $extension;
        $file_path = $upload_dir . $new_filename;
        
        // Перемещаем файл
        if (move_uploaded_file($tmp_name, $file_path)) {
            // Сохраняем путь в БД (относительный путь от public)
            $relative_path = 'uploads/excursions/' . $new_filename;
            
            try {
                $stmt = $conn->prepare("INSERT INTO Excursion_Images (excursion_id, image_path) VALUES (?, ?)");
                $stmt->execute([$excursion_id, $relative_path]);
                $uploaded_files[] = [
                    'image_id' => $conn->lastInsertId(),
                    'image_path' => $relative_path
                ];
            } catch (PDOException $e) {
                // Удаляем файл, если не удалось сохранить в БД
                if (file_exists($file_path)) {
                    unlink($file_path);
                }
                $errors[] = "Ошибка сохранения $original_name в базу данных: " . $e->getMessage();
            }
        } else {
            $errors[] = "Ошибка загрузки файла $original_name";
        }
    }
}

if (empty($uploaded_files) && empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Файлы не были загружены']);
    exit;
}

$response = [
    'success' => !empty($uploaded_files),
    'uploaded' => $uploaded_files,
    'errors' => $errors
];

if (!empty($errors)) {
    http_response_code(400);
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
?>

