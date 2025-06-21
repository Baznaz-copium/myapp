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

function get_json_input() {
    return json_decode(file_get_contents('php://input'), true);
}

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_GET['action'] === 'login') {
        $data = get_json_input();
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $mysqli->prepare("SELECT id, username, email, password_hash, role, active FROM users WHERE username = ?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => (int) $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'active' => (int) $user['active']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['error' => 'Invalid username or password']);
        }
        exit;
    }