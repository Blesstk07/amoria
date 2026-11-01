
const API_BASE_URL = '/api'

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

  const result = await parseResponse(response)

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

async function parseResponse(response) {
  const text = await response.text()

  if (!text) {
    throw new Error(
      'Le serveur a renvoyé une réponse vide. Vérifiez les journaux PHP.'
    )
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(
      'Le serveur a renvoyé une réponse invalide. Vérifiez les journaux PHP.'
    )
  }
}

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

  const result = await parseResponse(response)

  if (!response.ok || !result.success) {
    if (response.status === 401 || response.status === 403) {
      sessionStorage.removeItem('csrfToken')
    }

    throw new Error(
      result.message || 'Une erreur est survenue lors de la communication avec le serveur.'
    )
  }

  return result.data
}

/**
 * Récupérer les profils compatibles.
 * @param {Object} params
 * @param {number} params.limit Nombre de profils demandés.
 * @param {number|null} params.after Dernier identifiant reçu.
 */
export async function getDiscoverProfiles({
  limit = 12,
  after = null,
} = {}) {
  const query = new URLSearchParams({
    limit: String(limit),
  })

  if (after !== null) {
    query.set('after', String(after))
  }

  return apiRequest(`/discover?${query.toString()}`)
}

/**
 * Enregistrer la consultation d'un profil.
 * @param {number} profileId Identifiant du profil consulté.
 */
export async function recordProfileView(profileId) {
  return apiRequest('/discover/view', {
    method: 'POST',
    body: JSON.stringify({
      profile_id: profileId,
    }),
  })
}
