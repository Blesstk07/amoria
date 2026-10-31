<?php

declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../Services/EmailService.php';

class AuthController
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
     * Lire un champ texte du JSON reçu.
     * Renvoie '' si le champ est absent ou n'est pas une chaîne.
     */
    private static function readString(array $input, string $key, bool $trim = true): string
    {
        $value = $input[$key] ?? '';

        if (!is_string($value)) {
            return '';
        }

        return $trim ? trim($value) : $value;
    }

    /**
     * Calculer l'âge à partir d'une date de naissance.
     */
    private static function calculateAge(string $dateOfBirth): int
    {
        $birthDate = new DateTimeImmutable($dateOfBirth);
        $today = new DateTimeImmutable('today');

        return $birthDate->diff($today)->y;
    }

    /**
     * Inscrire un nouvel utilisateur.
     */
    public static function register(): void
    {
        $connection = null;

        try {
            // 1. Récupérer les données JSON envoyées par React.
            $input = json_decode(
                (string) file_get_contents('php://input'),
                true
            );

            if (!is_array($input)) {
                self::respond(400, false, 'Les données envoyées sont invalides.');
            }

            // 2. Récupérer et nettoyer les champs.
            $email = strtolower(self::readString($input, 'email'));
            $password = self::readString($input, 'password', false); // jamais de trim sur un mot de passe
            $pseudonym = self::readString($input, 'pseudonym');
            $dateOfBirth = self::readString($input, 'dateOfBirth');
            $gender = strtoupper(self::readString($input, 'gender'));
            $country = self::readString($input, 'country');
            $city = self::readString($input, 'city');
            $biography = self::readString($input, 'bio');

            $rawInterests = $input['interests'] ?? [];

            // 3. Vérifier les champs obligatoires.
            if (
                $email === '' ||
                $password === '' ||
                $pseudonym === '' ||
                $dateOfBirth === '' ||
                $gender === '' ||
                $country === '' ||
                $city === ''
            ) {
                self::respond(422, false, 'Veuillez remplir tous les champs obligatoires.');
            }

            // 4. Vérifier le format de l'adresse e-mail.
            if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
                self::respond(422, false, 'Adresse e-mail invalide.');
            }

            // 5. Vérifier le mot de passe (bcrypt ignore tout après 72 octets).
            if (strlen($password) < 8) {
                self::respond(422, false, 'Le mot de passe doit contenir au moins 8 caractères.');
            }

            if (strlen($password) > 72) {
                self::respond(422, false, 'Le mot de passe ne doit pas dépasser 72 caractères.');
            }

            // 6. Vérifier le pseudonyme.
            if (mb_strlen($pseudonym) < 2 || mb_strlen($pseudonym) > 50) {
                self::respond(422, false, 'Le pseudonyme doit contenir entre 2 et 50 caractères.');
            }

            // 7. Vérifier la date de naissance.
            $birthDateObject = DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                $dateOfBirth
            );

            $dateErrors = DateTimeImmutable::getLastErrors();

            if (
                !$birthDateObject ||
                ($dateErrors !== false &&
                    ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0)) ||
                $birthDateObject->format('Y-m-d') !== $dateOfBirth
            ) {
                self::respond(422, false, 'Date de naissance invalide.');
            }

            // Une date dans le futur donnerait un âge "valide" avec diff()->y.
            if ($birthDateObject > new DateTimeImmutable('today')) {
                self::respond(422, false, 'La date de naissance ne peut pas être dans le futur.');
            }

            $age = self::calculateAge($dateOfBirth);

            if ($age < 18) {
                self::respond(422, false, 'Amoria est réservé aux personnes âgées de 18 ans ou plus.');
            }

            if ($age > 120) {
                self::respond(422, false, 'Veuillez vérifier votre date de naissance.');
            }

            // 8. Vérifier le genre.
            if (!in_array($gender, ['MAN', 'WOMAN'], true)) {
                self::respond(422, false, 'Veuillez sélectionner un genre valide.');
            }

            // 9. Convertir le pays en code ISO.
            $normalizedCountry = mb_strtolower($country);

            $countryCodes = [
                'république démocratique du congo' => 'CD',
                'republique democratique du congo' => 'CD',
                'rdc' => 'CD'
            ];

            if (!isset($countryCodes[$normalizedCountry])) {
                self::respond(422, false, 'Pays non pris en charge pour le moment.');
            }

            $countryCode = $countryCodes[$normalizedCountry];

            // 10. Vérifier la ville et la biographie.
            if (mb_strlen($city) > 100 || mb_strlen($biography) > 500) {
                self::respond(422, false, 'La ville ou la biographie dépasse la longueur autorisée.');
            }

            // 11. Vérifier les centres d'intérêt.
            if (!is_array($rawInterests) || count($rawInterests) === 0) {
                self::respond(422, false, 'Sélectionnez au moins un centre d’intérêt.');
            }

            if (count($rawInterests) > 20) {
                self::respond(422, false, 'Vous ne pouvez pas choisir plus de 20 centres d’intérêt.');
            }

            $interests = [];

            foreach ($rawInterests as $interest) {
                if (!is_string($interest) || trim($interest) === '') {
                    self::respond(422, false, 'La liste des centres d’intérêt est invalide.');
                }

                $interests[] = trim($interest);
            }

            $interests = array_values(array_unique($interests));

            // 12. Vérifier les consentements.
            if (
                ($input['confirmedAdult'] ?? false) !== true ||
                ($input['acceptedTerms'] ?? false) !== true
            ) {
                self::respond(422, false, 'Vous devez confirmer votre majorité et accepter les conditions.');
            }

            // 13. Connexion à la base de données.
            $connection = Database::getConnection();

            // 14. Vérifier que l'e-mail n'est pas déjà utilisé.
            $emailQuery = $connection->prepare(
                'SELECT id FROM users WHERE email = :email LIMIT 1'
            );

            $emailQuery->execute(['email' => $email]);

            if ($emailQuery->fetch()) {
                self::respond(409, false, 'Cette adresse e-mail est déjà utilisée.');
            }

            // 15. Vérifier que le pseudonyme est disponible.
            $pseudonymQuery = $connection->prepare(
                'SELECT id FROM profiles WHERE pseudonym = :pseudonym LIMIT 1'
            );

            $pseudonymQuery->execute(['pseudonym' => $pseudonym]);

            if ($pseudonymQuery->fetch()) {
                self::respond(409, false, 'Ce pseudonyme est déjà utilisé.');
            }

            // 16. Récupérer les intérêts approuvés.
            $placeholders = implode(',', array_fill(0, count($interests), '?'));

            $interestQuery = $connection->prepare(
                "SELECT id, name
                 FROM interests
                 WHERE status = 'APPROVED'
                 AND name IN ($placeholders)"
            );

            $interestQuery->execute($interests);

            $approvedInterests = $interestQuery->fetchAll();

            if (count($approvedInterests) !== count($interests)) {
                self::respond(422, false, 'Un ou plusieurs centres d’intérêt sont invalides.');
            }

            // 17. Récupérer le rôle MEMBER.
            $roleQuery = $connection->prepare(
                "SELECT id FROM roles WHERE name = 'MEMBER' LIMIT 1"
            );

            $roleQuery->execute();

            $memberRole = $roleQuery->fetch();

            if (!$memberRole) {
                self::respond(500, false, 'Le rôle utilisateur est introuvable.');
            }

            // 18. Hacher le mot de passe (avant la transaction pour la garder courte).
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            // 19. Commencer la transaction.
            $connection->beginTransaction();

            // 20. Créer le compte utilisateur.
            $userQuery = $connection->prepare(
                "INSERT INTO users (
                    role_id,
                    email,
                    password_hash,
                    date_of_birth
                ) VALUES (
                    :role_id,
                    :email,
                    :password_hash,
                    :date_of_birth
                )"
            );

            $userQuery->execute([
                'role_id' => $memberRole['id'],
                'email' => $email,
                'password_hash' => $passwordHash,
                'date_of_birth' => $dateOfBirth
            ]);

            $userId = (int) $connection->lastInsertId();

            // 21. Créer le profil.
            $profileQuery = $connection->prepare(
                "INSERT INTO profiles (
                    user_id,
                    pseudonym,
                    gender,
                    country,
                    city,
                    biography
                ) VALUES (
                    :user_id,
                    :pseudonym,
                    :gender,
                    :country,
                    :city,
                    :biography
                )"
            );

            $profileQuery->execute([
                'user_id' => $userId,
                'pseudonym' => $pseudonym,
                'gender' => $gender,
                'country' => $countryCode,
                'city' => $city,
                'biography' => $biography !== '' ? $biography : null
            ]);

            $profileId = (int) $connection->lastInsertId();

            // 22. Associer les centres d'intérêt au profil.
            $profileInterestQuery = $connection->prepare(
                'INSERT INTO profile_interests (profile_id, interest_id)
                 VALUES (:profile_id, :interest_id)'
            );

            foreach ($approvedInterests as $interest) {
                $profileInterestQuery->execute([
                    'profile_id' => $profileId,
                    'interest_id' => $interest['id']
                ]);
            }

            // 23. Générer un jeton de vérification.
            // Le jeton en clair part par e-mail, seul son hash est stocké en base.
            $verificationToken = bin2hex(random_bytes(32));
            $tokenHash = hash('sha256', $verificationToken);

            $tokenQuery = $connection->prepare(
                "INSERT INTO email_verification_tokens (
                    user_id,
                    token_hash,
                    purpose,
                    target_email,
                    expires_at
                ) VALUES (
                    :user_id,
                    :token_hash,
                    'SIGNUP',
                    :target_email,
                    DATE_ADD(NOW(), INTERVAL 24 HOUR)
                )"
            );

            $tokenQuery->execute([
                'user_id' => $userId,
                'token_hash' => $tokenHash,
                'target_email' => $email
            ]);

            // 24. Valider toutes les opérations.
            $connection->commit();

            // 25. Envoyer l'e-mail de vérification.
            $emailSent = false;

            try {
                // Logs de debug avant l'envoi.
                error_log("INSCRIPTION EMAIL DESTINATAIRE : " . $email);
                error_log("INSCRIPTION EMAIL PSEUDONYME : " . $pseudonym);

                EmailService::sendVerificationEmail(
                    $email,
                    $pseudonym,
                    $verificationToken
                );

                // Atteint uniquement si l'envoi n'a pas levé d'exception.
                error_log("INSCRIPTION EMAIL : envoi SMTP terminé.");

                $emailSent = true;
            } catch (Throwable $mailError) {
                // Le compte existe déjà : ne surtout pas annuler l'inscription.
                error_log(
                    'Erreur d’envoi de l’e-mail de vérification Amoria : '
                    . $mailError->getMessage()
                );
            }

            // 26. Répondre au frontend.
            if ($emailSent) {
                self::respond(
                    201,
                    true,
                    'Votre compte a été créé ! Un e-mail de vérification vient de vous être envoyé.',
                    [
                        'userId' => $userId,
                        'pseudonym' => $pseudonym,
                        'emailVerified' => false,
                        'emailSent' => true
                    ]
                );
            }

            self::respond(
                201,
                true,
                'Votre compte a été créé, mais l’envoi de l’e-mail a échoué. Vous pourrez demander un nouvel envoi.',
                [
                    'userId' => $userId,
                    'pseudonym' => $pseudonym,
                    'emailVerified' => false,
                    'emailSent' => false
                ]
            );
        } catch (PDOException $e) {
            if ($connection instanceof PDO && $connection->inTransaction()) {
                $connection->rollBack();
            }

            error_log('Erreur SQL lors de l’inscription Amoria : ' . $e->getMessage());

            // 23000 = violation d'intégrité ; 1062 = doublon (clé unique).
            $isDuplicate = $e->getCode() === '23000'
                && (int) ($e->errorInfo[1] ?? 0) === 1062;

            if ($isDuplicate) {
                self::respond(
                    409,
                    false,
                    'Cette adresse e-mail ou ce pseudonyme est déjà utilisé.'
                );
            }

            self::respond(500, false, 'Une erreur est survenue lors de la création du compte.');
        } catch (Throwable $e) {
            if ($connection instanceof PDO && $connection->inTransaction()) {
                $connection->rollBack();
            }

            error_log('Erreur lors de l’inscription Amoria : ' . $e->getMessage());

            self::respond(500, false, 'Une erreur interne est survenue.');
        }
    }
    
