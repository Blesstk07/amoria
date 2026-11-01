<?php
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    /**
     * Lit une variable d'environnement obligatoire.
     */
    private static function env(string $key): string
    {
        $value = $_ENV[$key] ?? '';

        if (!is_string($value) || trim($value) === '') {
            throw new RuntimeException(
                "Variable d'environnement manquante : {$key}"
            );
        }

        return $value;
    }

    /**
     * Envoie un e-mail de vérification à un nouvel utilisateur.
     *
     * @throws \PHPMailer\PHPMailer\Exception si l'envoi échoue
     * @throws RuntimeException si la configuration .env est incomplète
     */
    public static function sendVerificationEmail(
        string $email,
        string $pseudonym,
        string $token
    ): void {
        $mail = new PHPMailer(true);

        // ---------- Configuration SMTP ----------
        $port = (int) self::env('MAIL_PORT');

        $mail->isSMTP();
        $mail->Host = self::env('MAIL_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = self::env('MAIL_USERNAME');
        $mail->Password = self::env('MAIL_PASSWORD');

        // Port 465 = SMTPS (SSL direct), sinon STARTTLS (ex. port 587)
        $mail->SMTPSecure = $port === 465
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = $port;

        // Timeout de 15 s pour ne pas bloquer l'inscription si le serveur SMTP ne répond pas
        $mail->Timeout = 15;

        // ---------- Debug SMTP ----------
        // Niveau 2 = messages envoyés par le client ET réponses du serveur.
        // À repasser à 0 une fois le problème réglé.
        $mail->SMTPDebug = 2;

        // On redirige le debug vers le log PHP au lieu de l'afficher.
        // Important : un echo casserait la réponse JSON de l'API.
        $mail->Debugoutput = function ($str, $level): void {
            error_log("SMTP DEBUG [$level] $str");
        };

        // ---------- Expéditeur ----------
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(
            self::env('MAIL_FROM_ADDRESS'),
            self::env('MAIL_FROM_NAME')
        );

        // ---------- Destinataire ----------
        $mail->addAddress($email, $pseudonym);

        // ---------- Lien de vérification ----------
        $verificationUrl = rtrim(self::env('APP_URL'), '/')
            . '/verify-email?token=' . urlencode($token);

        // Valeurs échappées pour le HTML
        $safePseudonym = htmlspecialchars($pseudonym, ENT_QUOTES, 'UTF-8');
        $safeUrl = htmlspecialchars($verificationUrl, ENT_QUOTES, 'UTF-8');
        $year = date('Y');

        // ---------- Contenu de l'e-mail ----------
        $mail->isHTML(true);
        $mail->Subject = 'Vérifiez votre adresse e-mail - Amoria';

        $mail->Body = '
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification Amoria</title>
        </head>
        <body style="margin:0;padding:30px 15px;background-color:#FFF8F4;font-family:Arial,sans-serif;color:#292329;">

            <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:35px 25px;text-align:center;">

                <h1 style="color:#8D304F;font-size:32px;margin-bottom:10px;">
                    Amoria
                </h1>

                <p style="color:#8D304F;font-size:14px;">
                    Des rencontres qui ont du sens.
                </p>

                <h2 style="margin-top:35px;">
                    Bienvenue, ' . $safePseudonym . ' !
                </h2>

                <p style="line-height:1.7;color:#555;">
                    Merci d’avoir créé ton compte Amoria.
                    Pour commencer ton aventure, confirme ton adresse e-mail
                    en cliquant sur le bouton ci-dessous.
                </p>

                <a href="' . $safeUrl . '"
                   style="display:inline-block;margin:25px 0;padding:15px 30px;background:#8D304F;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Vérifier mon adresse e-mail
                </a>

                <p style="font-size:13px;color:#777;line-height:1.6;">
                    Ce lien est valable pendant 24 heures.
                    Si tu n’as pas créé de compte Amoria,
                    tu peux ignorer cet e-mail.
                </p>

                <p style="font-size:12px;color:#999;line-height:1.6;word-break:break-all;">
                    Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>
                    ' . $safeUrl . '
                </p>

                <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">

                <p style="font-size:12px;color:#999;">
                    Amoria © ' . $year . '<br>
                    Des rencontres qui ont du sens.
                </p>

            </div>
        </body>
        </html>';

        // Version texte pour les clients e-mail sans HTML
        $mail->AltBody =
            "Bienvenue sur Amoria, {$pseudonym} !\n\n"
            . "Vérifie ton adresse e-mail avec ce lien :\n"
            . $verificationUrl
            . "\n\nCe lien est valable pendant 24 heures.";

        // ---------- Envoi ----------
        $mail->send();
    }

    
    /**
     * Envoie un e-mail de réinitialisation du mot de passe.
     */
    public static function sendPasswordResetEmail(
        string $email,
        string $pseudonym,
        string $token
    ): void {
        $mail = new PHPMailer(true);

        // Configuration SMTP
        $port = (int) self::env('MAIL_PORT');

        $mail->isSMTP();
        $mail->Host = self::env('MAIL_HOST');
        $mail->SMTPAuth = true;
        $mail->Username = self::env('MAIL_USERNAME');
        $mail->Password = self::env('MAIL_PASSWORD');

        $mail->SMTPSecure = $port === 465
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;

        $mail->Port = $port;
        $mail->Timeout = 15;

        // Debug SMTP : à désactiver en production
        $mail->SMTPDebug = 2;
        $mail->Debugoutput = function ($str, $level): void {
            error_log("SMTP DEBUG [$level] $str");
        };

        // Expéditeur
        $mail->CharSet = 'UTF-8';
        $mail->setFrom(
            self::env('MAIL_FROM_ADDRESS'),
            self::env('MAIL_FROM_NAME')
        );

        // Destinataire
        $mail->addAddress($email, $pseudonym);

        // Lien de réinitialisation
        $resetUrl = rtrim(self::env('APP_URL'), '/')
            . '/reset-password?token=' . urlencode($token);

        $safePseudonym = htmlspecialchars(
            $pseudonym,
            ENT_QUOTES,
            'UTF-8'
        );

        $safeUrl = htmlspecialchars(
            $resetUrl,
            ENT_QUOTES,
            'UTF-8'
        );

        $year = date('Y');

        // Contenu HTML
        $mail->isHTML(true);
        $mail->Subject = 'Réinitialisation de votre mot de passe - Amoria';

        $mail->Body = '
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Réinitialisation Amoria</title>
        </head>

        <body style="margin:0;padding:30px 15px;background-color:#FFF8F4;font-family:Arial,sans-serif;color:#292329;">

            <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;padding:35px 25px;text-align:center;">

                <h1 style="color:#8D304F;font-size:32px;">
                    Amoria
                </h1>

                <p style="color:#8D304F;font-size:14px;">
                    Des rencontres qui ont du sens.
                </p>

                <h2 style="margin-top:35px;">
                    Bonjour ' . $safePseudonym . ' !
                </h2>

                <p style="line-height:1.7;color:#555;">
                    Tu as demandé à réinitialiser ton mot de passe Amoria.
                    Clique sur le bouton ci-dessous pour en choisir un nouveau.
                </p>

                <a href="' . $safeUrl . '"
                   style="display:inline-block;margin:25px 0;padding:15px 30px;background:#8D304F;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">
                    Réinitialiser mon mot de passe
                </a>

                <p style="font-size:13px;color:#777;line-height:1.6;">
                    Ce lien est valable pendant 30 minutes et ne peut être utilisé qu’une seule fois.
                    Si tu n’as pas demandé cette réinitialisation,
                    ignore simplement cet e-mail.
                </p>

                <p style="font-size:12px;color:#999;line-height:1.6;word-break:break-all;">
                    Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br>
                    ' . $safeUrl . '
                </p>

                <hr style="border:none;border-top:1px solid #eee;margin:30px 0;">

                <p style="font-size:12px;color:#999;">
                    Amoria © ' . $year . '<br>
                    Des rencontres qui ont du sens.
                </p>

            </div>
        </body>
        </html>';

        // Version texte
        $mail->AltBody =
            "Bonjour {$pseudonym} !\n\n"
            . "Tu as demandé à réinitialiser ton mot de passe Amoria.\n"
            . "Utilise ce lien :\n"
            . $resetUrl
            . "\n\nCe lien expire dans 30 minutes et ne peut être utilisé qu'une seule fois.";

        $mail->send();
    }

}