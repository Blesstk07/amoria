const API_BASE_URL = '/api'

/**
 * Récupère le jeton CSRF.
 */
async function getCsrfToken() {
  let csrfToken = sessionStorage.getItem('csrfToken')

  if (csrfToken) {
    return csrfToken
  }

  const response = await fetch(`${API_BASE_URL}/csrf-token`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.message || 'Impossible de récupérer le jeton de sécurité.'
    )
  }

  csrfToken = result.data?.csrfToken || result.csrfToken

  if (!csrfToken) {
    throw new Error('Jeton de sécurité introuvable.')
  }

  sessionStorage.setItem('csrfToken', csrfToken)

  return csrfToken
}

/**
 * Fonction centrale pour communiquer avec l'API.
 */
async function apiRequest(endpoint, options = {}) {
  const method = options.method || 'GET'

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    headers['X-CSRF-Token'] = await getCsrfToken()
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  })

  const result = await response.json()

  if (!response.ok || !result.success) {
    if (response.status === 401) {
      sessionStorage.removeItem('csrfToken')
    }

    throw new Error(
      result.message || 'Une erreur est survenue lors de la communication avec le serveur.'
    )
  }

  return result.data
}

/**
 * Récupérer le profil du membre connecté.
 */
export async function getProfile() {
  return apiRequest('/profile')
}

/**
 * Modifier les informations personnelles et les centres d'intérêt.
 */
export async function updateProfile(profileData) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

/**
 * Modifier les préférences de découverte.
 */
export async function updatePreferences(preferences) {
  return apiRequest('/profile/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  })
}