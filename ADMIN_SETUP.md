# Инструкция по настройке администраторского функционала

## Что было реализовано:

1. **Изменен Header** - для администратора скрыт поисковик, добавлены пункты меню "Экскурсии" и "Гиды"
2. **Создана страница управления экскурсиями** (`/admin/excursions`) с:
   - Таблицей всех экскурсий
   - Поиском по локации или гиду
   - Действиями: редактирование, скрытие/показ, удаление
3. **Создана страница редактирования экскурсии** (`/admin/excursions/edit/:id`)
4. **Создана страница создания экскурсии** (`/admin/excursions/create`)
5. **Добавлены API endpoints** для администратора

## Настройка базы данных:

### 1. Добавление поля `role` в таблицу `Users`

Если поле `role` отсутствует в таблице `Users`, выполните SQL скрипт `add_role_field.sql`:

```sql
ALTER TABLE Users 
ADD COLUMN role ENUM('client', 'admin') NOT NULL DEFAULT 'client';
```

### 2. Исправление поля `status` в таблице `Excursion`

В исходной схеме было написано дважды `ENUM` для поля `status`. Убедитесь, что поле определено правильно:

```sql
ALTER TABLE Excursion 
ADD COLUMN IF NOT EXISTS status ENUM('active', 'hidden') NOT NULL DEFAULT 'hidden';
```

Или если поле уже существует:

```sql
ALTER TABLE Excursion MODIFY COLUMN status ENUM('active', 'hidden') NOT NULL DEFAULT 'hidden';
```

### 3. Назначение роли администратора пользователю

Чтобы назначить роль администратора существующему пользователю:

```sql
UPDATE Users SET role = 'admin' WHERE email = 'ваш_email@example.com';
```

## Использование:

1. Войдите в систему под пользователем с ролью `admin`
2. В header появятся пункты меню "Экскурсии" и "Гиды"
3. Перейдите в "Экскурсии" для управления экскурсиями
4. Используйте кнопку "+ Добавить экскурсию" для создания новой экскурсии
5. Используйте иконки в колонке "Действия" для:
   - Редактирования (карандаш)
   - Скрытия/показа (глаз)
   - Удаления (урна)

## Файлы:

- `src/pages/AdminExcursions.js` - страница списка экскурсий
- `src/pages/AdminExcursionForm.js` - форма создания/редактирования
- `src/styles/adminExcursions.css` - стили для списка
- `src/styles/adminExcursionForm.css` - стили для формы
- `public/backend/functions.php` - добавлены администраторские функции
- `public/backend/api.php` - добавлены администраторские endpoints

