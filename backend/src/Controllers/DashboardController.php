<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

class DashboardController
{
    /**
     * Répondre à une requête avec du JSON.
     */
    private static function respond(
        int $status,
        bool $success,
        string $message,
        array $data = []
    ): void {
        http_response_code($status);

        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    /**
     * Récupérer les informations du membre connecté.
     */
    public static function getDashboard(): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store'); // données personnelles : pas de cache

        // 1. La session doit avoir été démarrée (dans public/index.php).
        if (session_status() !== PHP_SESSION_ACTIVE) {
            error_log('DashboardController : la session PHP n’est pas démarrée.');

            self::respond(500, false, 'Session indisponible.');
        }

        // 2. Vérifier que le membre est connecté.
        $userId = (int) ($_SESSION['user_id'] ?? 0);

        if ($userId <= 0) {
            self::respond(401, false, 'Vous devez être connecté.');
        }

        try {
            $pdo = Database::getConnection();

            // 3. Récupérer le membre et son profil.
            $sql = "
                SELECT
                    u.id,
                    u.email,
                    u.account_status,
                    u.email_verified_at,
                    u.created_at,
                    p.pseudonym,
                    p.gender,
                    p.country,
                    p.city,
                    p.profession,
                    p.biography
                FROM users u
                INNER JOIN profiles p ON p.user_id = u.id
                WHERE u.id = :user_id
                AND u.deletion_status = 'NONE'
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);
            $stmt->execute(['user_id' => $userId]);

            $member = $stmt->fetch();

            if (!$member) {
                self::respond(404, false, 'Profil introuvable.');
            }

            // 4. Un compte suspendu ne doit pas accéder au tableau de bord,
            // même avec une session encore valide.
            if ($member['account_status'] !== 'ACTIVE') {
                self::respond(403, false, 'Ce compte est actuellement indisponible.');
            }

            $member['id'] = (int) $member['id'];

            // 5. Répondre au frontend.
            self::respond(
                200,
                true,
                'Informations du tableau de bord récupérées.',
                ['member' => $member]
            );
        } catch (Throwable $e) {
            error_log('Erreur DashboardController : ' . $e->getMessage());

            self::respond(500, false, 'Une erreur est survenue.');
        }
    }
}