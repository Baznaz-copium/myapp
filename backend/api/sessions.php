<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
header('Content-Type: application/json');
require 'db.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $result = $mysqli->query("SELECT * FROM sessions WHERE running=1");
        $sessions = [];
        while ($row = $result->fetch_assoc()) $sessions[] = $row;
        echo json_encode($sessions);
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("INSERT INTO sessions (consoleId, Player_1, Player_2, startTime, endTime, totalMinutes, running) VALUES (?, ?, ?, ?, ?, ?, 1)");
        $stmt->bind_param("issssi", $data['consoleId'], $data['Player_1'], $data['Player_2'], $data['startTime'], $data['endTime'], $data['totalMinutes']);
        $stmt->execute();
        echo json_encode(['id' => $mysqli->insert_id]);
        break;
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("UPDATE sessions SET endTime=?, totalMinutes=?, running=? WHERE id=?");
        $stmt->bind_param("siii", $data['endTime'], $data['totalMinutes'], $data['running'], $data['id']);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;
    case 'DELETE':
        parse_str(file_get_contents("php://input"), $data);
        $stmt = $mysqli->prepare("DELETE FROM sessions WHERE id=?");
        $stmt->bind_param("i", $data['id']);
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;
    case 'PATCH':
        // Use PATH_INFO for id extraction
        $id = null;
        if (!empty($_SERVER['PATH_INFO'])) {
            $parts = explode('/', trim($_SERVER['PATH_INFO'], '/'));
            $id = intval($parts[0]);
        } else {
            // fallback: parse id from URL
            $uri = explode('/', $_SERVER['REQUEST_URI']);
            $id = intval(end($uri));
        }

        if ($id) {
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $mysqli->prepare("UPDATE sessions SET endTime=?, totalMinutes=? WHERE id=?");
            $stmt->bind_param("sii", $data['endTime'], $data['totalMinutes'], $id);
            $stmt->execute();
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing session id']);
        }
        break;
        }
?>