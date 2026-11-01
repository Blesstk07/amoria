import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Menu, X, ArrowUpRight } from 'lucide-react'
import './Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  // Fermeture du menu mobile avec la touche Échap
  useEffect(() => {
    if (!menuOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  return (
    <header className="navbar">
      <div className="navbar-container">

        <a
          href="#accueil"
          className="navbar-logo"
          onClick={closeMenu}
        >
          Amoria
          <span>
            <Heart size={17} fill="currentColor" />
          </span>
        </a>

        <nav
          id="main-navigation"
          className={`navbar-links ${menuOpen ? 'active' : ''}`}
          aria-label="Navigation principale"
        >
          <a href="#accueil" onClick={closeMenu}>
            Accueil
          </a>

          <a href="#concept" onClick={closeMenu}>
            Notre Concept
          </a>

          <a href="#securite" onClick={closeMenu}>
            Sécurité
          </a>

          <a href="#premium" onClick={closeMenu}>
            Premium
          </a>

          <div className="navbar-mobile-actions">
            <Link
              to="/login"
              className="navbar-login"
              onClick={closeMenu}
            >
              Connexion
            </Link>

            <Link
              to="/register"
              className="navbar-register"
              onClick={closeMenu}
            >
              Créer un compte <ArrowUpRight size={16} />
            </Link>
          </div>
        </nav>

        <div className="navbar-actions">
          <Link to="/login" className="navbar-login">
            Connexion
          </Link>

          <Link to="/register" className="navbar-register">
            S'inscrire <ArrowUpRight size={16} />
          </Link>
        </div>

        <button
          type="button"
          className="navbar-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={
            menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'
          }
          aria-expanded={menuOpen}
          aria-controls="main-navigation"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

      </div>
    </header>
  )
}

export default Navbar
