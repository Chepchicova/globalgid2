# Структура проекта GlobalGid

## Описание проекта
Веб-приложение для бронирования экскурсий с гидами. React фронтенд + PHP backend.

---

##  Основная структура

### `/src` - Frontend (React)
- **`App.js`** - Главный компонент приложения, роутинг
- **`index.js`** - Точка входа React приложения

### `/src/pages` - Страницы приложения
- `Home.js` - Главная страница (поиск, форма заявки)
- `Excursions.js` - Список экскурсий с фильтрацией
- `excursionDetail.js` - Детальная страница экскурсии
- `Guides.js` - Список гидов
- `GuideDetail.js` - Профиль гида
- `Profile.js` - Личный кабинет пользователя
- `AdminExcursions.js` - Админ: управление экскурсиями
- `AdminExcursionForm.js` - Админ: форма создания/редактирования экскурсии
- `AdminGuides.js` - Админ: управление гидами
- `AdminGuideForm.js` - Админ: форма создания/редактирования гида
- `AdminRequests.js` - Админ: управление заявками
- `About.js`, `Contacts.js`, `Help.js` - Информационные страницы

### `/src/components` - Переиспользуемые компоненты
- `Header.js` - Шапка сайта
- `Footer.js` - Подвал
- `AuthModal.js` - Модальное окно авторизации/регистрации
- `images/` - Изображения для компонентов

### `/src/styles` - Стили CSS
- Отдельные CSS файлы для каждой страницы и компонента

---

##  `/public/backend` - Backend (PHP)

### `/config` - Конфигурация
- `db.php` - Подключение к базе данных
- `cors.php` - Настройки CORS

### `/api` - Клиентский API
- `api.php` - Основной endpoint для клиентов
- `functions.php` - Функции API (получение экскурсий, фильтрация, языки, специализации)

### `/admin` - Администраторский API
- `admin.php` - Основной endpoint для администраторов
- `admin_functions.php` - Функции админ-панели (CRUD экскурсий, гидов, локаций)

### `/auth` - Аутентификация
- `login.php` - Вход в систему
- `register.php` - Регистрация
- `logout.php` - Выход
- `check.php` - Проверка авторизации
- `profile.php` - Обновление профиля

### `/bookings` - Бронирования
- `booking.php` - Создание бронирования
- `cancel_booking.php` - Отмена бронирования
- `get_user_bookings.php` - Получение бронирований пользователя

### `/favorites` - Избранное
- `get_favorites.php` - Получение избранных экскурсий
- `toggle_favorite.php` - Добавить/удалить из избранного
- `check_favorite.php` - Проверка статуса избранного

### `/reviews` - Отзывы
- `submit_review.php` - Отправка отзыва на гида

### `/requests` - Заявки
- `get_requests.php` - Получение заявок (для админа)
- `update_request_status.php` - Обновление статуса заявки

### `/uploads` - Загрузка файлов
- `upload_excursion_images.php` - Загрузка изображений экскурсий
- `upload_guide_image.php` - Загрузка фото гида
- `delete_excursion_image.php` - Удаление изображения экскурсии

### `/excursions` - Экскурсии
- `detail.php` - Получение детальной информации об экскурсии

### `/guides` - Гиды
- `list.php` - Список гидов
- `filtered.php` - Фильтрованный список гидов
- `detail.php` - Детальная информация о гиде

### `/tests` - Тестовые файлы
- `admin_test.php` - Тест админ API

---

## `/public/uploads` - Загруженные файлы
- `excursions/` - Изображения экскурсий
- `guides/` - Фотографии гидов

---

## Технологии
- **Frontend**: React, React Router, CSS
- **Backend**: PHP, PDO, MySQL
- **Сборка**: Create React App

---

##  API Endpoints

### Клиентские (`/api/api.php`)
- `getExcursionCards` - Все экскурсии
- `getExcursionsFiltered` - Фильтрация экскурсий
- `getPriceRange`, `getLanguages`, `getSpecializations`
- `getExcursionTypes`, `getTransportTypes`, `getActivities`
- `createRequest` - Создание заявки

### Администраторские (`/admin/admin.php`)
- `getAdminExcursions`, `getAdminExcursion`
- `createAdminExcursion`, `updateAdminExcursion`, `deleteAdminExcursion`
- `getAdminGuides`, `getAdminGuide`
- `createAdminGuide`, `updateAdminGuide`, `deleteAdminGuide`
- `getAdminLocations`, `createLocation`
- `createSpecialization`, `createLanguage`
- `toggleAdminExcursionStatus`, `toggleAdminGuideStatus`

