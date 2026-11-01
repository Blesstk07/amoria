<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Services/DiscoveryService.php';

class DiscoveryController
{
    /**
     * Envoyer une réponse JSON.
     */
    private static function respond(
        int $status,
        bool $success,
        string $message,
        array $data = []
    ): void {
        http_response_code($status);

        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    /**
     * Vérifier la session et récupérer le membre connecté.
     */
    private static function getDiscoveryContext(PDO $pdo): array
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            self::respond(500, false, 'Session indisponible.');
        }

        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            self::respond(401, false, 'Vous devez être connecté.');
        }

        $stmt = $pdo->prepare("
            SELECT
                u.id AS user_id,
                u.account_status,
                u.email_verified_at,
                u.deletion_status,
                u.date_of_birth,

                p.id AS profile_id,
                p.gender,
                p.country,
                p.city,

                TIMESTAMPDIFF(
                    YEAR,
                    u.date_of_birth,
                    CURDATE()
                ) AS age

            FROM users u

            INNER JOIN profiles p
                ON p.user_id = u.id

            WHERE u.id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            'user_id' => $userId
        ]);

        $viewer = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$viewer || $viewer['deletion_status'] !== 'NONE') {
            self::respond(404, false, 'Profil introuvable.');
        }

        if ($viewer['account_status'] !== 'ACTIVE') {
            self::respond(
                403,
                false,
                'Ce compte est actuellement indisponible.'
            );
        }

        if ($viewer['email_verified_at'] === null) {
            self::respond(
                403,
                false,
                'Vous devez confirmer votre adresse e-mail.'
            );
        }

        if (
            $viewer['date_of_birth'] === null ||
            $viewer['age'] === null ||
            (int) $viewer['age'] < 18
        ) {
            self::respond(
                403,
                false,
                'Votre profil doit contenir une date de naissance valide.'
            );
        }

        $viewer['profile_id'] = (int) $viewer['profile_id'];
        $viewer['age'] = (int) $viewer['age'];

        return $viewer;
    }

    /**
     * Récupérer les préférences du membre connecté.
     */
    private static function getPreferences(
        PDO $pdo,
        int $profileId
    ): array {
        $stmt = $pdo->prepare("
            SELECT
                preferred_gender,
                min_age,
                max_age,
                preferred_country,
                preferred_city

            FROM discovery_preferences

            WHERE profile_id = :profile_id
            LIMIT 1
        ");

        $stmt->execute([
            'profile_id' => $profileId
        ]);

        $preferences = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$preferences) {
            return [
                'preferred_gender' => null,
                'min_age' => 18,
                'max_age' => 99,
                'preferred_country' => null,
                'preferred_city' => null
            ];
        }

        $preferences['min_age'] = (int) $preferences['min_age'];
        $preferences['max_age'] = (int) $preferences['max_age'];

        return $preferences;
    }

    /**
     * Lire les profils compatibles.
     *
     * GET /api/discover?limit=12&after=0
     */
    public static function discover(): void
    {
        header('Cache-Control: no-store');

        try {
            $pdo = Database::getConnection();

            $viewer = self::getDiscoveryContext($pdo);

            $preferences = self::getPreferences(
                $pdo,
                $viewer['profile_id']
            );

            $limit = filter_var(
                $_GET['limit'] ?? 12,
                FILTER_VALIDATE_INT
            );

            $after = filter_var(
                $_GET['after'] ?? 0,
                FILTER_VALIDATE_INT
            );

            if (
                $limit === false ||
                $limit < 1 ||
                $limit > 24
            ) {
                self::respond(
                    422,
                    false,
                    'La limite doit être comprise entre 1 et 24.'
                );
            }

            if ($after === false || $after < 0) {
                self::respond(
                    422,
                    false,
                    'Curseur de pagination invalide.'
                );
            }

            $result = DiscoveryService::findProfiles(
                $pdo,
                $viewer,
                $preferences,
                $limit,
                $after
            );

            self::respond(
                200,
                true,
                'Profils compatibles récupérés avec succès.',
                $result
            );

        } catch (Throwable $e) {
            error_log(
                'DiscoveryController discover : ' . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible de récupérer les profils.'
            );
        }
    }

    /**
     * Enregistrer la consultation d'un profil.
     *
     * POST /api/discover/view
     */
    public static function recordView(): void
    {
        header('Cache-Control: no-store');

        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (
            !is_array($input) ||
            !isset($input['profile_id']) ||
            filter_var(
                $input['profile_id'],
                FILTER_VALIDATE_INT
            ) === false
        ) {
            self::respond(
                422,
                false,
                'Identifiant de profil invalide.'
            );
        }

        $viewedId = (int) $input['profile_id'];

        if ($viewedId <= 0) {
            self::respond(
                422,
                false,
                'Identifiant de profil invalide.'
            );
        }

        try {
            $pdo = Database::getConnection();

            $viewer = self::getDiscoveryContext($pdo);

            if ($viewer['profile_id'] === $viewedId) {
                self::respond(
                    422,
                    false,
                    'Vous ne pouvez pas consulter votre propre profil.'
                );
            }

            // Vérifier que le profil cible existe.
            $checkStmt = $pdo->prepare("
                SELECT id
                FROM profiles
                WHERE id = :profile_id
                LIMIT 1
            ");

            $checkStmt->execute([
                'profile_id' => $viewedId
            ]);

            if (!$checkStmt->fetch(PDO::FETCH_ASSOC)) {
                self::respond(
                    404,
                    false,
                    'Profil introuvable.'
                );
            }

            // INSERT IGNORE évite les doublons grâce à la contrainte UNIQUE.
            DiscoveryService::recordView(
                $pdo,
                $viewer['profile_id'],
                $viewedId
            );

            self::respond(
                200,
                true,
                'Consultation enregistrée ou déjà existante.'
            );

        } catch (Throwable $e) {
            error_log(
                'DiscoveryController recordView : ' . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible d’enregistrer cette consultation.'
            );
        }
    }
}
