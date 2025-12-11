<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

require_once "db.php";
require_once "functions.php";

$method = $_GET['method'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

switch ($method) {
    case 'createRequest':
        createRequest();
        break;

    case 'getPriceRange':
        getPriceRange();
        break;

    case 'getLanguages':
        getLanguages();
        break;

    case 'getSpecializations':
        getSpecializations();
        break;

    case 'getExcursionTypes':
        getEnumValues('Excursion', 'type');
        break;

    case 'getTransportTypes':
        getEnumValues('Excursion', 'transport_type');
        break;

    case 'getActivities':
        getEnumValues('Excursion', 'activity');
        break;

        case 'getExcursionCards': //все экскурсии
    getExcursionCards();
    break;

       case 'getExcursionsFiltered': 
        getExcursionsFiltered(); // отфильтрованные
        break;

    // Администраторские методы
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
        echo json_encode(['status' => 'unknown_method']);
}
exit;

//до//
