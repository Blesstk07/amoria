<?php
declare(strict_types=1);

class DiscoveryService
{
    /**
     * Récupérer les profils compatibles avec le membre connecté.
     */
    public static function findProfiles(
        PDO $pdo,
        array $viewer,
        array $preferences,
        int $limit,
        int $after
    ): array {

        $sql = "
            SELECT
                p.id AS profile_id,
                p.pseudonym,
                p.gender,
                p.country,
                p.city,
                p.profession,
                p.biography,
                TIMESTAMPDIFF(
                    YEAR,
                    u.date_of_birth,
                    CURDATE()
                ) AS age

            FROM profiles p

            INNER JOIN users u
                ON u.id = p.user_id

            LEFT JOIN discovery_preferences dp
                ON dp.profile_id = p.id

            WHERE p.id <> :viewer_profile_id

              AND p.id > :after_id

              AND u.account_status = 'ACTIVE'
              AND u.email_verified_at IS NOT NULL
              AND u.deletion_status = 'NONE'
              AND u.date_of_birth IS NOT NULL

              AND TIMESTAMPDIFF(
                    YEAR,
                    u.date_of_birth,
                    CURDATE()
              ) >= 18

              -- Préférences du membre connecté
              AND TIMESTAMPDIFF(
                    YEAR,
                    u.date_of_birth,
                    CURDATE()
              ) BETWEEN :viewer_min_age AND :viewer_max_age

              AND (
                    :viewer_gender_filter_null IS NULL
                    OR p.gender = :viewer_gender_filter_value
              )

              AND (
                    :viewer_country_filter_null IS NULL
                    OR p.country = :viewer_country_filter_value
              )

              AND (
                    :viewer_city_filter_null IS NULL
                    OR p.city = :viewer_city_filter_value
              )

              -- Préférences réciproques du candidat
              AND (
                    dp.preferred_gender IS NULL
                    OR dp.preferred_gender = :viewer_gender
              )

              AND :viewer_age BETWEEN
                    COALESCE(dp.min_age, 18)
                    AND COALESCE(dp.max_age, 99)

              AND (
                    dp.preferred_country IS NULL
                    OR dp.preferred_country = :viewer_country
              )

              AND (
                    dp.preferred_city IS NULL
                    OR dp.preferred_city = :viewer_city
              )

              -- Exclure les blocages dans les deux sens
              AND NOT EXISTS (
                    SELECT 1
                    FROM blocks b
                    WHERE b.status = 'ACTIVE'
                      AND (
                          (
                              b.blocker_id = :blocker_viewer
                              AND b.blocked_id = p.id
                          )
                          OR
                          (
                              b.blocker_id = p.id
                              AND b.blocked_id = :blocked_viewer
                          )
                      )
              )

              -- Exclure les matchs actifs
              AND NOT EXISTS (
                    SELECT 1
                    FROM matches m
                    WHERE m.status = 'ACTIVE'
                      AND (
                          (
                              m.profile_a_id = :match_viewer_a
                              AND m.profile_b_id = p.id
                          )
                          OR
                          (
                              m.profile_a_id = p.id
                              AND m.profile_b_id = :match_viewer_b
                          )
                      )
              )

              -- Exclure les Likes définitifs et les Pass récents
              AND NOT EXISTS (
                    SELECT 1
                    FROM profile_actions pa
                    WHERE pa.actor_id = :action_viewer
                      AND pa.target_id = p.id
                      AND (
                          pa.action_type = 'LIKE'
                          OR (
                              pa.action_type = 'PASS'
                              AND pa.updated_at >
                                  DATE_SUB(NOW(), INTERVAL 30 DAY)
                          )
                      )
              )

              -- Exclure les consultations des 30 derniers jours
              AND NOT EXISTS (
                    SELECT 1
                    FROM discovery_views dv
                    WHERE dv.viewer_id = :views_viewer
                      AND dv.viewed_id = p.id
                      AND dv.viewed_at >
                          DATE_SUB(NOW(), INTERVAL 30 DAY)
              )

            ORDER BY p.id ASC
            LIMIT :result_limit
        ";

        $stmt = $pdo->prepare($sql);

        // Identité du membre connecté
        $viewerId = (int) $viewer['profile_id'];

        $stmt->bindValue(
            ':viewer_profile_id',
            $viewerId,
            PDO::PARAM_INT
        );

        $stmt->bindValue(
            ':after_id',
            $after,
            PDO::PARAM_INT
        );

        // Préférences d'âge
        $stmt->bindValue(
            ':viewer_min_age',
            (int) $preferences['min_age'],
            PDO::PARAM_INT
        );

        $stmt->bindValue(
            ':viewer_max_age',
            (int) $preferences['max_age'],
            PDO::PARAM_INT
        );

        // Préférence de genre : deux paramètres distincts
        $preferredGender = $preferences['preferred_gender'];

        $genderType = $preferredGender === null
            ? PDO::PARAM_NULL
            : PDO::PARAM_STR;

        $stmt->bindValue(
            ':viewer_gender_filter_null',
            $preferredGender,
            $genderType
        );

        $stmt->bindValue(
            ':viewer_gender_filter_value',
            $preferredGender,
            $genderType
        );

        // Préférence de pays : deux paramètres distincts
        $preferredCountry = $preferences['preferred_country'];

        $countryType = $preferredCountry === null
            ? PDO::PARAM_NULL
            : PDO::PARAM_STR;

        $stmt->bindValue(
            ':viewer_country_filter_null',
            $preferredCountry,
            $countryType
        );

        $stmt->bindValue(
            ':viewer_country_filter_value',
            $preferredCountry,
            $countryType
        );

        // Préférence de ville : deux paramètres distincts
        $preferredCity = $preferences['preferred_city'];

        $cityType = $preferredCity === null
            ? PDO::PARAM_NULL
            : PDO::PARAM_STR;

        $stmt->bindValue(
            ':viewer_city_filter_null',
            $preferredCity,
            $cityType
        );

        $stmt->bindValue(
            ':viewer_city_filter_value',
            $preferredCity,
            $cityType
        );

        // Informations du membre pour les préférences réciproques
        $stmt->bindValue(
            ':viewer_gender',
            $viewer['gender'],
            PDO::PARAM_STR
        );

        $stmt->bindValue(
            ':viewer_age',
            (int) $viewer['age'],
            PDO::PARAM_INT
        );

        $stmt->bindValue(
            ':viewer_country',
            $viewer['country'],
            $viewer['country'] === null
                ? PDO::PARAM_NULL
                : PDO::PARAM_STR
        );

        $stmt->bindValue(
            ':viewer_city',
            $viewer['city'],
            $viewer['city'] === null
                ? PDO::PARAM_NULL
                : PDO::PARAM_STR
        );

        // Blocages
        $stmt->bindValue(
            ':blocker_viewer',
            $viewerId,
            PDO::PARAM_INT
        );

        $stmt->bindValue(
            ':blocked_viewer',
            $viewerId,
            PDO::PARAM_INT
        );

        // Matchs
        $stmt->bindValue(
            ':match_viewer_a',
            $viewerId,
            PDO::PARAM_INT
        );

        $stmt->bindValue(
            ':match_viewer_b',
            $viewerId,
            PDO::PARAM_INT
        );

        // Actions
        $stmt->bindValue(
            ':action_viewer',
            $viewerId,
            PDO::PARAM_INT
        );

        // Consultations
        $stmt->bindValue(
            ':views_viewer',
            $viewerId,
            PDO::PARAM_INT
        );

        // Un résultat supplémentaire pour détecter la page suivante
        $stmt->bindValue(
            ':result_limit',
            $limit + 1,
            PDO::PARAM_INT
        );

        $stmt->execute();

        $profiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $hasMore = count($profiles) > $limit;

        if ($hasMore) {
            array_pop($profiles);
        }

        // Récupérer les centres d'intérêt des profils trouvés
        if ($profiles !== []) {

            $profileIds = array_map(
                'intval',
                array_column($profiles, 'profile_id')
            );

            $placeholders = implode(
                ',',
                array_fill(0, count($profileIds), '?')
            );

            $interestStmt = $pdo->prepare("
                SELECT
                    pi.profile_id,
                    i.id,
                    i.name

                FROM profile_interests pi

                INNER JOIN interests i
                    ON i.id = pi.interest_id

                WHERE pi.profile_id IN ($placeholders)
                  AND i.status = 'APPROVED'

                ORDER BY i.name
            ");

            $interestStmt->execute($profileIds);

            $interestRows = $interestStmt->fetchAll(
                PDO::FETCH_ASSOC
            );

            $interestsByProfile = [];

            foreach ($interestRows as $interest) {

                $profileId = (int) $interest['profile_id'];

                $interestsByProfile[$profileId][] = [
                    'id' => (int) $interest['id'],
                    'name' => $interest['name']
                ];
            }

            foreach ($profiles as &$profile) {

                $profile['profile_id'] = (int) $profile['profile_id'];
                $profile['age'] = (int) $profile['age'];

                $profile['interests'] =
                    $interestsByProfile[$profile['profile_id']] ?? [];
            }

            unset($profile);
        }

        return [
            'profiles' => $profiles,
            'has_more' => $hasMore,
            'next_cursor' => $profiles !== []
                ? (int) end($profiles)['profile_id']
                : null
        ];
    }

    /**
     * Enregistrer la consultation d'un profil.
     */
    public static function recordView(
        PDO $pdo,
        int $viewerId,
        int $viewedId
    ): bool {

        if (
            $viewerId <= 0 ||
            $viewedId <= 0 ||
            $viewerId === $viewedId
        ) {
            return false;
        }

        $stmt = $pdo->prepare("
            INSERT INTO discovery_views (
                viewer_id,
                viewed_id
            )
            VALUES (
                :viewer_id,
                :viewed_id
            )
            ON DUPLICATE KEY UPDATE
                viewed_at = CURRENT_TIMESTAMP
        ");

        $stmt->execute([
            'viewer_id' => $viewerId,
            'viewed_id' => $viewedId
        ]);

        return $stmt->rowCount() > 0;
    }
}
