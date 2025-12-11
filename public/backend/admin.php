<?php
// Администраторский API endpoint
// Включаем отображение ошибок для отладки (в продакшене убрать)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once "auth/cors.php";
header("Content-Type: application/json; charset=utf-8");

require_once "db.php";
require_once "admin_functions.php";

$method = $_GET['method'] ?? '';

error_log("Admin API called: method=$method, REQUEST_METHOD=" . $_SERVER['REQUEST_METHOD']);

// OPTIONS обрабатывается в cors.php, но на всякий случай
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($method) {
    case 'getAdminExcursions':
        getAdminExcursions();
        break;
    
    case 'getAdminExcursion':
        if (!isset($_GET['id'])) {
            echo json_encode(['success' => false, 'error' => 'ID не указан']);
            break;
        }
        getAdminExcursion((int)$_GET['id']);
        break;
    
    case 'updateAdminExcursion':
        updateAdminExcursion();
        break;
    
    case 'createAdminExcursion':
        createAdminExcursion();
        break;
    
    case 'deleteAdminExcursion':
        deleteAdminExcursion();
        break;
    
    case 'toggleAdminExcursionStatus':
        toggleAdminExcursionStatus();
        break;
    
    case 'getAdminGuides':
        getAdminGuides();
        break;
    
    case 'getAdminLocations':
        getAdminLocations();
        break;

    default:
        echo json_encode(['success' => false, 'error' => 'Неизвестный метод']);
}
exit;

