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

// Vérifier l'expiration des sessions authentifiées.
if (
    session_status() === PHP_SESSION_ACTIVE
    && isset($_SESSION['user_id'])
) {
    $now = time();
    
    // Délais d'expiration.
    $idleTimeout = 1800;      // 30 minutes
    $absoluteTimeout = 43200; // 12 heures

    $lastActivity = (int) (
        $_SESSION['last_activity_at'] ?? $now
    );

    $authenticatedAt = (int) (
        $_SESSION['authenticated_at'] ?? $now
    );

    // Vérifier l'inactivité et la durée totale.
    $idleExpired = ($now - $lastActivity) > $idleTimeout;

    $absoluteExpired = ($now - $authenticatedAt)
        > $absoluteTimeout;

    if ($idleExpired || $absoluteExpired) {

        // Vider les données de session.
        $_SESSION = [];

        // Expirer le cookie de session.
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();

            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?: 'Lax'
            ]);
        }

        // Détruire la session expirée.
        session_destroy();

        // Repartir sur une session vide avec un nouvel identifiant,
        // pour que les contrôleurs répondent 401 (et non 500).
        session_id(session_create_id());
        session_start();
    } else {
        // Actualiser la dernière activité.
        $_SESSION['last_activity_at'] = $now;
    }
    // Vérifier que la session existe toujours dans la base de données.
if (
    session_status() === PHP_SESSION_ACTIVE
    && isset($_SESSION['user_id'])
) {
    try {
        require_once __DIR__ . '/database.php';

        $connection = Database::getConnection();

        // Calculer l'empreinte de l'identifiant de session.
        $sessionTokenHash = hash('sha256', session_id());

        // Rechercher une session encore valide.
        $sessionQuery = $connection->prepare("
            SELECT id
            FROM user_sessions
            WHERE session_token_hash = :token_hash
              AND user_id = :user_id
              AND revoked_at IS NULL
              AND expires_at > NOW()
            LIMIT 1
        ");

        $sessionQuery->execute([
            'token_hash' => $sessionTokenHash,
            'user_id' => (int) $_SESSION['user_id']
        ]);

        $validSession = $sessionQuery->fetch();

        if (!$validSession) {
            // La session n'est plus autorisée.
            $_SESSION = [];

            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();

                setcookie(session_name(), '', [
                    'expires' => time() - 42000,
                    'path' => $params['path'],
                    'domain' => $params['domain'],
                    'secure' => $params['secure'],
                    'httponly' => $params['httponly'],
                    'samesite' => $params['samesite'] ?: 'Lax'
                ]);
            }

            session_destroy();

            // Créer une session anonyme.
            session_id(session_create_id());
            session_start();

        } else {
            // Actualiser l'activité dans la base.
            $updateQuery = $connection->prepare("
                UPDATE user_sessions
                SET last_activity_at = NOW()
                WHERE id = :session_id
            ");

            $updateQuery->execute([
                'session_id' => (int) $validSession['id']
            ]);
        }

    } catch (Throwable $e) {
        // En cas d'erreur DB, refuser l'accès par sécurité.
        error_log(
            'Erreur de vérification de session : ' . $e->getMessage()
        );

        $_SESSION = [];

        session_destroy();

        session_id(session_create_id());
        session_start();
    }
}
}