
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Mail, ArrowLeft, LoaderCircle, CheckCircle2 } from 'lucide-react'
import './ForgotPassword.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (status === 'loading') return

    setStatus('loading')
    setMessage('')

    try {
           // 1. Récupérer le jeton CSRF
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
        setStatus('error')
        setMessage('Impossible de sécuriser la demande. Réessaie.')
        return
      }

      // 2. Envoyer la demande avec le jeton
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': csrfResult.data.csrfToken,
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setStatus('error')
        setMessage(
          result.message || 'Une erreur est survenue. Réessaie plus tard.'
        )
        return
      }

      setStatus('success')
      setMessage(result.message)
    } catch (error) {
      console.error('Erreur de réinitialisation :', error)

      setStatus('error')
      setMessage(
        'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.'
      )
    }
  }

  return (
    <main className="forgot-password-page">
      <section className="forgot-password-card">

        <Link to="/" className="forgot-password-logo">
          Amoria <Heart size={21} fill="currentColor" />
        </Link>

        {status === 'success' ? (
          <>
            <div className="forgot-password-icon success">
              <CheckCircle2 size={42} />
            </div>

            <span className="forgot-password-eyebrow">
              DEMANDE ENREGISTRÉE
            </span>

            <h1>Vérifiez votre boîte mail.</h1>

            <p className="forgot-password-description">
              {message}
            </p>

            <p className="forgot-password-secondary">
              Pensez également à vérifier vos courriers indésirables.
              Le lien de réinitialisation est valable pendant 30 minutes.
            </p>

            <Link to="/login" className="forgot-password-button">
              Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <div className="forgot-password-icon">
              <Mail size={40} />
            </div>

            <span className="forgot-password-eyebrow">
              RÉCUPÉRATION DU COMPTE
            </span>

            <h1>Mot de passe oublié ?</h1>

            <p className="forgot-password-description">
              Cela arrive. Indiquez l'adresse e-mail associée à votre
              compte et nous vous enverrons un lien pour créer un
              nouveau mot de passe.
            </p>

            <form
              onSubmit={handleSubmit}
              className="forgot-password-form"
            >
              <div className="forgot-password-field">
                <label htmlFor="forgot-email">
                  Adresse e-mail
                </label>

                <input
                  id="forgot-email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={status === 'loading'}
                />
              </div>

              {message && (
                <p className="forgot-password-feedback error" role="alert">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="forgot-password-button"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <LoaderCircle size={19} className="forgot-spinner" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le lien de réinitialisation'
                )}
              </button>
            </form>

            <Link to="/login" className="forgot-password-back">
              <ArrowLeft size={17} />
              Retour à la connexion
            </Link>
          </>
        )}

        <p className="forgot-password-footer">
          Des rencontres qui ont du sens.
        </p>

      </section>
    </main>
  )
}

export default ForgotPassword
