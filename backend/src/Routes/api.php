<?php

declare(strict_types=1);

// Routes générales de l'API

return function (Router $router): void {

    $router->get('/health', function (): void {
        http_response_code(200);

        echo json_encode([
            'success' => true,
            'message' => 'Le serveur Amoria fonctionne correctement.'
        ], JSON_UNESCAPED_UNICODE);
    });

};