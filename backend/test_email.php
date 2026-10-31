<?php

declare(strict_types=1);

// Charger Composer
require_once __DIR__ . '/vendor/autoload.php';

// Charger les variables d'environnement
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

// Charger le service d'e-mail
require_once __DIR__ . '/src/Services/EmailService.php';

try {
    EmailService::sendVerificationEmail(
        'tshimangabless2000@gmail.com',
        'Bless',
        bin2hex(random_bytes(32))
    );

    echo "E-mail de test envoyé avec succès !";

} catch (Throwable $e) {
    error_log('Erreur SMTP : ' . $e->getMessage());

    echo "Échec de l'envoi de l'e-mail. Consulte les journaux PHP.";
}