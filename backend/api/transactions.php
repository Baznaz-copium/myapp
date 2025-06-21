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
        $result = $mysqli->query("SELECT * FROM transactions");
        $transactions = [];
        while ($row = $result->fetch_assoc()) $transactions[] = $row;
        echo json_encode($transactions);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("INSERT INTO transactions (consoleId, consoleName, customerName, startTime, endTime, duration, amountPaid, amountDue, totalAmount, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "isssssidddss",
            $data['consoleId'],
            $data['consoleName'],
            $data['customerName'],
            $data['startTime'],
            $data['endTime'],
            $data['duration'],
            $data['amountPaid'],
            $data['amountDue'],
            $data['totalAmount'],
            $data['paymentMethod'],
            $data['status'],
            $data['createdAt']
        );
        if ($stmt->execute()) {
            if (isset($mysqli) && $mysqli instanceof mysqli) {
                echo json_encode(['id' => $mysqli->insert_id]);
            } else {
                echo json_encode(['error' => 'Database connection error']);
            }
        } else {
            echo json_encode(['error' => $stmt->error]);
        }
        break;

    // Add PUT, DELETE as needed
}
?>