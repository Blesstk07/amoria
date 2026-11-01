<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Services/InteractionService.php';

class InteractionController
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
        header('Cache-Control: no-store');

        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    /**
     * Vérifier la session et l'éligibilité du membre.
     */
    private static function getContext(PDO $pdo): array
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
            INNER JOIN profiles p ON p.user_id = u.id
            WHERE u.id = :user_id
            LIMIT 1
        ");

        $stmt->execute([
            'user_id' => $userId
        ]);

        $context = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$context || $context['deletion_status'] !== 'NONE') {
            self::respond(404, false, 'Profil introuvable.');
        }

        if ($context['account_status'] !== 'ACTIVE') {
            self::respond(
                403,
                false,
                'Ce compte est actuellement indisponible.'
            );
        }

        if ($context['email_verified_at'] === null) {
            self::respond(
                403,
                false,
                'Vous devez confirmer votre adresse e-mail.'
            );
        }

        if (
            $context['date_of_birth'] === null ||
            $context['age'] === null ||
            (int) $context['age'] < 18
        ) {
            self::respond(
                403,
                false,
                'Votre profil doit contenir une date de naissance valide.'
            );
        }

        $context['user_id'] = (int) $context['user_id'];
        $context['profile_id'] = (int) $context['profile_id'];
        $context['age'] = (int) $context['age'];

        return $context;
    }

    /**
     * Lire et valider les données JSON.
     */
    private static function getJsonInput(): array
    {
        $input = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($input)) {
            self::respond(400, false, 'Données JSON invalides.');
        }

        return $input;
    }

    /**
     * Envoyer un Like ou un Pass.
     */
    public static function sendAction(): void
    {
        try {
            $pdo = Database::getConnection();
            $actor = self::getContext($pdo);
            $input = self::getJsonInput();

            if (
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

            $targetId = (int) $input['profile_id'];
            $action = strtoupper(trim($input['action'] ?? ''));

            $result = InteractionService::applyAction(
                $pdo,
                $actor,
                $targetId,
                $action
            );

            $message = $result['matched']
                ? 'C’est un Match ! Vous vous êtes mutuellement aimés.'
                : (
                    $action === 'LIKE'
                        ? 'Like envoyé.'
                        : 'Profil passé.'
                );

            self::respond(
                200,
                true,
                $message,
                $result
            );

        } catch (InteractionException $e) {
            self::respond(
                $e->httpStatus,
                false,
                $e->getMessage()
            );

        } catch (Throwable $e) {
            error_log(
                'InteractionController sendAction : '
                . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible d’enregistrer cette interaction.'
            );
        }
    }

    /**
     * Consulter les Likes reçus.
     */
    public static function getLikes(): void
    {
        try {
            $pdo = Database::getConnection();
            $context = self::getContext($pdo);

            $likes = InteractionService::getReceivedLikes(
                $pdo,
                $context['profile_id']
            );

            self::respond(
                200,
                true,
                'Likes reçus récupérés.',
                [
                    'likes' => $likes,
                    'total' => count($likes)
                ]
            );

        } catch (Throwable $e) {
            error_log(
                'InteractionController getLikes : '
                . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible de récupérer les Likes reçus.'
            );
        }
    }

    /**
     * Consulter les Matches actifs.
     */
    public static function getMatches(): void
    {
        try {
            $pdo = Database::getConnection();
            $context = self::getContext($pdo);

            $matches = InteractionService::getMatches(
                $pdo,
                $context['profile_id']
            );

            self::respond(
                200,
                true,
                'Matches récupérés.',
                [
                    'matches' => $matches,
                    'total' => count($matches)
                ]
            );

        } catch (Throwable $e) {
            error_log(
                'InteractionController getMatches : '
                . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible de récupérer les Matches.'
            );
        }
    }

    /**
     * Terminer un Match.
     */
    public static function endMatch(): void
    {
        try {
            $pdo = Database::getConnection();
            $context = self::getContext($pdo);
            $input = self::getJsonInput();

            if (
                !isset($input['match_id']) ||
                filter_var(
                    $input['match_id'],
                    FILTER_VALIDATE_INT
                ) === false
            ) {
                self::respond(
                    422,
                    false,
                    'Identifiant de Match invalide.'
                );
            }

            InteractionService::endMatch(
                $pdo,
                $context['profile_id'],
                (int) $input['match_id']
            );

            self::respond(
                200,
                true,
                'Match terminé.'
            );

        } catch (InteractionException $e) {
            self::respond(
                $e->httpStatus,
                false,
                $e->getMessage()
            );

        } catch (Throwable $e) {
            error_log(
                'InteractionController endMatch : '
                . $e->getMessage()
            );

            self::respond(
                500,
                false,
                'Impossible de terminer ce Match.'
            );
        }
    }
}