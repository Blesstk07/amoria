<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';

class ProfileController
{
    /**
     * Envoyer une réponse JSON et terminer la requête.
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
     * Vérifier la session et récupérer le profil du membre connecté.
     */
    private static function getProfileContext(PDO $pdo): array
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
                p.id AS profile_id
            FROM users u
            INNER JOIN profiles p ON p.user_id = u.id
            WHERE u.id = :user_id
              AND u.deletion_status = 'NONE'
            LIMIT 1
        ");

        $stmt->execute(['user_id' => $userId]);
        $context = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$context) {
            self::respond(404, false, 'Profil introuvable.');
        }

        if ($context['account_status'] !== 'ACTIVE') {
            self::respond(403, false, 'Ce compte est actuellement indisponible.');
        }

        return $context;
    }

    /**
     * Lire le JSON envoyé par le frontend.
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
     * Récupérer le profil, les intérêts et les préférences.
     */
    public static function getProfile(): void
    {
        header('Cache-Control: no-store');

        try {
            $pdo = Database::getConnection();
            $context = self::getProfileContext($pdo);

            $profileStmt = $pdo->prepare("
                SELECT
                    id,
                    pseudonym,
                    gender,
                    country,
                    city,
                    profession,
                    biography,
                    created_at,
                    updated_at
                FROM profiles
                WHERE id = :profile_id
                LIMIT 1
            ");

            $profileStmt->execute([
                'profile_id' => $context['profile_id']
            ]);

            $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);

            $interestStmt = $pdo->prepare("
                SELECT i.id, i.name
                FROM profile_interests pi
                INNER JOIN interests i ON i.id = pi.interest_id
                WHERE pi.profile_id = :profile_id
                  AND i.status = 'APPROVED'
                ORDER BY i.id
            ");

            $interestStmt->execute([
                'profile_id' => $context['profile_id']
            ]);

            $interests = $interestStmt->fetchAll(PDO::FETCH_ASSOC);

            $preferencesStmt = $pdo->prepare("
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

            $preferencesStmt->execute([
                'profile_id' => $context['profile_id']
            ]);

            $preferences = $preferencesStmt->fetch(PDO::FETCH_ASSOC);

            // Valeurs par défaut si les préférences n'existent pas.
            if (!$preferences) {
                $preferences = [
                    'preferred_gender' => null,
                    'min_age' => 18,
                    'max_age' => 99,
                    'preferred_country' => null,
                    'preferred_city' => null
                ];
            } else {
                $preferences['min_age'] = (int) $preferences['min_age'];
                $preferences['max_age'] = (int) $preferences['max_age'];
            }

            self::respond(
                200,
                true,
                'Profil récupéré avec succès.',
                [
                    'profile' => $profile,
                    'interests' => $interests,
                    'preferences' => $preferences
                ]
            );

        } catch (Throwable $e) {
            error_log('ProfileController getProfile : ' . $e->getMessage());

            self::respond(500, false, 'Impossible de récupérer le profil.');
        }
    }

    /**
     * Modifier les informations personnelles et les intérêts.
     */
    public static function updateProfile(): void
    {
        header('Cache-Control: no-store');

        $input = self::getJsonInput();

        $requiredFields = [
            'pseudonym',
            'gender',
            'country',
            'city',
            'profession',
            'biography',
            'interests'
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $input)) {
                self::respond(
                    422,
                    false,
                    "Le champ {$field} est obligatoire."
                );
            }
        }

        $pseudonym = trim((string) $input['pseudonym']);
        $gender = $input['gender'];
        $country = strtoupper(trim((string) $input['country']));
        $city = trim((string) $input['city']);
        $profession = $input['profession'];
        $biography = $input['biography'];
        $interests = $input['interests'];

        if (
            mb_strlen($pseudonym) < 2 ||
            mb_strlen($pseudonym) > 50
        ) {
            self::respond(422, false, 'Le pseudonyme doit contenir entre 2 et 50 caractères.');
        }

        if (!in_array($gender, ['MAN', 'WOMAN'], true)) {
            self::respond(422, false, 'Genre invalide.');
        }

        if (!preg_match('/^[A-Z]{2}$/', $country)) {
            self::respond(422, false, 'Code pays invalide. Utilisez deux lettres ISO.');
        }

        if ($city === '' || mb_strlen($city) > 100) {
            self::respond(422, false, 'La ville est obligatoire et ne doit pas dépasser 100 caractères.');
        }

        if (
            $profession !== null &&
            (!is_string($profession) || mb_strlen(trim($profession)) > 100)
        ) {
            self::respond(422, false, 'Profession invalide ou trop longue.');
        }

        if (
            $biography !== null &&
            (!is_string($biography) || mb_strlen($biography) > 1000)
        ) {
            self::respond(422, false, 'La biographie ne doit pas dépasser 1000 caractères.');
        }

        if (!is_array($interests) || count($interests) < 1 || count($interests) > 20) {
            self::respond(422, false, 'Sélectionnez entre 1 et 20 centres d’intérêt.');
        }

        // Vérifier que chaque identifiant est un entier valide et unique.
        $interestIds = [];

        foreach ($interests as $interestId) {
            if (!is_int($interestId) || $interestId <= 0) {
                self::respond(422, false, 'Identifiant de centre d’intérêt invalide.');
            }

            $interestIds[] = $interestId;
        }

        if (count(array_unique($interestIds)) !== count($interestIds)) {
            self::respond(422, false, 'Un centre d’intérêt ne peut pas être sélectionné deux fois.');
        }

        $profession = $profession === null ? null : trim($profession);
        $biography = $biography === null ? null : trim($biography);

        try {
            $pdo = Database::getConnection();
            $context = self::getProfileContext($pdo);

            $pdo->beginTransaction();

            // Vérifier l'existence et l'approbation des intérêts.
            $placeholders = implode(',', array_fill(0, count($interestIds), '?'));

            $checkStmt = $pdo->prepare("
                SELECT id
                FROM interests
                WHERE status = 'APPROVED'
                  AND id IN ($placeholders)
            ");

            $checkStmt->execute($interestIds);

            $approvedIds = array_map(
                'intval',
                $checkStmt->fetchAll(PDO::FETCH_COLUMN)
            );

            sort($approvedIds);

            $submittedIds = $interestIds;
            sort($submittedIds);

            if ($approvedIds !== $submittedIds) {
                $pdo->rollBack();

                self::respond(
                    422,
                    false,
                    'Un ou plusieurs centres d’intérêt sont inexistants ou non approuvés.'
                );
            }

            // Modifier le profil.
            $updateStmt = $pdo->prepare("
                UPDATE profiles
                SET
                    pseudonym = :pseudonym,
                    gender = :gender,
                    country = :country,
                    city = :city,
                    profession = :profession,
                    biography = :biography
                WHERE id = :profile_id
            ");

            $updateStmt->execute([
                'pseudonym' => $pseudonym,
                'gender' => $gender,
                'country' => $country,
                'city' => $city,
                'profession' => $profession,
                'biography' => $biography,
                'profile_id' => $context['profile_id']
            ]);

            // Remplacer les anciens intérêts.
            $deleteStmt = $pdo->prepare("
                DELETE FROM profile_interests
                WHERE profile_id = :profile_id
            ");

            $deleteStmt->execute([
                'profile_id' => $context['profile_id']
            ]);

            $insertStmt = $pdo->prepare("
                INSERT INTO profile_interests (profile_id, interest_id)
                VALUES (:profile_id, :interest_id)
            ");

            foreach ($interestIds as $interestId) {
                $insertStmt->execute([
                    'profile_id' => $context['profile_id'],
                    'interest_id' => $interestId
                ]);
            }

            $pdo->commit();

            self::respond(
                200,
                true,
                'Profil modifié avec succès.'
            );

        } catch (PDOException $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }

            // Violation d'une contrainte UNIQUE.
            if (
                $e->getCode() === '23000' &&
                (int) ($e->errorInfo[1] ?? 0) === 1062
            ) {
                self::respond(409, false, 'Ce pseudonyme est déjà utilisé.');
            }

            error_log('ProfileController updateProfile : ' . $e->getMessage());

            self::respond(500, false, 'Impossible de modifier le profil.');

        } catch (Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }

            error_log('ProfileController updateProfile : ' . $e->getMessage());

            self::respond(500, false, 'Une erreur est survenue.');
        }
    }

    /**
     * Modifier les préférences de découverte.
     */
    public static function updatePreferences(): void
    {
        header('Cache-Control: no-store');

        $input = self::getJsonInput();

        $requiredFields = [
            'preferred_gender',
            'min_age',
            'max_age',
            'preferred_country',
            'preferred_city'
        ];

        foreach ($requiredFields as $field) {
            if (!array_key_exists($field, $input)) {
                self::respond(
                    422,
                    false,
                    "Le champ {$field} est obligatoire."
                );
            }
        }

        $gender = $input['preferred_gender'];
        $minAge = filter_var($input['min_age'], FILTER_VALIDATE_INT);
        $maxAge = filter_var($input['max_age'], FILTER_VALIDATE_INT);

        $country = $input['preferred_country'];
        $city = $input['preferred_city'];

        if (
            $gender !== null &&
            !in_array($gender, ['MAN', 'WOMAN'], true)
        ) {
            self::respond(422, false, 'Genre recherché invalide.');
        }

        if (
            $minAge === false ||
            $maxAge === false ||
            $minAge < 18 ||
            $maxAge > 99 ||
            $minAge > $maxAge
        ) {
            self::respond(422, false, 'Tranche d’âge invalide. Minimum 18 ans, maximum 99 ans.');
        }

        if ($country !== null) {
            if (
                !is_string($country) ||
                !preg_match('/^[A-Za-z]{2}$/', $country)
            ) {
                self::respond(422, false, 'Code pays invalide.');
            }

            $country = strtoupper($country);
        }

        if (
            $city !== null &&
            (!is_string($city) || mb_strlen(trim($city)) > 100)
        ) {
            self::respond(422, false, 'Ville recherchée invalide.');
        }

        $city = $city === null || trim($city) === ''
            ? null
            : trim($city);

        try {
            $pdo = Database::getConnection();
            $context = self::getProfileContext($pdo);

            // Créer ou mettre à jour les préférences.
            $stmt = $pdo->prepare("
                INSERT INTO discovery_preferences (
                    profile_id,
                    preferred_gender,
                    min_age,
                    max_age,
                    preferred_country,
                    preferred_city
                )
                VALUES (
                    :profile_id,
                    :preferred_gender,
                    :min_age,
                    :max_age,
                    :preferred_country,
                    :preferred_city
                )
                ON DUPLICATE KEY UPDATE
                    preferred_gender = VALUES(preferred_gender),
                    min_age = VALUES(min_age),
                    max_age = VALUES(max_age),
                    preferred_country = VALUES(preferred_country),
                    preferred_city = VALUES(preferred_city)
            ");

            $stmt->execute([
                'profile_id' => $context['profile_id'],
                'preferred_gender' => $gender,
                'min_age' => $minAge,
                'max_age' => $maxAge,
                'preferred_country' => $country,
                'preferred_city' => $city
            ]);

            self::respond(
                200,
                true,
                'Préférences de découverte enregistrées.'
            );

        } catch (Throwable $e) {
            error_log('ProfileController updatePreferences : ' . $e->getMessage());

            self::respond(500, false, 'Impossible d’enregistrer les préférences.');
        }
    }
}
