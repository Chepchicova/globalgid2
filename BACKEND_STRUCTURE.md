# Структура бэкенда

## Разделение логики клиента и администратора

Бэкенд разделен на две части:

### Клиентский API (`api.php`)
- Файл: `public/backend/api.php`
- Функции: `public/backend/functions.php`
- Используется для обычных пользователей
- Endpoints:
  - `getExcursionCards` - получение всех экскурсий для клиентов
  - `getExcursionsFiltered` - фильтрация экскурсий
  - `getPriceRange` - диапазон цен
  - `getLanguages` - список языков
  - `getSpecializations` - список специализаций
  - `getExcursionTypes` - типы экскурсий
  - `getTransportTypes` - типы транспорта
  - `getActivities` - уровни активности
  - `createRequest` - создание заявки

### Администраторский API (`admin.php`)
- Файл: `public/backend/admin.php`
- Функции: `public/backend/admin_functions.php`
- Используется только администраторами (проверка роли)
- Endpoints:
  - `getAdminExcursions` - получение всех экскурсий с полными данными
  - `getAdminExcursion` - получение одной экскурсии для редактирования
  - `updateAdminExcursion` - обновление экскурсии
  - `createAdminExcursion` - создание новой экскурсии
  - `deleteAdminExcursion` - удаление экскурсии
  - `toggleAdminExcursionStatus` - переключение статуса (active/hidden)
  - `getAdminGuides` - список гидов
  - `getAdminLocations` - список локаций

## CORS настройки

Все API endpoints используют `auth/cors.php` для правильной настройки CORS:
- `Access-Control-Allow-Origin: http://localhost:3000` (конкретный origin, не wildcard)
- `Access-Control-Allow-Credentials: true` (для работы с сессиями)

## Безопасность

- Все администраторские функции проверяют роль пользователя через `checkAdminAccess()`
- Используются сессии PHP для аутентификации
- Все запросы к администраторскому API требуют `credentials: "include"`

