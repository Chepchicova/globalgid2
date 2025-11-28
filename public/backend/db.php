<?php
// параметры подключения
$host = "localhost";      // сервер базы данных
$user = "root";           // имя пользователя MySQL (по умолчанию root)
$password = "Lerochka123";           // пароль (если есть — укажи)
$dbname = "globalgid";    // имя твоей базы данных

// подключение через mysqli
$conn = new mysqli($host, $user, $password, $dbname);

// проверка подключения
if ($conn->connect_error) {
    die("Ошибка подключения: " . $conn->connect_error);
}

// установка кодировки
$conn->set_charset("utf8mb4");
?>
