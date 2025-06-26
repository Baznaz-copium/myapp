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
        $result = $mysqli->query("SELECT * FROM settings LIMIT 1");
        $settings = $result->fetch_assoc();
        // Cast soundEffects to boolean for frontend
        $settings['soundEffects'] = (int)$settings['soundEffects'] === 1;
        echo json_encode($settings);
        break;

    case 'POST':
    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        // Default fallback
        $data['soundEffects'] = isset($data['soundEffects']) ? (int)$data['soundEffects'] : 0;
        $stmt = $mysqli->prepare("UPDATE settings SET pricePerHour=?, currency=?, businessName=?, businessPhone=?, businessAddress=?, taxRate=?, autoStopOnTimeUp=?, allowExtensions=?, requireCustomerInfo=?, language=?, theme=?, soundEffects=?");
        $stmt->bind_param(
            "issssdiisssi",
            $data['pricePerHour'],
            $data['currency'],
            $data['businessName'],
            $data['businessPhone'],
            $data['businessAddress'],
            $data['taxRate'],
            $data['autoStopOnTimeUp'],
            $data['allowExtensions'],
            $data['requireCustomerInfo'],
            $data['language'],
            $data['theme'],
            $data['soundEffects']
        );
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;
}
?>