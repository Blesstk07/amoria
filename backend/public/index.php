<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', '0');
error_reporting(E_ALL);

// Charger le routeur
require_once __DIR__ . '/../src/Routes/Router.php';

// Initialiser le routeur
$router = new Router();

// Charger les routes
$apiRoutes = require __DIR__ . '/../src/Routes/api.php';
$authRoutes = require __DIR__ . '/../src/Routes/auth.php';

// Enregistrer les routes
$apiRoutes($router);
$authRoutes($router);

// Route d'accueil
$router->get('/', function (): void {
    http_response_code(200);

    echo json_encode([
        'success' => true,
        'application' => 'Amoria API',
        'message' => 'Bienvenue sur notre API Amoria.',
        'data' => [
            'version' => '1.0.0',
            'status' => 'active'
        ]
    ], JSON_UNESCAPED_UNICODE);
});

// Distribuer la requête
$router->dispatch(
    $_SERVER['REQUEST_METHOD'] ?? 'GET',
    $_SERVER['REQUEST_URI'] ?? '/'
);