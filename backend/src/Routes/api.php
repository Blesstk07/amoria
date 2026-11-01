<?php

declare(strict_types=1);

require_once __DIR__ . '/../Controllers/DashboardController.php';
require_once __DIR__ . '/../Controllers/ProfileController.php';
require_once __DIR__ . '/../Controllers/DiscoveryController.php';
require_once __DIR__ . '/../Security/Csrf.php';

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

    // Récupération du jeton CSRF
    $router->get('/api/csrf-token', function (): void {
        header('Cache-Control: no-store');

        try {
            $token = Csrf::getToken();

        } catch (Throwable $e) {
            error_log(
                'Erreur jeton CSRF Amoria : ' . $e->getMessage()
            );

            http_response_code(500);

            echo json_encode([
                'success' => false,
                'message' => 'Impossible de générer le jeton de sécurité.',
                'data' => []
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        http_response_code(200);

        echo json_encode([
            'success' => true,
            'message' => 'Jeton CSRF récupéré.',
            'data' => [
                'csrfToken' => $token
            ]
        ], JSON_UNESCAPED_UNICODE);
    });

    // Tableau de bord du membre connecté
    $router->get('/api/dashboard', [
        DashboardController::class,
        'getDashboard'
    ]);

    // Gestion du profil membre
    $router->get('/api/profile', [
        ProfileController::class,
        'getProfile'
    ]);

    $router->put('/api/profile', [
        ProfileController::class,
        'updateProfile'
    ]);

    $router->put('/api/profile/preferences', [
        ProfileController::class,
        'updatePreferences'
    ]);

    // Découverte des membres
    $router->get('/api/discover', [
        DiscoveryController::class,
        'discover'
    ]);

    // Enregistrement d'une consultation
    // Cette route POST est automatiquement protégée par CSRF.
    $router->post('/api/discover/view', [
        DiscoveryController::class,
        'recordView'
    ]);
};
