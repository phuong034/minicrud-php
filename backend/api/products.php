<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require __DIR__ . '/../db.php';

function readJsonBody(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

try {
  // =========================
  // GET: list / detail
  // =========================
  if ($method === 'GET') {
    if ($id > 0) {
      $sql = "SELECT p.id, p.category_id, p.name, p.price, p.description, p.image_url,
                     c.name AS category_name
              FROM products p
              LEFT JOIN categories c ON c.id = p.category_id
              WHERE p.id = ?";
      $st = $pdo->prepare($sql);
      $st->execute([$id]);
      $row = $st->fetch();

      if (!$row) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
        exit;
      }

      echo json_encode(['ok' => true, 'data' => $row], JSON_UNESCAPED_UNICODE);
      exit;
    }

    $sql = "SELECT p.id, p.category_id, p.name, p.price, p.description, p.image_url,
                   c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            ORDER BY p.id DESC";
    $st = $pdo->query($sql);
    echo json_encode(['ok' => true, 'data' => $st->fetchAll()], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // =========================
  // POST: create
  // =========================
  if ($method === 'POST') {
    $data = readJsonBody();
    if (!$data) $data = $_POST;

    $name = trim((string)($data['name'] ?? ''));
    $price = (float)($data['price'] ?? 0);
    $category_id = isset($data['category_id']) && $data['category_id'] !== '' ? (int)$data['category_id'] : null;
    $description = trim((string)($data['description'] ?? ''));
    $image_url = trim((string)($data['image_url'] ?? ''));
    $image_url = $image_url === '' ? null : $image_url;

    if ($name === '') {
      http_response_code(422);
      echo json_encode(['ok' => false, 'error' => 'Name is required'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    $st = $pdo->prepare(
      "INSERT INTO products(category_id, name, price, description, image_url)
       VALUES(?, ?, ?, ?, ?)"
    );
    $st->execute([$category_id, $name, $price, $description, $image_url]);

    echo json_encode(['ok' => true, 'data' => ['id' => (int)$pdo->lastInsertId()]], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // =========================
  // PUT: update
  // =========================
  if ($method === 'PUT') {
    if ($id <= 0) {
      http_response_code(400);
      echo json_encode(['ok' => false, 'error' => 'Missing id'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    $data = readJsonBody();

    $name = trim((string)($data['name'] ?? ''));
    $price = (float)($data['price'] ?? 0);
    $category_id = isset($data['category_id']) && $data['category_id'] !== '' ? (int)$data['category_id'] : null;
    $description = trim((string)($data['description'] ?? ''));
    $image_url = trim((string)($data['image_url'] ?? ''));
    $image_url = $image_url === '' ? null : $image_url;

    if ($name === '') {
      http_response_code(422);
      echo json_encode(['ok' => false, 'error' => 'Name is required'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    $st = $pdo->prepare(
      "UPDATE products
       SET category_id=?, name=?, price=?, description=?, image_url=?
       WHERE id=?"
    );
    $st->execute([$category_id, $name, $price, $description, $image_url, $id]);

    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // =========================
  // DELETE: remove
  // =========================
  if ($method === 'DELETE') {
    if ($id <= 0) {
      http_response_code(400);
      echo json_encode(['ok' => false, 'error' => 'Missing id'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    $st = $pdo->prepare("DELETE FROM products WHERE id=?");
    $st->execute([$id]);

    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
  }

  http_response_code(405);
  echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Server error'], JSON_UNESCAPED_UNICODE);
}
