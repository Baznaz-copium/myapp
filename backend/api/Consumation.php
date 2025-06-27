<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }
header('Content-Type: application/json');
require 'db.php';


$action = $_GET['action'] ?? '';

switch ($action) {
    case 'list':
        $stmt = $mysqli->query("SELECT * FROM consumables");
        echo json_encode($stmt->fetch_all(MYSQLI_ASSOC));
        break;

    case 'add':
        $data = json_decode(file_get_contents('php://input'), true);
        if (
            !$data ||
            !isset($data['name'], $data['type'], $data['stock'], $data['unit_price'], $data['total_cost'], $data['sell_price'])
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing fields']);
            exit();
        }
        $stmt = $mysqli->prepare("INSERT INTO consumables (name, type, stock, unit_price, total_cost, sell_price) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param(
            "ssiddd",
            $data['name'],
            $data['type'],
            $data['stock'],
            $data['unit_price'],
            $data['total_cost'],
            $data['sell_price']
        );
        $stmt->execute();
        echo json_encode(['success' => true]);
        break;

    case 'sell':
        $data = json_decode(file_get_contents('php://input'), true);
        $mysqli->begin_transaction();
        $stmt = $mysqli->prepare("UPDATE consumables SET stock = stock - ? WHERE id = ? AND stock >= ?");
        $stmt->bind_param("iii", $data['amount'], $data['id'], $data['amount']);
        $stmt->execute();
        if ($stmt->affected_rows > 0) {
            // Insert into consumable_sales
            $stmt2 = $mysqli->prepare("INSERT INTO consumable_sales (consumable_id, amount, sell_price) VALUES (?, ?, ?)");
            $stmt2->bind_param("iid", $data['id'], $data['amount'], $data['sell_price']);
            if (!$stmt2->execute()) {
                $mysqli->rollback();
                echo json_encode(['success' => false, 'error' => $stmt2->error]);
                exit();
            }

            // Insert into stock_moves
            $reason = 'sell';
            $negativeAmount = -abs($data['amount']);
            $stmt3 = $mysqli->prepare("INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)");
            $stmt3->bind_param("iis", $data['id'], $negativeAmount, $reason);
            if (!$stmt3->execute()) {
                $mysqli->rollback();
                echo json_encode(['success' => false, 'error' => $stmt3->error]);
                exit();
            }

            $mysqli->commit();
            echo json_encode(['success' => true]);
        } else {
            $mysqli->rollback();
            echo json_encode(['success' => false, 'error' => 'Not enough stock']);
        }
        break;

    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $mysqli->prepare("UPDATE consumables SET name=?, stock=?, unit_price=?, total_cost=?, sell_price=? WHERE id=?");
        $stmt->bind_param(
            "sidddi",
            $data['name'],
            $data['stock'],
            $data['unit_price'],
            $data['total_cost'],
            $data['sell_price'],
            $data['id']
        );
        $stmt->execute();
        
        // After updating consumables stock
        // Calculate stock change
        $stmtOld = $mysqli->prepare("SELECT stock FROM consumables WHERE id=?");
        $stmtOld->bind_param("i", $data['id']);
        $stmtOld->execute();
        $stmtOld->bind_result($oldStock);
        $stmtOld->fetch();
        $stmtOld->close();

        $change = $data['stock'] - $oldStock;
        if ($change !== 0) {
            $reason = 'edit';
            $stmt3 = $mysqli->prepare("INSERT INTO stock_moves (consumable_id, m_change, reason) VALUES (?, ?, ?)");
            $stmt3->bind_param("iis", $data['id'], $change, $reason);
            $stmt3->execute();
        }
        
        echo json_encode(['success' => true]);
        break;

    case 'revenue':
        $period = $_GET['period'] ?? 'today';
        if ($period === 'today') {
            $where = "DATE(created_at) = CURDATE()";
        } elseif ($period === 'week') {
            $where = "YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)";
        } elseif ($period === 'month') {
            $where = "YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())";
        } else {
            $where = "1";
        }
        $stmt = $mysqli->query("SELECT SUM(sell_price * amount) as revenue FROM consumable_sales WHERE $where");
        $row = $stmt->fetch_assoc();
        echo json_encode(['revenue' => $row['revenue'] ?? 0]);
        break;

    case 'search':
        $q = $_GET['q'] ?? '';
        $type = $_GET['type'] ?? '';
        $where = "WHERE 1";
        if ($q) $where .= " AND name LIKE '%" . $mysqli->real_escape_string($q) . "%'";
        if ($type) $where .= " AND type = '" . $mysqli->real_escape_string($type) . "'";
        $stmt = $mysqli->query("SELECT * FROM consumables $where");
        $result = [];
        while ($row = $stmt->fetch_assoc()) $result[] = $row;
        echo json_encode($result);
        break;

    case 'report':
        $type = $_GET['type'] ?? '';
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        $where = "1";
        if ($type) $where .= " AND c.type='" . $mysqli->real_escape_string($type) . "'";
        if ($from) $where .= " AND cs.created_at >= '" . $mysqli->real_escape_string($from) . "'";
        if ($to) $where .= " AND cs.created_at <= '" . $mysqli->real_escape_string($to) . " 23:59:59'";
        // Sales history
        $sales = [];
        $q = $mysqli->query("SELECT cs.*, c.name, c.type FROM consumable_sales cs JOIN consumables c ON cs.consumable_id = c.id WHERE $where ORDER BY cs.created_at DESC");
        while ($row = $q->fetch_assoc()) $sales[] = $row;
        // Revenue/profit
        $rev = $mysqli->query("SELECT SUM(cs.amount * cs.sell_price) as revenue, SUM(cs.amount * (cs.sell_price - c.unit_price) * cs.amount) as profit FROM consumable_sales cs JOIN consumables c ON cs.consumable_id = c.id WHERE $where");
        $summary = $rev->fetch_assoc();
        // Stock movement (example: you need a stock_moves table for full tracking)
        $stock_moves = [];
        $q = $mysqli->query("SELECT sm.created_at as date, c.name, c.type, sm.m_change as `change`, sm.reason FROM stock_moves sm JOIN consumables c ON sm.consumable_id = c.id WHERE $where ORDER BY sm.created_at DESC");
        while ($row = $q->fetch_assoc()) $stock_moves[] = $row;
        echo json_encode([
            "sales" => $sales,
            "revenue" => $summary['revenue'] ?? 0,
            "profit" => $summary['profit'] ?? 0,
            "stock_moves" => $stock_moves
        ]);
        break;
        
    case 'delete':
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? '';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing ID']);
            exit();
        }

        $stmt = $mysqli->prepare("DELETE FROM consumables WHERE id=?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => $stmt->error]);
        }
        break;
    }
?>