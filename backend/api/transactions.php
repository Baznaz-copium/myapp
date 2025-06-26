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
        $stmt = $mysqli->prepare("INSERT INTO transactions (consoleId, consoleName, Player_1, Player_2, startTime, endTime, duration, amountPaid, amountDue, totalAmount, paymentMethod, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "issssssidddss",
            $data['consoleId'],
            $data['consoleName'],
            $data['player_1'],
            $data['player_2'],
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

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);

        // 1. Session Stopped (Cancelled)
        if (
            isset($data['status']) && 
            strtolower($data['status']) === 'cancelled' &&
            isset($data['endTime']) && isset($data['duration'])
        ) {
            $stmt = $mysqli->prepare("UPDATE transactions SET endTime=?, duration=?, amountPaid=?, amountDue=?, totalAmount=?, paymentMethod=?, status=? WHERE id=?");
            $stmt->bind_param(
                "sdddsssi",
                $data['endTime'],
                $data['duration'],
                $data['amountPaid'],
                $data['amountDue'],
                $data['totalAmount'],
                $data['paymentMethod'],
                $data['status'],
                $data['id']
            );
        }
        // 2. General Edit (from table) - check for createdAt as a sign of table edit
        else if (isset($data['createdAt'])) {
            $stmt = $mysqli->prepare("UPDATE transactions SET createdAt=?, consoleName=?, player_1=?, player_2=?, duration=?, amountPaid=?, paymentMethod=?, status=? WHERE id=?");
            $stmt->bind_param(
                "ssssiddsi",
                $data['createdAt'],
                $data['consoleName'],
                $data['player_1'],
                $data['player_2'],
                $data['duration'],
                $data['amountPaid'],
                $data['paymentMethod'],
                $data['status'],
                $data['id']
            );
        }
        // 3. Session End (Completed)
        else if (
            isset($data['status']) && 
            strtolower($data['status']) === 'completed'
        ) {
            $stmt = $mysqli->prepare("UPDATE transactions SET amountPaid=?, amountDue=?, totalAmount=?, paymentMethod=?, status=? WHERE id=?");
            $stmt->bind_param(
                "ddsssi",
                $data['amountPaid'],
                $data['amountDue'],
                $data['totalAmount'],
                $data['paymentMethod'],
                $data['status'],
                $data['id']
            );
        }
        if (isset($stmt) && $stmt->execute()) {
            echo json_encode(['success' => true]);
        } else if (isset($stmt)) {
            echo json_encode(['error' => $stmt->error]);
        }
        break;
}
