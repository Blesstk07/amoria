<?php

declare(strict_types=1);

require_once __DIR__ . '/../Controllers/AuthController.php';

return function (Router $router): void {

    // Appelle AuthController::$method s'il existe et est appelable,
    // sinon répond 501 (route branchée mais pas encore codée).
    $action = static function (string $method): callable {
        return static function () use ($method): void {
            if (!is_callable([AuthController::class, $method])) {
                http_response_code(501);

                echo json_encode([
                    'success' => false,
                    'message' => 'Cette fonctionnalité n’est pas encore disponible.',
                    'data' => []
                ], JSON_UNESCAPED_UNICODE);

                return;
            }

            AuthController::$method();
        };
    };

    // Inscription
    $router->post('/api/auth/register', $action('register'));

    // Connexion
    $router->post('/api/auth/login', $action('login'));
    // Déconnexion
$router->post('/api/auth/logout', $action('logout'));

    // Vérification de l'adresse e-mail
    $router->post('/api/auth/verify-email', $action('verifyEmail'));

    // Demande de réinitialisation du mot de passe (à écrire)
    $router->post('/api/auth/forgot-password', $action('forgotPassword'));
    // Réinitialisation effective du mot de passe
    $router->post('/api/auth/reset-password', $action('resetPassword'));
};