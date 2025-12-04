<?php
require_once "db.php"; // если класс в отдельном файле


$db = new Database();
$conn = $db->getConnection();

$stmt = $conn->prepare("INSERT INTO Requests (name, phone_req) VALUES (:name, :phone)");
$stmt->execute([
    ':name' => "Тестовое имя",
    ':phone' => "+375291234567"
]);

echo "✅ Запись добавлена!";

?>
