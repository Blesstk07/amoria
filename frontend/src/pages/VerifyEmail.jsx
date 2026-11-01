import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, LoaderCircle, Heart } from 'lucide-react'
import './VerifyEmail.css'

function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState(
    'Nous vérifions ton adresse e-mail...'
  )

  // Évite le double appel de l'API en mode développement React StrictMode.
  const requestStarted = useRef(false)

  useEffect(() => {
    if (requestStarted.current) return

    requestStarted.current = true

    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Le lien de vérification est incomplet ou invalide.')
        return
      }

      // Même format que celui attendu par le backend.
      if (!/^[a-f0-9]{64}$/.test(token)) {
        setStatus('error')
        setMessage('Le format du lien de vérification est invalide.')
        return
      }

      try {
        // 1. Récupérer le jeton CSRF.
        const csrfResponse = await fetch('/api/csrf-token', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        })

        const csrfResult = await csrfResponse.json().catch(() => null)

        if (
          !csrfResponse.ok ||
          !csrfResult?.success ||
          !csrfResult.data?.csrfToken
        ) {
          throw new Error(
            'Impossible de sécuriser la vérification. Réessaie.'
          )
        }

        // 2. Vérifier l'adresse avec le jeton CSRF.
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-CSRF-Token': csrfResult.data.csrfToken,
          },
          body: JSON.stringify({ token }),
        })

        const result = await response.json().catch(() => null)

        if (!response.ok || !result?.success) {
          setStatus('error')
          setMessage(
            result?.message ||
              'La vérification de ton adresse e-mail a échoué.'
          )
          return
        }

        setStatus('success')
        setMessage(result.message)
      } catch (error) {
        console.error('Erreur de vérification :', error)

        setStatus('error')
        setMessage(
          error.message ||
            'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.'
        )
      }
    }

    verifyEmail()
  }, [token])

  return (
    <main className="verify-email-page">
      <section className="verify-email-card">
        <Link to="/" className="verify-email-logo">
          Amoria <Heart size={20} fill="currentColor" />
        </Link>

        <div className={`verify-email-icon ${status}`}>
          {status === 'loading' && (
            <LoaderCircle size={42} className="verify-spinner" />
          )}

          {status === 'success' && (
            <CheckCircle2 size={42} />
          )}

          {status === 'error' && (
            <XCircle size={42} />
          )}
        </div>

        {status === 'loading' && (
          <>
            <h1>Vérification en cours</h1>
            <p>{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>Adresse vérifiée !</h1>
            <p>{message}</p>
            <p className="verify-email-secondary">
              Ton adresse e-mail est maintenant confirmée. Tu peux poursuivre
              ton inscription sur Amoria.
            </p>
            <Link to="/login" className="verify-email-button">
              Se connecter
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Vérification impossible</h1>
            <p>{message}</p>
            <p className="verify-email-secondary">
              Le lien peut être expiré, déjà utilisé ou incorrect.
            </p>
            <Link to="/" className="verify-email-button">
              Retour à l'accueil
            </Link>
          </>
        )}

        <p className="verify-email-footer">
          Des rencontres qui ont du sens.
        </p>
      </section>
    </main>
  )
}

export default VerifyEmail