
import './Footer.css'

function HeartIcon({ size = 19 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7 17 17 7M7 7h10v10" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="18" cy="6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  )
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-container">

        <div className="footer-main">

          <div className="footer-brand">
            <a href="#accueil" className="footer-logo">
              amoria
              <HeartIcon size={19} />
            </a>

            <p>
              Des rencontres qui ont du sens.
              Parce que chaque belle histoire mérite de commencer quelque part.
            </p>

            <div className="footer-socials">
              <a href="https://www.instagram.com/" aria-label="Instagram" target="_blank" rel="noreferrer">
                <InstagramIcon />
              </a>

              <a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noreferrer">
                <span className="footer-facebook-icon">f</span>
              </a>

              <a href="mailto:contact@amoria.com" aria-label="E-mail">
                <MailIcon />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Découvrir</h3>
            <a href="#accueil">Accueil</a>
            <a href="#concept">Notre concept</a>
            <a href="#securite">Sécurité</a>
            <a href="#premium">Premium</a>
          </div>

          <div className="footer-column">
            <h3>Informations</h3>
            <a href="/about">À propos</a>
            <a href="/privacy">Confidentialité</a>
            <a href="/terms">Conditions d'utilisation</a>
            <a href="/safety">Conseils de sécurité</a>
          </div>

          <div className="footer-column footer-contact">
            <h3>Une question ?</h3>
            <p>Notre équipe sera ravie de vous accompagner.</p>

            <a href="mailto:contact@amoria.com" className="footer-contact-link">
              Nous contacter
              <ArrowIcon />
            </a>
          </div>

        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Amoria. Tous droits réservés.
          </p>

          <span>
            Fait avec <HeartIcon size={16} /> pour des rencontres qui ont du sens.
          </span>

          <a href="#accueil" className="footer-back-top">
            Retour en haut ↑
          </a>
        </div>

      </div>
    </footer>
  )
}

export default Footer
