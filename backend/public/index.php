<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/../config/session.php';

try {
    require_once __DIR__ . '/../vendor/autoload.php';
    require_once __DIR__ . '/../config/session.php';

    $dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
    $dotenv->load();

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

    // Distribuer la requête (chemin seul, sans query string)
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

    $router->dispatch(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $path
    );
} catch (Throwable $exception) {
    error_log($exception->getMessage() . ' in ' . $exception->getFile() . ':' . $exception->getLine());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Erreur interne du serveur.'
    ], JSON_UNESCAPED_UNICODE);
}