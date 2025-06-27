<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
header('Content-Type: application/json');
require 'db.php'; // This should create $mysqli = new mysqli(...);

// Helper for input parsing
function get_json_input() {
    return json_decode(file_get_contents('php://input'), true);
}

// List all users (GET /users)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['id'])) {
    $result = $mysqli->query("SELECT id, username, email, password_hash, role, created_at, updated_at, active FROM users");
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode($users);
    exit;
}

// Get single user (GET /users?id=1)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $stmt = $mysqli->prepare("SELECT id, username, email, password_hash, role, created_at, updated_at, active FROM users WHERE id = ?");
    $stmt->bind_param("i", $_GET['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    } else {
        echo json_encode($user);
    }
    $stmt->close();
    exit;
}

// Create user (POST /users)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = get_json_input();

    if (empty($data['username']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    $hash = password_hash($data['password'], PASSWORD_DEFAULT);
    $role = (isset($data['role']) && in_array($data['role'], ['admin', 'staff'])) ? $data['role'] : 'staff';
    $active = isset($data['active']) ? intval($data['active']) : 0;

    $stmt = $mysqli->prepare("INSERT INTO users (username, email, password_hash, role, active) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $data['username'], $data['email'], $hash, $role, $active); 
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $stmt->error]);
    }
    $stmt->close();
    exit;
}



if ($_SERVER['REQUEST_METHOD'] === 'PUT' && isset($_GET['id'])) {
    $data = get_json_input();
    $fields = [];
    $types = '';
    $values = [];

    if (!empty($data['username'])) {
        $fields[] = "username=?";
        $types .= 's';
        $values[] = $data['username'];
    }
    if (!empty($data['email'])) {
        $fields[] = "email=?";
        $types .= 's';
        $values[] = $data['email'];
    }
    if (!empty($data['password'])) {
        $fields[] = "password_hash=?";
        $types .= 's';
        $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    if (!empty($data['role']) && in_array($data['role'], ['admin','staff'])) {
        $fields[] = "role=?";
        $types .= 's';
        $values[] = $data['role'];
    }
    if (isset($data['active'])) {
        $fields[] = "active=?";
        $types .= 'i';
        $values[] = $data['active'] ? 1 : 0;
    }

    if (count($fields) === 0) {
        http_response_code(400);
        echo json_encode(['error' => 'Nothing to update']);
        exit;
    }

    $types .= 'i';
    $values[] = $_GET['id'];
    $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id=?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param($types, ...$values);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $stmt->error]);
    }
    $stmt->close();
    exit;
}

// Delete user (DELETE /users?id=1)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['id'])) {
    $stmt = $mysqli->prepare("DELETE FROM users WHERE id=?");
    $stmt->bind_param("i", $_GET['id']);
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $stmt->error]);
    }
    $stmt->close();
    exit;
}


// Fallback
http_response_code(400);
echo json_encode(['error' => 'Unsupported request']);