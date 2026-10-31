<?php

declare(strict_types=1);

class Router
{
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->routes['GET'][$path] = $handler;
    }

    public function post(string $path, callable $handler): void
    {
        $this->routes['POST'][$path] = $handler;
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';

        if (isset($this->routes[$method][$path])) {
            call_user_func($this->routes[$method][$path]);
            return;
        }

        // Vérifier si l'adresse existe avec une autre méthode HTTP
        foreach ($this->routes as $registeredMethod => $routes) {
            if (isset($routes[$path])) {
                http_response_code(405);

                echo json_encode([
                    'success' => false,
                    'message' => 'Méthode HTTP non autorisée.'
                ], JSON_UNESCAPED_UNICODE);

                return;
            }
        }

        // Route inexistante
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Route introuvable.'
        ], JSON_UNESCAPED_UNICODE);
    }
}