<?php
// leaderboard.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header("Access-Control-Allow-Headers: X-Requested-With, Content-Type");
require 'db.php';



// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Helper: fetch all leaders
function getLeaders($mysqli) {
    $res = $mysqli->query("SELECT * FROM leaderboard ORDER BY score DESC");
    $leaders = [];
    $rank = 1;
    while ($row = $res->fetch_assoc()) {
        $row['rank'] = $rank++;
        $row['achievements'] = json_decode($row['achievements'], true) ?: [];
        $row['stats'] = json_decode($row['stats'], true) ?: [];
        $leaders[] = $row;
    }
    return $leaders;
}

// Routes
switch ($method) {
case 'GET':
    // GET /leaderboard.php or /leaderboard.php?id=3
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        $res = $mysqli->query("SELECT * FROM leaderboard WHERE id=$id LIMIT 1");
        if ($row = $res->fetch_assoc()) {
            $row['achievements'] = json_decode($row['achievements'], true) ?: [];
            $row['stats'] = json_decode($row['stats'], true) ?: [];
            echo json_encode($row);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
    } else {
        echo json_encode(getLeaders($mysqli));
    }
    break;

case 'POST':
    // Add new leader
    $name = $mysqli->real_escape_string($input['name'] ?? '');
    $score = intval($input['score'] ?? 0);
    $avatar = $mysqli->real_escape_string($input['avatar'] ?? '');
    $achievements = $mysqli->real_escape_string(json_encode($input['achievements'] ?? []));
    $stats = $mysqli->real_escape_string(json_encode($input['stats'] ?? [
        'gamesPlayed' => 0, 'wins' => 0, 'losses' => 0
    ]));
    $sql = "INSERT INTO leaderboard (name, score, avatar, achievements, stats)
            VALUES ('$name', $score, '$avatar', '$achievements', '$stats')";
    if ($mysqli->query($sql)) {
        echo json_encode(['success' => true, 'id' => $mysqli->insert_id]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $mysqli->error]);
    }
    break;

case 'PUT':
    // Update leader
    parse_str($_SERVER['QUERY_STRING'], $query);
    $id = intval($query['id'] ?? $input['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $fields = [];
    if (isset($input['name'])) $fields[] = "name='" . $mysqli->real_escape_string($input['name']) . "'";
    if (isset($input['score'])) $fields[] = "score=" . intval($input['score']);
    if (isset($input['avatar'])) $fields[] = "avatar='" . $mysqli->real_escape_string($input['avatar']) . "'";
    if (isset($input['achievements'])) $fields[] = "achievements='" . $mysqli->real_escape_string(json_encode($input['achievements'])) . "'";
    if (isset($input['stats'])) $fields[] = "stats='" . $mysqli->real_escape_string(json_encode($input['stats'])) . "'";
    if (!$fields) { http_response_code(400); echo json_encode(['error' => 'No valid fields']); exit; }
    $sql = "UPDATE leaderboard SET " . implode(', ', $fields) . " WHERE id=$id";
    if ($mysqli->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $mysqli->error]);
    }
    break;

case 'DELETE':
    // Delete leader
    parse_str($_SERVER['QUERY_STRING'], $query);
    $id = intval($query['id'] ?? 0);
    if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); exit; }
    $sql = "DELETE FROM leaderboard WHERE id=$id";
    if ($mysqli->query($sql)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $mysqli->error]);
    }
    break;

case 'OPTIONS':
    // CORS preflight
    http_response_code(200);
    break;

default:
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

$mysqli->close();
?>