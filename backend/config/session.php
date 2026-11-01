<?php

declare(strict_types=1);

// Ne pas démarrer une session si elle existe déjà.
if (session_status() === PHP_SESSION_NONE) {

    // Configuration du cookie de session.
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => !empty($_SERVER['HTTPS'])
            && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    // Nom personnalisé du cookie.
    session_name('AMORIA_SESSION');

    // Démarrer la session.
    if (!session_start()) {
        throw new RuntimeException(
            'Impossible de démarrer la session.'
        );
    }
}