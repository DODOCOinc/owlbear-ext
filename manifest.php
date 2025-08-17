<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.owlbear.rodeo');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, Origin');

$path = __DIR__ . '/manifest.json';
if (!file_exists($path)) {
  http_response_code(404);
  echo json_encode(['error' => 'manifest.json não encontrado']);
  exit;
}
readfile($path);
