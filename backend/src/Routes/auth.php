<?php

declare(strict_types=1);

require_once __DIR__ . '/../Controllers/AuthController.php';

return function (Router $router): void {

    // Inscription
    $router->post(
        '/api/auth/register',
        [AuthController::class, 'register']
    );

    // Connexion (à implémenter)
    $router->post('/api/auth/login', function (): void {
        http_response_code(501);

        echo json_encode([
            'success' => false,
            'message' => 'Connexion pas encore implémentée.',
            'data' => []
        ], JSON_UNESCAPED_UNICODE);
    });

    // Vérification de l'adresse e-mail
    // Si AuthController::verifyEmail n'existe pas encore, on répond 501 proprement.
    $router->post('/api/auth/verify-email', function (): void {
        if (!method_exists(AuthController::class, 'verifyEmail')) {
            http_response_code(501);

            echo json_encode([
                'success' => false,
                'message' => 'Vérification de l’e-mail pas encore implémentée.',
                'data' => []
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        AuthController::verifyEmail();
    });
};