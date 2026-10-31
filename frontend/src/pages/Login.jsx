
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Login.css'

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    setMessage(
      "L'interface est prête. La connexion sera activée après le raccordement à notre API."
    )
  }

  return (
    <main className="login-page">

      {/* Partie visuelle */}
      <section className="login-visual">
        <div className="login-visual-overlay" />

        <Link to="/" className="login-brand">
          amoria <span>♥</span>
        </Link>

        <div className="login-visual-content">
          <span className="login-eyebrow">BIENVENUE CHEZ AMORIA</span>

          <h1>
            Chaque belle histoire
            <br />
            mérite un nouveau
            <br />
            <em>chapitre.</em>
          </h1>

          <p>
            Retrouvez votre espace et poursuivez
            les rencontres qui comptent.
          </p>
        </div>

        <div className="login-visual-bottom">
          <span>Des rencontres qui ont du sens.</span>
          <span>© {new Date().getFullYear()} Amoria</span>
        </div>
      </section>

      {/* Formulaire */}
      <section className="login-form-section">

        <Link to="/" className="login-mobile-brand">
          amoria <span>♥</span>
        </Link>

        <div className="login-form-container">

          <div className="login-heading">
            <span className="login-small-title">VOTRE ESPACE PERSONNEL</span>

            <h2>Heureux de vous revoir.</h2>

            <p>
              Connectez-vous pour retrouver votre univers Amoria.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">

            <div className="login-field">
              <label htmlFor="login-email">Adresse e-mail</label>

              <input
                id="login-email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="login-password">Mot de passe</label>

                <Link to="/forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>

              <div className="login-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
            </div>

            {message && (
              <p className="login-feedback" role="status">
                {message}
              </p>
            )}

            <button type="submit" className="login-submit">
              Se connecter
              <span>→</span>
            </button>

          </form>

          <div className="login-register">
            Vous n'avez pas encore de compte ?
            <Link to="/register">Créer un compte</Link>
          </div>

          <div className="login-security">
            <span>♥</span>
            Vos données personnelles restent protégées.
          </div>

        </div>
      </section>

    </main>
  )
}

export default Login