public static function verifyEmail(): void
{
    // 1. Récupérer les données envoyées par React.
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        self::respond(
            400,
            false,
            'Requête invalide.'
        );
    }

    $token = trim($data['token'] ?? '');

    // 2. Vérifier le format du token.
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        self::respond(
            400,
            false,
            'Le lien de vérification est invalide.'
        );
    }

    // 3. Hacher le token pour retrouver sa version en base.
    $tokenHash = hash('sha256', $token);

    $connection = Database::getConnection();

    try {
        $connection->beginTransaction();

        // 4. Rechercher un token encore valide.
        $query = $connection->prepare("
            SELECT id, user_id, target_email
            FROM email_verification_tokens
            WHERE token_hash = :token_hash
              AND purpose = 'SIGNUP'
              AND used_at IS NULL
              AND invalidated_at IS NULL
              AND expires_at > NOW()
            LIMIT 1
            FOR UPDATE
        ");

        $query->execute([
            'token_hash' => $tokenHash
        ]);

        $tokenRecord = $query->fetch();

        if (!$tokenRecord) {
            $connection->rollBack();

            self::respond(
                400,
                false,
                'Ce lien est invalide, expiré ou déjà utilisé.'
            );
        }

        // 5. Vérifier que l'adresse correspond toujours au compte.
        $updateUser = $connection->prepare("
            UPDATE users
            SET email_verified_at = NOW()
            WHERE id = :user_id
              AND email = :target_email
              AND email_verified_at IS NULL
        ");

        $updateUser->execute([
            'user_id' => $tokenRecord['user_id'],
            'target_email' => $tokenRecord['target_email']
        ]);

        if ($updateUser->rowCount() !== 1) {
            $connection->rollBack();

            self::respond(
                400,
                false,
                'Impossible de vérifier cette adresse e-mail.'
            );
        }

        // 6. Marquer le token comme utilisé.
        $updateToken = $connection->prepare("
            UPDATE email_verification_tokens
            SET used_at = NOW()
            WHERE id = :token_id
        ");

        $updateToken->execute([
            'token_id' => $tokenRecord['id']
        ]);

        // 7. Valider les modifications.
        $connection->commit();

        self::respond(
            200,
            true,
            'Ton adresse e-mail a été vérifiée avec succès !',
            [
                'emailVerified' => true
            ]
        );

    } catch (Throwable $e) {

        if ($connection->inTransaction()) {
            $connection->rollBack();
        }

        error_log(
            'Erreur de vérification Amoria : ' . $e->getMessage()
        );

        self::respond(
            500,
            false,
            'Une erreur est survenue lors de la vérification.'
        );
    }
}

}