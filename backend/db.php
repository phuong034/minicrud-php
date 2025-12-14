<?php
$config = require __DIR__ . '/config.php';

$dsn = "mysql:host={$config['host']};dbname={$config['db']};charset={$config['charset']}";

$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
  $pdo = new PDO($dsn, $config['user'], $config['pass'], $options);
} catch (Throwable $e) {
  http_response_code(500);
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => false, 'error' => 'DB connection failed']);
  exit;
}
