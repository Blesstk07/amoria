
<?php

require_once __DIR__ . '/config/database.php';

try {
    $pdo = Database::getConnection();

    echo "Connexion à Amoria réussie !";

} catch (Throwable $e) {
    echo "Échec de connexion : " . $e->getMessage();
}