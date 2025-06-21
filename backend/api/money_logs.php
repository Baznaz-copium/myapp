<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
header('Content-Type: application/json');
require 'db.php';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $result = $mysqli->query("SELECT * FROM money_logs ORDER BY date DESC, id DESC");
        $logs = [];
        while ($row = $result->fetch_assoc()) {
            $row['amount'] = (float)$row['amount'];
            $row['recurring'] = isset($row['recurring']) ? (bool)$row['recurring'] : false;
            $logs[] = $row;
        }
        echo json_encode($logs);
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $type = $mysqli->real_escape_string($data['type']);
        $source = $mysqli->real_escape_string($data['source']);
        $amount = (float)$data['amount'];
        $note = $mysqli->real_escape_string($data['note']);
        $date = $mysqli->real_escape_string($data['date'] ?? date('Y-m-d'));
        $recurring = isset($data['recurring']) && $data['recurring'] ? 1 : 0;
        $mysqli->query("INSERT INTO money_logs (type, source, amount, note, date, recurring) VALUES ('$type', '$source', $amount, '$note', '$date', $recurring)");
        echo json_encode(['success' => true, 'id' => $mysqli->insert_id]);
        break;

    case 'PUT':
        $id = (int)($_GET['id'] ?? 0);
        $data = json_decode(file_get_contents('php://input'), true);
        if ($id && $data) {
            $fields = [];
            if (isset($data['type'])) $fields[] = "type='" . $mysqli->real_escape_string($data['type']) . "'";
            if (isset($data['source'])) $fields[] = "source='" . $mysqli->real_escape_string($data['source']) . "'";
            if (isset($data['amount'])) $fields[] = "amount=" . (float)$data['amount'];
            if (isset($data['note'])) $fields[] = "note='" . $mysqli->real_escape_string($data['note']) . "'";
            if (isset($data['date'])) $fields[] = "date='" . $mysqli->real_escape_string($data['date']) . "'";
            if (isset($data['recurring'])) $fields[] = "recurring=" . ($data['recurring'] ? 1 : 0);
            if (count($fields)) {
                $sql = "UPDATE money_logs SET " . implode(', ', $fields) . " WHERE id=$id";
                $mysqli->query($sql);
                echo json_encode(['success' => true]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id or data']);
        }
        break;

    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if ($id) {
            $mysqli->query("DELETE FROM money_logs WHERE id=$id");
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Missing id']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
$mysqli->close();
?>