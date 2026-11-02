<?php
 
declare(strict_types=1);
 
class InteractionException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $httpStatus = 409
    ) {
        parent::__construct($message);
    }
}
 
class InteractionService
{
    /**
     * Enregistrer un Like ou un Pass.
     */
    public static function applyAction(
        PDO $pdo,
        array $actor,
        int $targetId,
        string $action
    ): array {
        $actorId = (int) $actor['profile_id'];
 
        $action = strtoupper(trim($action));
 
        if (!in_array($action, ['LIKE', 'PASS'], true)) {
            throw new InteractionException(
                'Action invalide. Utilisez LIKE ou PASS.',
                422
            );
        }
 
        if ($targetId <= 0 || $targetId === $actorId) {
            throw new InteractionException(
                'Profil cible invalide.',
                422
            );
        }
 
        $pdo->beginTransaction();
 
        try {
            // Verrouiller les deux profils dans l'ordre croissant.
            $firstId = min($actorId, $targetId);
            $secondId = max($actorId, $targetId);
 
            $lockStmt = $pdo->prepare("
                SELECT id
                FROM profiles
                WHERE id IN (:first_id, :second_id)
                ORDER BY id
                FOR UPDATE
            ");
 
            $lockStmt->execute([
                'first_id' => $firstId,
                'second_id' => $secondId
            ]);
 
            if (count($lockStmt->fetchAll(PDO::FETCH_COLUMN)) !== 2) {
                throw new InteractionException(
                    'Profil introuvable.',
                    404
                );
            }
 
            // Vérifier que le profil cible est toujours admissible.
            $targetStmt = $pdo->prepare("
                SELECT p.id
                FROM profiles p
                INNER JOIN users u ON u.id = p.user_id
                WHERE p.id = :target_id
                  AND u.account_status = 'ACTIVE'
                  AND u.email_verified_at IS NOT NULL
                  AND u.deletion_status = 'NONE'
                  AND u.date_of_birth IS NOT NULL
                  AND TIMESTAMPDIFF(
                      YEAR,
                      u.date_of_birth,
                      CURDATE()
                  ) >= 18
                LIMIT 1
            ");
 
            $targetStmt->execute([
                'target_id' => $targetId
            ]);
 
            if (!$targetStmt->fetchColumn()) {
                throw new InteractionException(
                    'Ce profil est actuellement indisponible.',
                    404
                );
            }
 
            // Vérifier les blocages dans les deux sens.
            $blockStmt = $pdo->prepare("
                SELECT id
                FROM blocks
                WHERE status = 'ACTIVE'
                  AND (
                      (blocker_id = :actor_id AND blocked_id = :target_id)
                      OR
                      (blocker_id = :target_id_reverse AND blocked_id = :actor_id_reverse)
                  )
                LIMIT 1
            ");
 
            $blockStmt->execute([
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'target_id_reverse' => $targetId,
                'actor_id_reverse' => $actorId
            ]);
 
            if ($blockStmt->fetchColumn()) {
                throw new InteractionException(
                    'Cette interaction n’est pas autorisée.',
                    403
                );
            }
 
            // Rechercher un Match existant pour cette paire.
            $matchStmt = $pdo->prepare("
                SELECT id, status
                FROM matches
                WHERE profile_a_id = :profile_a
                  AND profile_b_id = :profile_b
                LIMIT 1
                FOR UPDATE
            ");
 
            $matchStmt->execute([
                'profile_a' => $firstId,
                'profile_b' => $secondId
            ]);
 
            $existingMatch = $matchStmt->fetch(PDO::FETCH_ASSOC);
 
            if ($existingMatch && $existingMatch['status'] === 'BLOCKED') {
                throw new InteractionException(
                    'Cette paire de profils ne peut pas être mise en relation.',
                    403
                );
            }
 
            if ($existingMatch && $existingMatch['status'] === 'ACTIVE') {
                if ($action === 'PASS') {
                    throw new InteractionException(
                        'Vous devez terminer ce Match avant de passer ce profil.',
                        409
                    );
                }
 
                $pdo->commit();
 
                return [
                    'action' => 'LIKE',
                    'matched' => true,
                    'match_id' => (int) $existingMatch['id'],
                    'already_matched' => true
                ];
            }
 
            // Un Like doit respecter les préférences des deux profils.
            if ($action === 'LIKE') {
                self::validateMutualPreferences(
                    $pdo,
                    $actorId,
                    $targetId
                );
            }
 
            // Vérifier l'action précédente pour éviter les notifications répétées.
            $previousStmt = $pdo->prepare("
                SELECT action_type
                FROM profile_actions
                WHERE actor_id = :actor_id
                  AND target_id = :target_id
                LIMIT 1
            ");
 
            $previousStmt->execute([
                'actor_id' => $actorId,
                'target_id' => $targetId
            ]);
 
            $previousAction = $previousStmt->fetchColumn();
 
            // Créer ou actualiser l'action.
            $actionStmt = $pdo->prepare("
                INSERT INTO profile_actions (
                    actor_id,
                    target_id,
                    action_type
                )
                VALUES (
                    :actor_id,
                    :target_id,
                    :action_type
                )
                ON DUPLICATE KEY UPDATE
                    action_type = VALUES(action_type),
                    updated_at = CURRENT_TIMESTAMP
            ");
 
            $actionStmt->execute([
                'actor_id' => $actorId,
                'target_id' => $targetId,
                'action_type' => $action
            ]);
 
            $result = [
                'action' => $action,
                'matched' => false,
                'match_id' => null,
                'already_matched' => false
            ];
 
            if ($action === 'LIKE') {
                // Rechercher le Like réciproque.
                $reciprocalStmt = $pdo->prepare("
                    SELECT id
                    FROM profile_actions
                    WHERE actor_id = :target_id
                      AND target_id = :actor_id
                      AND action_type = 'LIKE'
                    LIMIT 1
                ");
 
                $reciprocalStmt->execute([
                    'target_id' => $targetId,
                    'actor_id' => $actorId
                ]);
 
                $hasReciprocalLike = (bool) $reciprocalStmt->fetchColumn();
 
                if ($hasReciprocalLike) {
                    if ($existingMatch && $existingMatch['status'] === 'ENDED') {
                        // Réactiver le Match après deux nouveaux Likes.
                        $reactivateStmt = $pdo->prepare("
                            UPDATE matches
                            SET status = 'ACTIVE',
                                matched_at = CURRENT_TIMESTAMP,
                                ended_at = NULL
                            WHERE id = :match_id
                              AND status = 'ENDED'
                        ");
 
                        $reactivateStmt->execute([
                            'match_id' => (int) $existingMatch['id']
                        ]);
 
                        $matchId = (int) $existingMatch['id'];
 
                    } else {
                        // Créer un nouveau Match.
                        $insertMatch = $pdo->prepare("
                            INSERT INTO matches (
                                profile_a_id,
                                profile_b_id,
                                status
                            )
                            VALUES (
                                :profile_a,
                                :profile_b,
                                'ACTIVE'
                            )
                        ");
 
                        $insertMatch->execute([
                            'profile_a' => $firstId,
                            'profile_b' => $secondId
                        ]);
 
                        $matchId = (int) $pdo->lastInsertId();
                    }
 
                    self::createMatchNotifications(
                        $pdo,
                        $firstId,
                        $secondId,
                        $matchId
                    );
 
                    $result['matched'] = true;
                    $result['match_id'] = $matchId;
 
                } elseif ($previousAction !== 'LIKE') {
                    // Notifier le destinataire d'un nouveau Like.
                    self::createLikeNotification(
                        $pdo,
                        $actorId,
                        $targetId
                    );
                }
            }
 
            $pdo->commit();
 
            return $result;
 
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
 
            throw $e;
        }
    }
 
    /**
     * Bloquer un profil.
     */
    public static function blockUser(
        PDO $pdo,
        int $actorId,
        int $targetId
    ): void {
        if ($actorId <= 0 || $targetId <= 0 || $actorId === $targetId) {
            throw new InteractionException(
                'Profil cible invalide.',
                422
            );
        }

        $pdo->beginTransaction();

        try {
            // Verrouiller les deux profils dans le même ordre
            // que applyAction() et endMatch().
            $firstId = min($actorId, $targetId);
            $secondId = max($actorId, $targetId);

            $lockStmt = $pdo->prepare("
                SELECT id
                FROM profiles
                WHERE id IN (:first_id, :second_id)
                ORDER BY id
                FOR UPDATE
            ");

            $lockStmt->execute([
                'first_id' => $firstId,
                'second_id' => $secondId
            ]);

            if (count($lockStmt->fetchAll(PDO::FETCH_COLUMN)) !== 2) {
                throw new InteractionException(
                    'Profil introuvable.',
                    404
                );
            }

            // Enregistrer ou réactiver le blocage.
            $blockStmt = $pdo->prepare("
                INSERT INTO blocks (
                    blocker_id,
                    blocked_id,
                    status
                )
                VALUES (
                    :blocker_id,
                    :blocked_id,
                    'ACTIVE'
                )
                ON DUPLICATE KEY UPDATE
                    status = 'ACTIVE',
                    updated_at = CURRENT_TIMESTAMP
            ");

            $blockStmt->execute([
                'blocker_id' => $actorId,
                'blocked_id' => $targetId
            ]);

            // Rechercher et verrouiller le Match éventuel.
            $matchStmt = $pdo->prepare("
                SELECT id, status
                FROM matches
                WHERE profile_a_id = :profile_a
                  AND profile_b_id = :profile_b
                LIMIT 1
                FOR UPDATE
            ");

            $matchStmt->execute([
                'profile_a' => $firstId,
                'profile_b' => $secondId
            ]);

            $match = $matchStmt->fetch(PDO::FETCH_ASSOC);

            // Un Match actif devient BLOCKED.
            if ($match && $match['status'] === 'ACTIVE') {
                $updateMatch = $pdo->prepare("
                    UPDATE matches
                    SET status = 'BLOCKED',
                        ended_at = CURRENT_TIMESTAMP
                    WHERE id = :match_id
                      AND status = 'ACTIVE'
                ");

                $updateMatch->execute([
                    'match_id' => (int) $match['id']
                ]);
            }

            // Supprimer les anciennes interactions réciproques.
            $deleteActions = $pdo->prepare("
                DELETE FROM profile_actions
                WHERE (
                    actor_id = :first_actor
                    AND target_id = :first_target
                )
                OR (
                    actor_id = :second_actor
                    AND target_id = :second_target
                )
            ");

            $deleteActions->execute([
                'first_actor' => $firstId,
                'first_target' => $secondId,
                'second_actor' => $secondId,
                'second_target' => $firstId
            ]);

            // Réinitialiser les consultations réciproques.
            $deleteViews = $pdo->prepare("
                DELETE FROM discovery_views
                WHERE (
                    viewer_id = :first_viewer
                    AND viewed_id = :first_viewed
                )
                OR (
                    viewer_id = :second_viewer
                    AND viewed_id = :second_viewed
                )
            ");

            $deleteViews->execute([
                'first_viewer' => $firstId,
                'first_viewed' => $secondId,
                'second_viewer' => $secondId,
                'second_viewed' => $firstId
            ]);

            $pdo->commit();

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    /**
     * Débloquer un profil.
     */
    public static function unblockUser(
        PDO $pdo,
        int $actorId,
        int $targetId
    ): void {
        if ($actorId <= 0 || $targetId <= 0 || $actorId === $targetId) {
            throw new InteractionException(
                'Profil cible invalide.',
                422
            );
        }

        $pdo->beginTransaction();

        try {
            $firstId = min($actorId, $targetId);
            $secondId = max($actorId, $targetId);

            // Même ordre de verrouillage que les autres opérations.
            $lockStmt = $pdo->prepare("
                SELECT id
                FROM profiles
                WHERE id IN (:first_id, :second_id)
                ORDER BY id
                FOR UPDATE
            ");

            $lockStmt->execute([
                'first_id' => $firstId,
                'second_id' => $secondId
            ]);

            if (count($lockStmt->fetchAll(PDO::FETCH_COLUMN)) !== 2) {
                throw new InteractionException(
                    'Profil introuvable.',
                    404
                );
            }

            // Vérifier le blocage créé par le membre connecté.
            $blockStmt = $pdo->prepare("
                SELECT id
                FROM blocks
                WHERE blocker_id = :blocker_id
                  AND blocked_id = :blocked_id
                  AND status = 'ACTIVE'
                LIMIT 1
                FOR UPDATE
            ");

            $blockStmt->execute([
                'blocker_id' => $actorId,
                'blocked_id' => $targetId
            ]);

            $blockId = $blockStmt->fetchColumn();

            if (!$blockId) {
                throw new InteractionException(
                    'Aucun blocage actif trouvé pour ce profil.',
                    404
                );
            }

            // Désactiver le blocage.
            $updateBlock = $pdo->prepare("
                UPDATE blocks
                SET status = 'INACTIVE'
                WHERE id = :block_id
                  AND status = 'ACTIVE'
            ");

            $updateBlock->execute([
                'block_id' => (int) $blockId
            ]);

            // Verrouiller le Match éventuel.
            $matchStmt = $pdo->prepare("
                SELECT id, status
                FROM matches
                WHERE profile_a_id = :profile_a
                  AND profile_b_id = :profile_b
                LIMIT 1
                FOR UPDATE
            ");

            $matchStmt->execute([
                'profile_a' => $firstId,
                'profile_b' => $secondId
            ]);

            $match = $matchStmt->fetch(PDO::FETCH_ASSOC);

            // Ne rétablir ENDED que si aucun blocage
            // ne reste actif dans les deux sens.
            if ($match && $match['status'] === 'BLOCKED') {
                $remainingBlock = $pdo->prepare("
                    SELECT id
                    FROM blocks
                    WHERE status = 'ACTIVE'
                      AND (
                          (
                              blocker_id = :first_blocker
                              AND blocked_id = :first_blocked
                          )
                          OR
                          (
                              blocker_id = :second_blocker
                              AND blocked_id = :second_blocked
                          )
                      )
                    LIMIT 1
                ");

                $remainingBlock->execute([
                    'first_blocker' => $firstId,
                    'first_blocked' => $secondId,
                    'second_blocker' => $secondId,
                    'second_blocked' => $firstId
                ]);

                if (!$remainingBlock->fetchColumn()) {
                    $updateMatch = $pdo->prepare("
                        UPDATE matches
                        SET status = 'ENDED'
                        WHERE id = :match_id
                          AND status = 'BLOCKED'
                    ");

                    $updateMatch->execute([
                        'match_id' => (int) $match['id']
                    ]);
                }
            }

            $pdo->commit();

        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $e;
        }
    }

    /**
     * Récupérer les profils bloqués par un membre.
     */
    public static function getBlockedUsers(
        PDO $pdo,
        int $profileId
    ): array {
        $stmt = $pdo->prepare("
            SELECT
                b.id AS block_id,
                b.blocked_id AS profile_id,
                b.created_at AS blocked_at,
                p.pseudonym,
                p.gender,
                p.country,
                p.city
            FROM blocks b
            INNER JOIN profiles p
                ON p.id = b.blocked_id
            WHERE b.blocker_id = :profile_id
              AND b.status = 'ACTIVE'
            ORDER BY b.created_at DESC
        ");

        $stmt->execute([
            'profile_id' => $profileId
        ]);

        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$user) {
            $user['block_id'] = (int) $user['block_id'];
            $user['profile_id'] = (int) $user['profile_id'];
        }

        unset($user);

        return $users;
    }

    /**
     * Vérifier que chaque profil correspond aux préférences de l'autre.
     */
    private static function validateMutualPreferences(
        PDO $pdo,
        int $actorId,
        int $targetId
    ): void {
        $stmt = $pdo->prepare("
            SELECT
                CASE
                    WHEN (
                        (
                            actor_pref.preferred_gender IS NULL
                            OR actor_pref.preferred_gender = target.gender
                        )
                        AND TIMESTAMPDIFF(
                            YEAR,
                            target_user.date_of_birth,
                            CURDATE()
                        ) BETWEEN
                            COALESCE(actor_pref.min_age, 18)
                            AND COALESCE(actor_pref.max_age, 99)
                        AND (
                            actor_pref.preferred_country IS NULL
                            OR actor_pref.preferred_country = target.country
                        )
                        AND (
                            actor_pref.preferred_city IS NULL
                            OR actor_pref.preferred_city = target.city
                        )
                    )
                    THEN 1
                    ELSE 0
                END AS target_matches_actor,
 
                CASE
                    WHEN (
                        (
                            target_pref.preferred_gender IS NULL
                            OR target_pref.preferred_gender = actor.gender
                        )
                        AND TIMESTAMPDIFF(
                            YEAR,
                            actor_user.date_of_birth,
                            CURDATE()
                        ) BETWEEN
                            COALESCE(target_pref.min_age, 18)
                            AND COALESCE(target_pref.max_age, 99)
                        AND (
                            target_pref.preferred_country IS NULL
                            OR target_pref.preferred_country = actor.country
                        )
                        AND (
                            target_pref.preferred_city IS NULL
                            OR target_pref.preferred_city = actor.city
                        )
                    )
                    THEN 1
                    ELSE 0
                END AS actor_matches_target
 
            FROM profiles actor
            INNER JOIN users actor_user
                ON actor_user.id = actor.user_id
            INNER JOIN profiles target
                ON target.id = :target_id
            INNER JOIN users target_user
                ON target_user.id = target.user_id
            LEFT JOIN discovery_preferences actor_pref
                ON actor_pref.profile_id = actor.id
            LEFT JOIN discovery_preferences target_pref
                ON target_pref.profile_id = target.id
            WHERE actor.id = :actor_id
            LIMIT 1
        ");
 
        $stmt->execute([
            'target_id' => $targetId,
            'actor_id' => $actorId
        ]);
 
        $preferences = $stmt->fetch(PDO::FETCH_ASSOC);
 
        if (!$preferences) {
            throw new InteractionException(
                'Impossible de vérifier les préférences des profils.',
                404
            );
        }
 
        if (
            (int) $preferences['target_matches_actor'] !== 1
            || (int) $preferences['actor_matches_target'] !== 1
        ) {
            throw new InteractionException(
                'Ce profil ne correspond pas aux préférences de découverte mutuelles.',
                403
            );
        }
    }
 
    /**
     * Terminer un Match actif.
     */
    public static function endMatch(
        PDO $pdo,
        int $profileId,
        int $matchId
    ): void {
        if ($matchId <= 0) {
            throw new InteractionException(
                'Identifiant de Match invalide.',
                422
            );
        }
 
        $pdo->beginTransaction();
 
        try {
            // Première lecture sans verrouiller le Match.
            // Cela permet de connaître les profils à verrouiller.
            $initialStmt = $pdo->prepare("
                SELECT id, profile_a_id, profile_b_id
                FROM matches
                WHERE id = :match_id
                LIMIT 1
            ");
 
            $initialStmt->execute([
                'match_id' => $matchId
            ]);
 
            $initialMatch = $initialStmt->fetch(PDO::FETCH_ASSOC);
 
            if (!$initialMatch) {
                throw new InteractionException(
                    'Match introuvable.',
                    404
                );
            }
 
            $firstId = (int) $initialMatch['profile_a_id'];
            $secondId = (int) $initialMatch['profile_b_id'];
 
            if ($profileId !== $firstId && $profileId !== $secondId) {
                throw new InteractionException(
                    'Vous ne pouvez pas terminer ce Match.',
                    403
                );
            }
 
            // Même ordre de verrouillage que dans applyAction().
            $lockStmt = $pdo->prepare("
                SELECT id
                FROM profiles
                WHERE id IN (:first_id, :second_id)
                ORDER BY id
                FOR UPDATE
            ");
 
            $lockStmt->execute([
                'first_id' => min($firstId, $secondId),
                'second_id' => max($firstId, $secondId)
            ]);
 
            if (count($lockStmt->fetchAll(PDO::FETCH_COLUMN)) !== 2) {
                throw new InteractionException(
                    'Un des profils de ce Match est introuvable.',
                    404
                );
            }
 
            // Reprendre le verrou sur le Match après les profils.
            $matchStmt = $pdo->prepare("
                SELECT id, profile_a_id, profile_b_id, status
                FROM matches
                WHERE id = :match_id
                LIMIT 1
                FOR UPDATE
            ");
 
            $matchStmt->execute([
                'match_id' => $matchId
            ]);
 
            $match = $matchStmt->fetch(PDO::FETCH_ASSOC);
 
            if (!$match) {
                throw new InteractionException(
                    'Match introuvable.',
                    404
                );
            }
 
            if (
                (int) $match['profile_a_id'] !== $firstId
                || (int) $match['profile_b_id'] !== $secondId
            ) {
                throw new InteractionException(
                    'Les informations de ce Match ont changé.',
                    409
                );
            }
 
            if ($match['status'] !== 'ACTIVE') {
                throw new InteractionException(
                    'Ce Match n’est plus actif.',
                    409
                );
            }
 
            $updateStmt = $pdo->prepare("
                UPDATE matches
                SET status = 'ENDED',
                    ended_at = CURRENT_TIMESTAMP
                WHERE id = :match_id
                  AND status = 'ACTIVE'
            ");
 
            $updateStmt->execute([
                'match_id' => $matchId
            ]);
 
            if ($updateStmt->rowCount() !== 1) {
                throw new InteractionException(
                    'Impossible de terminer ce Match.',
                    409
                );
            }
 
            // Les deux personnes devront envoyer de nouveaux Likes.
            $deleteActions = $pdo->prepare("
                DELETE FROM profile_actions
                WHERE (
                    actor_id = :first_actor
                    AND target_id = :first_target
                )
                OR (
                    actor_id = :second_actor
                    AND target_id = :second_target
                )
            ");
 
            $deleteActions->execute([
                'first_actor' => $firstId,
                'first_target' => $secondId,
                'second_actor' => $secondId,
                'second_target' => $firstId
            ]);
 
            // Réinitialiser également les anciennes consultations.
            $deleteViews = $pdo->prepare("
                DELETE FROM discovery_views
                WHERE (
                    viewer_id = :first_viewer
                    AND viewed_id = :first_viewed
                )
                OR (
                    viewer_id = :second_viewer
                    AND viewed_id = :second_viewed
                )
            ");
 
            $deleteViews->execute([
                'first_viewer' => $firstId,
                'first_viewed' => $secondId,
                'second_viewer' => $secondId,
                'second_viewed' => $firstId
            ]);
 
            $pdo->commit();
 
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
 
            throw $e;
        }
    }
 
    /**
     * Récupérer les Likes reçus.
     */
    public static function getReceivedLikes(
        PDO $pdo,
        int $profileId
    ): array {
        $stmt = $pdo->prepare("
            SELECT
                pa.id AS action_id,
                pa.created_at,
                pa.updated_at,
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
                ) AS age,
                EXISTS (
                    SELECT 1
                    FROM matches m
                    WHERE m.status = 'ACTIVE'
                      AND m.profile_a_id = LEAST(p.id, ?)
                      AND m.profile_b_id = GREATEST(p.id, ?)
                ) AS is_matched
            FROM profile_actions pa
            INNER JOIN profiles p ON p.id = pa.actor_id
            INNER JOIN users u ON u.id = p.user_id
            WHERE pa.target_id = ?
              AND pa.action_type = 'LIKE'
              AND u.account_status = 'ACTIVE'
              AND u.email_verified_at IS NOT NULL
              AND u.deletion_status = 'NONE'
              AND u.date_of_birth IS NOT NULL
              AND TIMESTAMPDIFF(
                  YEAR,
                  u.date_of_birth,
                  CURDATE()
              ) >= 18
              AND NOT EXISTS (
                  SELECT 1
                  FROM blocks b
                  WHERE b.status = 'ACTIVE'
                    AND (
                        (b.blocker_id = p.id AND b.blocked_id = ?)
                        OR
                        (b.blocker_id = ? AND b.blocked_id = p.id)
                    )
              )
            ORDER BY pa.updated_at DESC
            LIMIT 50
        ");
 
        $stmt->execute([
            $profileId,
            $profileId,
            $profileId,
            $profileId,
            $profileId
        ]);
 
        $likes = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
        foreach ($likes as &$like) {
            $like['action_id'] = (int) $like['action_id'];
            $like['profile_id'] = (int) $like['profile_id'];
            $like['age'] = (int) $like['age'];
            $like['is_matched'] = (bool) $like['is_matched'];
        }
 
        unset($like);
 
        return $likes;
    }
 
    /**
     * Récupérer les Matches actifs.
     */
    public static function getMatches(
        PDO $pdo,
        int $profileId
    ): array {
        $stmt = $pdo->prepare("
            SELECT
                m.id AS match_id,
                m.matched_at,
                CASE
                    WHEN m.profile_a_id = :profile_a
                    THEN p_b.id
                    ELSE p_a.id
                END AS profile_id,
                CASE
                    WHEN m.profile_a_id = :profile_b
                    THEN p_b.pseudonym
                    ELSE p_a.pseudonym
                END AS pseudonym,
                CASE
                    WHEN m.profile_a_id = :profile_c
                    THEN p_b.gender
                    ELSE p_a.gender
                END AS gender,
                CASE
                    WHEN m.profile_a_id = :profile_d
                    THEN p_b.city
                    ELSE p_a.city
                END AS city,
                CASE
                    WHEN m.profile_a_id = :profile_e
                    THEN p_b.country
                    ELSE p_a.country
                END AS country
            FROM matches m
            INNER JOIN profiles p_a ON p_a.id = m.profile_a_id
            INNER JOIN profiles p_b ON p_b.id = m.profile_b_id
            WHERE m.status = 'ACTIVE'
              AND (
                  m.profile_a_id = :profile_f
                  OR m.profile_b_id = :profile_g
              )
            ORDER BY m.matched_at DESC
        ");
 
        $stmt->execute([
            'profile_a' => $profileId,
            'profile_b' => $profileId,
            'profile_c' => $profileId,
            'profile_d' => $profileId,
            'profile_e' => $profileId,
            'profile_f' => $profileId,
            'profile_g' => $profileId
        ]);
 
        $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
        foreach ($matches as &$match) {
            $match['match_id'] = (int) $match['match_id'];
            $match['profile_id'] = (int) $match['profile_id'];
        }
 
        unset($match);
 
        return $matches;
    }
 
    /**
     * Notifier les deux membres d'un nouveau Match.
     */
    private static function createMatchNotifications(
        PDO $pdo,
        int $firstId,
        int $secondId,
        int $matchId
    ): void {
        $stmt = $pdo->prepare("
            SELECT id, user_id, pseudonym
            FROM profiles
            WHERE id IN (:first_id, :second_id)
        ");
 
        $stmt->execute([
            'first_id' => $firstId,
            'second_id' => $secondId
        ]);
 
        $profiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
        if (count($profiles) !== 2) {
            throw new RuntimeException(
                'Impossible de créer les notifications du Match.'
            );
        }
 
        // Indexer les profils par ID : SQL ne garantit aucun ordre ici.
        $profilesById = [];
 
        foreach ($profiles as $profile) {
            $profilesById[(int) $profile['id']] = $profile;
        }
 
        $insert = $pdo->prepare("
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                related_type,
                related_id
            )
            VALUES (
                :user_id,
                'NEW_MATCH',
                'Nouveau Match !',
                :content,
                'MATCH',
                :match_id
            )
        ");
 
        foreach ($profilesById as $currentId => $profile) {
            $otherId = $currentId === $firstId
                ? $secondId
                : $firstId;
 
            if (!isset($profilesById[$otherId])) {
                throw new RuntimeException(
                    'Impossible d’identifier le second membre du Match.'
                );
            }
 
            $other = $profilesById[$otherId];
 
            $insert->execute([
                'user_id' => (int) $profile['user_id'],
                'content' => 'Vous avez un nouveau Match avec '
                    . $other['pseudonym'] . '.',
                'match_id' => $matchId
            ]);
        }
    }
 
    /**
     * Notifier un membre d'un nouveau Like reçu.
     */
    private static function createLikeNotification(
        PDO $pdo,
        int $actorId,
        int $targetId
    ): void {
        $stmt = $pdo->prepare("
            SELECT
                actor.user_id AS actor_user_id,
                actor.pseudonym AS actor_pseudonym,
                target.user_id AS target_user_id
            FROM profiles actor
            INNER JOIN profiles target
                ON target.id = :target_id
            WHERE actor.id = :actor_id
            LIMIT 1
        ");
 
        $stmt->execute([
            'target_id' => $targetId,
            'actor_id' => $actorId
        ]);
 
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
 
        if (!$data) {
            return;
        }
 
        $insert = $pdo->prepare("
            INSERT INTO notifications (
                user_id,
                type,
                title,
                content,
                related_type,
                related_id
            )
            VALUES (
                :user_id,
                'NEW_LIKE',
                'Nouveau Like',
                :content,
                'PROFILE',
                :profile_id
            )
        ");
 
        $insert->execute([
            'user_id' => (int) $data['target_user_id'],
            'content' => $data['actor_pseudonym']
                . ' vient de vous envoyer un Like.',
            'profile_id' => $actorId
        ]);
    }
}
 