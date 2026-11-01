<?php

declare(strict_types=1);

final class Csrf
{
    /**
     * Nom de l'en-tête HTTP envoyé par le frontend.
     */
    public const HEADER_NAME = 'X-CSRF-Token';

    /**
     * Lit le jeton stocké en session, ou null s'il est absent ou invalide.
     */
    private static function storedToken(): ?string
    {
        $stored = $_SESSION['_csrf_token'] ?? null;

        return is_string($stored) && $stored !== '' ? $stored : null;
    }

    /**
     * Récupère le jeton CSRF de la session.
     * En crée un s'il n'existe pas encore.
     */
    public static function getToken(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new RuntimeException(
                'La session doit être active pour générer un jeton CSRF.'
            );
        }

        $token = self::storedToken();

        if ($token === null) {
            $token = bin2hex(random_bytes(32));
            $_SESSION['_csrf_token'] = $token;
        }

        return $token;
    }

    /**
     * Vérifie un jeton CSRF reçu du frontend.
     */
    public static function validateToken(?string $token): bool
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return false;
        }

        $stored = self::storedToken();

        if ($stored === null || !is_string($token) || $token === '') {
            return false;
        }

        return hash_equals($stored, $token);
    }

    /**
     * Lit le jeton CSRF dans l'en-tête de la requête courante.
     */
    public static function getRequestToken(): ?string
    {
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

        return is_string($header) && $header !== '' ? $header : null;
    }

    /**
     * Vérifie le jeton CSRF de la requête courante (en-tête X-CSRF-Token).
     */
    public static function validateRequest(): bool
    {
        return self::validateToken(self::getRequestToken());
    }

    /**
     * Renouvelle le jeton CSRF.
     */
    public static function regenerateToken(): string
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new RuntimeException(
                'La session doit être active pour renouveler le jeton CSRF.'
            );
        }

        $token = bin2hex(random_bytes(32));
        $_SESSION['_csrf_token'] = $token;

        return $token;
    }
}