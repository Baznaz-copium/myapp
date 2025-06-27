<?php
$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'ps4_rental';

$mysqli = new mysqli($host, $user, $pass, $dbname);
if ($mysqli->connect_errno) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
$mysqli->set_charset('utf8mb4');
?>