<?php

declare(strict_types=1);

require_once __DIR__ . '/../Security/Csrf.php'; // adapte le chemin si besoin

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function patch(string $path, callable $handler): void
    {
        $this->add('PATCH', $path, $handler);
    }

    public function delete(string $path, callable $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    /**
     * Enregistrer une route.
     */
    private function add(string $method, string $path, callable $handler): void
    {
        $this->routes[$method][$this->normalize($path)] = $handler;
    }

    /**
     * Normaliser un chemin : "/api/x/" devient "/api/x", "" devient "/".
     */
    private function normalize(string $path): string
    {
        $path = rtrim($path, '/');

        return $path === '' ? '/' : $path;
    }

    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);
        $path = $this->normalize(parse_url($uri, PHP_URL_PATH) ?: '/');

        if (isset($this->routes[$method][$path])) {

            // Protection CSRF des méthodes qui modifient les données
            $protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

            if (in_array($method, $protectedMethods, true)) {

                if (!Csrf::validateRequest()) {
                    http_response_code(403);

                    echo json_encode([
                        'success' => false,
                        'message' => 'Jeton CSRF absent ou invalide.',
                        'data' => []
                    ], JSON_UNESCAPED_UNICODE);

                    return;
                }
            }

            call_user_func($this->routes[$method][$path]);
            return;
        }

        // Vérifier si l'adresse existe avec une autre méthode HTTP
        $allowedMethods = [];

        foreach ($this->routes as $registeredMethod => $routes) {
            if (isset($routes[$path])) {
                $allowedMethods[] = $registeredMethod;
            }
        }

        if ($allowedMethods !== []) {
            header('Allow: ' . implode(', ', $allowedMethods));
            http_response_code(405);

            echo json_encode([
                'success' => false,
                'message' => 'Méthode HTTP non autorisée.',
                'data' => []
            ], JSON_UNESCAPED_UNICODE);

            return;
        }

        // Route inexistante
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Route introuvable.',
            'data' => []
        ], JSON_UNESCAPED_UNICODE);
    }
}