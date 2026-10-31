
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Register.css'

const availableInterests = [
  'Voyages',
  'Musique',
  'Cinéma',
  'Lecture',
  'Sport',
  'Cuisine',
  'Technologie',
  'Nature',
  'Art et culture',
  'Entrepreneuriat',
  'Photographie',
  'Spiritualité'
]

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return 0

  const today = new Date()
  const birthDate = new Date(`${dateOfBirth}T00:00:00`)

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age
}

function Register() {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    pseudonym: '',
    dateOfBirth: '',
    gender: '',
    country: 'République démocratique du Congo',
    city: '',
    bio: '',
    interests: [],
    acceptedTerms: false,
    confirmedAdult: false
  })

  function updateField(event) {
    const { name, value, type, checked } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }))

    setError('')
  }

  function toggleInterest(interest) {
    setFormData((previous) => ({
      ...previous,
      interests: previous.interests.includes(interest)
        ? previous.interests.filter((item) => item !== interest)
        : [...previous.interests, interest]
    }))

    setError('')
  }

  function nextStep(event) {
    event.preventDefault()
    setError('')

    if (step === 1) {
      if (formData.password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.')
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Les deux mots de passe ne correspondent pas.')
        return
      }
    }

    if (step === 2) {
      const age = calculateAge(formData.dateOfBirth)

      if (age < 18) {
        setError('Amoria est réservé aux personnes âgées de 18 ans ou plus.')
        return
      }

      if (age > 120) {
        setError('Veuillez vérifier votre date de naissance.')
        return
      }
    }

    setStep((previous) => Math.min(previous + 1, 4))
  }

  function previousStep() {
    setError('')
    setMessage('')
    setStep((previous) => Math.max(previous - 1, 1))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (formData.interests.length === 0) {
      setError('Sélectionnez au moins un centre d’intérêt.')
      return
    }

    if (!formData.confirmedAdult || !formData.acceptedTerms) {
      setError('Confirmez votre majorité et acceptez les conditions.')
      return
    }

    setMessage(
      "Votre formulaire est prêt. La création du compte et la vérification de votre e-mail seront activées avec notre API PHP."
    )
  }

  return (
    <main className="register-page">

      {/* Présentation visuelle */}
      <aside className="register-visual">
        <div className="register-visual-overlay" />

        <Link to="/" className="register-brand">
          amoria <span>♥</span>
        </Link>

        <div className="register-visual-content">
          <span className="register-eyebrow">BIENVENUE DANS NOTRE UNIVERS</span>

          <h1>
            Une belle histoire
            <br />
            commence parfois
            <br />
            par un <em>simple bonjour.</em>
          </h1>

          <p>
            Créez votre espace, exprimez votre personnalité
            et découvrez des personnes qui vous ressemblent.
          </p>
        </div>

        <p className="register-visual-bottom">
          Des rencontres qui ont du sens.
        </p>
      </aside>

      {/* Formulaire d'inscription */}
      <section className="register-form-section">

        <div className="register-form-container">

          <Link to="/" className="register-mobile-brand">
            amoria <span>♥</span>
          </Link>

          <div className="register-heading">
            <span className="register-small-title">REJOIGNEZ AMORIA</span>
            <h2>Créons votre compte.</h2>
            <p>
              Quelques étapes suffisent pour commencer votre aventure.
            </p>
          </div>

          {/* Progression */}
          <div className="register-progress">
            <div className="register-progress-label">
              <span>Étape {step} sur 4</span>
              <span>{step * 25}%</span>
            </div>

            <div className="register-progress-track">
              <div
                className="register-progress-fill"
                style={{ width: `${step * 25}%` }}
              />
            </div>

            <div className="register-step-labels">
              <span className={step >= 1 ? 'active' : ''}>Compte</span>
              <span className={step >= 2 ? 'active' : ''}>Identité</span>
              <span className={step >= 3 ? 'active' : ''}>Profil</span>
              <span className={step >= 4 ? 'active' : ''}>Intérêts</span>
            </div>
          </div>

          <form
            className="register-form"
            onSubmit={step === 4 ? handleSubmit : nextStep}
          >

            {/* ÉTAPE 1 : COMPTE */}
            {step === 1 && (
              <div className="register-step-content">
                <div className="register-step-heading">
                  <span>01</span>
                  <div>
                    <h3>Vos identifiants</h3>
                    <p>Commençons par sécuriser votre compte.</p>
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="register-email">Adresse e-mail</label>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="exemple@email.com"
                    value={formData.email}
                    onChange={updateField}
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-password">Mot de passe</label>

                  <div className="register-password-wrapper">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      placeholder="Au moins 8 caractères"
                      value={formData.password}
                      onChange={updateField}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="register-confirm-password">
                    Confirmer le mot de passe
                  </label>

                  <div className="register-password-wrapper">
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      placeholder="Saisissez à nouveau le mot de passe"
                      value={formData.confirmPassword}
                      onChange={updateField}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? 'Masquer' : 'Afficher'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : IDENTITÉ */}
            {step === 2 && (
              <div className="register-step-content">
                <div className="register-step-heading">
                  <span>02</span>
                  <div>
                    <h3>Faisons connaissance</h3>
                    <p>Quelques informations pour vous identifier.</p>
                  </div>
                </div>

                <div className="register-field">
                  <label htmlFor="register-pseudonym">Votre pseudonyme</label>
                  <input
                    id="register-pseudonym"
                    type="text"
                    name="pseudonym"
                    placeholder="Comment souhaitez-vous être appelé ?"
                    value={formData.pseudonym}
                    onChange={updateField}
                    minLength={2}
                    maxLength={40}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-birthdate">Date de naissance</label>
                  <input
                    id="register-birthdate"
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={updateField}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <small>
                    Cette information restera confidentielle.
                  </small>
                </div>

                <div className="register-field">
                  <label htmlFor="register-gender">Genre</label>
                  <select
                    id="register-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={updateField}
                    required
                  >
                    <option value="">Sélectionnez une option</option>
                    <option value="MAN">Homme</option>
                    <option value="WOMAN">Femme</option>
                  </select>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : PROFIL */}
            {step === 3 && (
              <div className="register-step-content">
                <div className="register-step-heading">
                  <span>03</span>
                  <div>
                    <h3>Votre univers</h3>
                    <p>Présentez votre environnement et votre personnalité.</p>
                  </div>
                </div>

                <div className="register-field">
                <label htmlFor="register-country">Pays de résidence</label>
                  <input
                    id="register-country"
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={updateField}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-city">Ville</label>
                  <input
                    id="register-city"
                    type="text"
                    name="city"
                    placeholder="Ex. : Kinshasa"
                    value={formData.city}
                    onChange={updateField}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="register-field">
                  <label htmlFor="register-bio">
                    Quelques mots sur vous
                  </label>
                  <textarea
                    id="register-bio"
                    name="bio"
                    placeholder="Parlez de votre personnalité, de vos passions et de ce qui vous anime..."
                    value={formData.bio}
                    onChange={updateField}
                    maxLength={500}
                    rows={5}
                  />
                  <small>{formData.bio.length}/500 caractères</small>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : INTÉRÊTS */}
            {step === 4 && (
              <div className="register-step-content">
                <div className="register-step-heading">
                  <span>04</span>
                  <div>
                    <h3>Ce qui vous passionne</h3>
                    <p>Sélectionnez les sujets qui vous intéressent.</p>
                  </div>
                </div>

                <div className="register-interests">
                  {availableInterests.map((interest) => (
                    <label
                      key={interest}
                      className={
                        formData.interests.includes(interest)
                          ? 'register-interest selected'
                          : 'register-interest'
                      }
                    >
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(interest)}
                        onChange={() => toggleInterest(interest)}
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>

                <p className="register-interest-count">
                  {formData.interests.length} centre(s) d'intérêt sélectionné(s)
                </p>

                <div className="register-consents">
                  <label className="register-consent">
                    <input
                      type="checkbox"
                      name="confirmedAdult"
                      checked={formData.confirmedAdult}
                      onChange={updateField}
                    />
                    <span>
                      Je confirme avoir au moins 18 ans.
                    </span>
                  </label>

                  <label className="register-consent">
                    <input
                      type="checkbox"
                      name="acceptedTerms"
                      checked={formData.acceptedTerms}
                      onChange={updateField}
                    />
                    <span>
                      J'accepte les <Link to="/terms">conditions d'utilisation </Link>
                      et la <Link to="/privacy">politique de confidentialité</Link>.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            {message && (
              <p className="register-success" role="status">
                {message}
              </p>
            )}

            <div className="register-actions">
              {step > 1 && (
                <button
                  type="button"
                  className="register-back"
                  onClick={previousStep}
                >
                  ← Retour
                </button>
              )}

              <button
                type="submit"
                className="register-next"
                disabled={Boolean(message)}
              >
                {step === 4 ? 'Créer mon compte' : 'Continuer'}
                <span>→</span>
              </button>
            </div>

          </form>

          <div className="register-login">
            Vous avez déjà un compte ?
            <Link to="/login">Connexion</Link>
          </div>

          <p className="register-security-note">
            ♥ Vos informations personnelles restent confidentielles.
          </p>

        </div>
      </section>
    </main>
  )
}

export default Register
