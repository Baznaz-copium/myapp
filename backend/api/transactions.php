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
        // Insert new transaction (session start)
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
            $data['status'], // e.g. "active"
            $data['createdAt']
        );


        if ($stmt->execute()) {
            echo json_encode(['id' => $mysqli->insert_id]);
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
            // 4. Only paymentMethod update
            else if (isset($data['paymentMethod']) && isset($data['id'])) {
                $stmt = $mysqli->prepare("UPDATE transactions SET paymentMethod=? WHERE id=?");
                $stmt->bind_param(
                    "si",
                    $data['paymentMethod'],
                    $data['id']
                );
            }
        // 3. Session End (Completed)
        else if (
            isset($data['status']) && 
            strtolower($data['status']) === 'completed'
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
        // 4. Session Extension (only endTime and duration)
        else if (
            isset($data['endTime']) && isset($data['duration']) 
        ) {
            $stmt = $mysqli->prepare("UPDATE transactions SET endTime=?, duration=? WHERE id=?");
            $stmt->bind_param(
                "sdi",
                $data['endTime'],
                $data['duration'],
                $data['id']
            );
        }       
        if (isset($stmt) && $stmt->execute()) {
            echo json_encode(['success' => true]);
        } else if (isset($stmt)) {
            echo json_encode(['error' => $stmt->error]);
        }
        break;


    case 'DELETE':
        // Delete transaction
        $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
        if ($id > 0) {
            $stmt = $mysqli->prepare("DELETE FROM transactions WHERE id=?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(['success' => true]);
            } else {
                echo json_encode(['error' => $stmt->error]);
            }
        } else {
            echo json_encode(['error' => 'Missing or invalid id']);
        }
        break;
}

