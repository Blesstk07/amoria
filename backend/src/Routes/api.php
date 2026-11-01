<?php

declare(strict_types=1);

require_once __DIR__ . '/../Controllers/DashboardController.php';

// Routes générales de l'API
return function (Router $router): void {

    // Vérification de l'état du serveur
    $health = function (): void {
        http_response_code(200);

        echo json_encode([
            'success' => true,
            'message' => 'Le serveur Amoria fonctionne correctement.',
            'data' => []
        ], JSON_UNESCAPED_UNICODE);
    };

    $router->get('/health', $health);
    $router->get('/api/health', $health);

    // Tableau de bord du membre connecté
    $router->get('/api/dashboard', [
        DashboardController::class,
        'getDashboard'
    ]);
};