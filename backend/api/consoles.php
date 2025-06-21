<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
header('Content-Type: application/json');
require 'db.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $result = $mysqli->query("SELECT * FROM consoles");
        $consoles = [];
        while ($row = $result->fetch_assoc()) $consoles[] = $row;
        echo json_encode($consoles);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("INSERT INTO consoles (name, status, pricePerHour) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $data['name'], $data['status'], $data['pricePerHour']);
        $stmt->execute();
        echo json_encode(['id' => $mysqli->insert_id]);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("UPDATE consoles SET name=?, status=?, pricePerHour=? WHERE id=?");
        $stmt->bind_param("ssii", $data['name'], $data['status'], $data['pricePerHour'], $data['id']);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    case 'DELETE':
        parse_str(file_get_contents("php://input"), $data);
        $stmt = $mysqli->prepare("DELETE FROM consoles WHERE id=?");
        $stmt->bind_param("i", $data['id']);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;
}
?>