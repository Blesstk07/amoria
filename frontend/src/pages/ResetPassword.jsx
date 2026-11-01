
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Heart,
  LockKeyhole,
  Eye,
  EyeOff,
  LoaderCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import './ResetPassword.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (status === 'loading') return

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setStatus('error')
      setMessage('Le lien de réinitialisation est invalide ou incomplet.')
      return
    }

    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setStatus('error')
      setMessage('Le mot de passe doit contenir entre 8 et 72 octets.')
      return
    }

    if (password !== passwordConfirmation) {
      setStatus('error')
      setMessage('Les deux mots de passe ne correspondent pas.')
      return
    }

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

      // 2. Envoyer le nouveau mot de passe avec le jeton
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-CSRF-Token': csrfResult.data.csrfToken,
        },
        body: JSON.stringify({
          token,
          password,
          passwordConfirmation,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setStatus('error')
        setMessage(
          result.message || 'La réinitialisation a échoué. Réessaie.'
        )
        return
      }

      setStatus('success')
      setMessage(result.message)
      setPassword('')
      setPasswordConfirmation('')
    } catch (error) {
      console.error('Erreur de réinitialisation :', error)
      setStatus('error')
      setMessage(
        'Impossible de contacter le serveur. Vérifie ta connexion et réessaie.'
      )
    }
  }

  const invalidToken = !token || !/^[a-f0-9]{64}$/i.test(token)

  return (
    <main className="reset-password-page">
      <section className="reset-password-card">

        <Link to="/" className="reset-password-logo">
          Amoria <Heart size={21} fill="currentColor" />
        </Link>

        {status === 'success' ? (
          <>
            <div className="reset-password-icon success">
              <CheckCircle2 size={42} />
            </div>

            <span className="reset-password-eyebrow">
              MOT DE PASSE MODIFIÉ
            </span>

            <h1>Votre compte est de nouveau accessible.</h1>

            <p className="reset-password-description">
              {message}
            </p>

            <Link to="/login" className="reset-password-button">
              Se connecter
            </Link>
          </>
        ) : invalidToken ? (
          <>
            <div className="reset-password-icon error">
              <XCircle size={42} />
            </div>

            <span className="reset-password-eyebrow">
              LIEN INVALIDE
            </span>

            <h1>Ce lien n'est pas valide.</h1>

            <p className="reset-password-description">
              Le lien est incomplet ou son format est incorrect.
              Tu peux demander un nouveau lien de réinitialisation.
            </p>

            <Link to="/forgot-password" className="reset-password-button">
              Demander un nouveau lien
            </Link>
          </>
        ) : (
          <>
            <div className="reset-password-icon">
              <LockKeyhole size={40} />
            </div>

            <span className="reset-password-eyebrow">
              SÉCURITÉ DU COMPTE
            </span>

            <h1>Créer un nouveau mot de passe</h1>

            <p className="reset-password-description">
              Choisis un mot de passe sécurisé d'au moins 8 caractères.
            </p>

            <form onSubmit={handleSubmit} className="reset-password-form">
              <div className="reset-password-field">
                <label htmlFor="new-password">
                  Nouveau mot de passe
                </label>

                <div className="reset-password-input-wrapper">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                    required
                    disabled={status === 'loading'}
                  />

                  <button
                    type="button"
                    className="reset-password-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="reset-password-field">
                <label htmlFor="password-confirmation">
                  Confirmer le mot de passe
                </label>

                <div className="reset-password-input-wrapper">
                  <input
                    id="password-confirmation"
                    type={showConfirmation ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    placeholder="Répète ton nouveau mot de passe"
                    autoComplete="new-password"
                    required
                    disabled={status === 'loading'}
                  />

                  <button
                    type="button"
                    className="reset-password-eye"
                    onClick={() => setShowConfirmation(!showConfirmation)}
                    aria-label={showConfirmation ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                  >
                    {showConfirmation ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {message && (
                <p className="reset-password-feedback error" role="alert">
                  {message}
                </p>
              )}

              <button
                type="submit"
                className="reset-password-button"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <LoaderCircle size={19} className="reset-spinner" />
                    Modification en cours...
                  </>
                ) : (
                  'Modifier mon mot de passe'
                )}
              </button>
            </form>
          </>
        )}

        <p className="reset-password-footer">
          Des rencontres qui ont du sens.
        </p>

      </section>
    </main>
  )
}

export default ResetPassword
