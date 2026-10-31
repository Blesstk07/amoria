<?php

declare(strict_types=1);

require_once __DIR__ . '/../Controllers/AuthController.php';

return function (Router $router): void {

    $router->post(
        '/api/auth/register',
        [AuthController::class, 'register']
    );

    $router->post('/api/auth/login', function (): void {
        http_response_code(501);

        echo json_encode([
            'success' => false,
            'message' => 'Connexion pas encore implémentée.'
        ], JSON_UNESCAPED_UNICODE);
    });
};